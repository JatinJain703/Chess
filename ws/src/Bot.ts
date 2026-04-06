import { spawn, ChildProcess } from "child_process";
import { createRequire } from "module";
import { Chess } from "chess.js";

const require = createRequire(import.meta.url);

const stockfishPath = require.resolve("stockfish/bin/stockfish-18-asm.js");
console.log("Stockfish path:", stockfishPath);
export interface Bot {
    type: "bot";
    skill: number;
    movetime: number;
    engine: ChildProcess;
}

export interface MoveAnalysis {
    move: string;
    evalBefore: number;
    evalAfter: number;
    mateBefore: number | null;
    mateAfter: number | null;
    classification: string;
    bestMove: string;
    pvLine: string[];
    newlyAttacked: string[];
    defendedAfter: string[];
}

interface CoachFeedback {
    summary: string;
    pros: string[];
    cons: string[];
    suggestion: string;
    threats: string[];
}

export function createBot(skill: number, movetime: number): Bot {
    const engine = spawn("node", [stockfishPath], {
        stdio: ["pipe", "pipe", "pipe"],
    });

    return { type: "bot", skill, movetime, engine };
}

export function sendToEngine(bot: Bot, cmd: string) {
    bot.engine.stdin?.write(cmd + "\n");
}

function generateCoachAnalysis(analysis: MoveAnalysis) {
    const result = {
        summary: "",
        pros: [] as string[],
        cons: [] as string[],
        suggestion: "",
        threats: [] as string[],
    };

    const diff = analysis.evalAfter - analysis.evalBefore;


    switch (analysis.classification) {
        case "Brilliant !!":
            result.summary = "🔥 Brilliant move! You found a very strong idea.";
            break;
        case "Good !":
            result.summary = "✅ Good move. You improved your position.";
            break;
        case "Neutral":
            result.summary = "👍 Decent move, but there were better options.";
            break;
        case "Inaccuracy ?":
            result.summary = "⚠️ Inaccuracy. You missed a better move.";
            break;
        case "Mistake ??":
            result.summary = "❌ Mistake. This worsens your position.";
            break;
        case "Blunder ???":
            result.summary = "💀 Blunder! This loses material or a winning position.";
            break;
        default:
            result.summary = `${analysis.move} played.`;
    }

    if (analysis.defendedAfter.length > 0) {
        result.pros.push(
            `Defends: ${analysis.defendedAfter.join(", ")}`
        );
    }

    if (diff > 50) {
        result.pros.push("Improves your position significantly");
    }


    if (analysis.newlyAttacked.length > 0) {
        result.cons.push(
            `Leaves vulnerable: ${analysis.newlyAttacked.join(", ")}`
        );
    }

    if (diff < -100) {
        result.cons.push("Loses material or positional advantage");
    }


    if (analysis.newlyAttacked.length > 0) {
        result.threats.push(
            ...analysis.newlyAttacked.slice(0, 2).map(p => `Opponent can attack ${p}`)
        );
    }

    if (analysis.mateAfter !== null && analysis.mateAfter < 0) {
        result.threats.push("You are getting checkmated!");
    }

    const pv = analysis.pvLine.slice(0, 3).join(" ");

    if (pv.length > 0) {
        if (analysis.classification.includes("Blunder") || analysis.classification.includes("Mistake")) {
            result.suggestion = `After your move, opponent can respond: ${pv}`;
        } else if (analysis.classification.includes("Inaccuracy")) {
            result.suggestion = `A possible continuation is: ${pv}`;
        } else {
            result.suggestion = `Strong continuation: ${pv}`;
        }
    } else {
        result.suggestion = "Try improving piece activity and king safety.";
    }

    return result;
}

function getEval(bot: Bot, fen: string): Promise<{
    score: number;
    mate: number | null;
    pv: string[];
}> {
    return new Promise((resolve) => {
        let lastInfo = { score: 0, mate: null as number | null, pv: [] as string[] };
        
        sendToEngine(bot, "uci");
        const handler = (data: Buffer) => {
            const lines = data.toString().split("\n");
            for (const line of lines) {
                if (line === "uciok") {
                    sendToEngine(bot, "isready");
                }
                if (line === "readyok") {
                    sendToEngine(bot, `setoption name Skill Level value ${bot.skill}`);
                    sendToEngine(bot, `position fen ${fen}`);
                    sendToEngine(bot, `go movetime ${bot.movetime}`);
                }
                if (line.startsWith("info") && line.includes("score")) {
                    const mateMatch = line.match(/score mate (-?\d+)/);
                    const cpMatch = line.match(/score cp (-?\d+)/);
                    const pvMatch = line.match(/ pv (.+)/);

                    if (mateMatch) {
                        lastInfo.mate = parseInt(mateMatch[1]!);
                        lastInfo.score = mateMatch[1]!.startsWith("-") ? -99999 : 99999;
                    } else if (cpMatch) {
                        lastInfo.score = parseInt(cpMatch[1]!);
                        lastInfo.mate = null;
                    }

                    if (pvMatch) {
                        lastInfo.pv = pvMatch[1]!.trim().split(" ").slice(0, 5);
                    }
                }
                if (line.startsWith("bestmove")) {
                    bot.engine.stdout?.off("data", handler);
                    resolve(lastInfo);
                    return;
                }
            }
        };
        bot.engine.stdout?.on("data", handler);
    });
}


function getAttackedPieces(chess: Chess): string[] {
    const attacked: string[] = [];
    const board = chess.board();

    board.forEach((row) => {
        row.forEach((cell) => {
            if (!cell) return;
            const sq = cell.square;

            if (chess.isAttacked(sq, cell.color === "w" ? "b" : "w")) {
                attacked.push(`${cell.color === "w" ? "White" : "Black"} ${cell.type.toUpperCase()} on ${sq}`);
            }
        });
    });

    return attacked;
}

function classifyMove(
    evalBefore: number,
    evalAfter: number,
    turn: "w" | "b",
    newlyAttackedOwnPieces: number   
): string {
    const delta = evalAfter - evalBefore;

    const hangingPenalty = newlyAttackedOwnPieces * 30;
   
    const adjustedDelta = turn === "w"
        ? delta - hangingPenalty
        : delta + hangingPenalty;

    const playerDelta = turn === "w" ? adjustedDelta : -adjustedDelta;

    if (playerDelta >= 50) return "Brilliant !!";
    if (playerDelta >= 20) return "Good !";
    if (playerDelta >= -20) return "Neutral";
    if (playerDelta >= -80) return "Inaccuracy ?";
    if (playerDelta >= -200) return "Mistake ??";
    return "Blunder ???";
}

export async function analyzeMove(
    fenBeforeMove: string,
    move: { from: string; to: string; promotion?: string }
): Promise<CoachFeedback | null> {
    const tempBefore = new Chess(fenBeforeMove);
    const turn = tempBefore.turn();


    const san = tempBefore.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion ?? "q",
    });

    if (!san) return null;

    const fenAfterMove = tempBefore.fen();


    const botBefore = createBot(15, 1000);
    const botAfter = createBot(15, 1000);

    try {
        
        const beforeResult = await getEval(botBefore, fenBeforeMove);
        const afterResult = await getEval(botAfter, fenAfterMove);
       
        const normalizedBefore = turn === "b" ? -beforeResult.score : beforeResult.score;
        const turnAfter = turn === "w" ? "b" : "w";
        const normalizedAfter = turnAfter === "b" ? -afterResult.score : afterResult.score;
       
        const beforeBoard = new Chess(fenBeforeMove);
        const afterBoard = new Chess(fenAfterMove);
        const attackedBefore = getAttackedPieces(beforeBoard);
        const attackedAfter = getAttackedPieces(afterBoard);

        const newlyAttacked = attackedAfter.filter(
            p => !attackedBefore.includes(p) && p.startsWith("White")  
        );
        const defendedAfter = attackedBefore.filter(
            p => !attackedAfter.includes(p) && p.startsWith("White")  
        );

        const bestMove = beforeResult.pv[0] ?? "";
        const pvFromTo = afterResult.pv.map(uci => `${uci.slice(0, 2)}-${uci.slice(2, 4)}`);
        const analysis: MoveAnalysis = {
            move: san.san,
            evalBefore: normalizedBefore,
            evalAfter: normalizedAfter,
            mateBefore: beforeResult.mate,
            mateAfter: afterResult.mate,
            classification: classifyMove(
                normalizedBefore,
                normalizedAfter,
                turn,
                newlyAttacked.length
            ),
            bestMove: bestMove,
            pvLine: pvFromTo,
            newlyAttacked,
            defendedAfter,
        }

        const feedback = generateCoachAnalysis(analysis);
        
        return feedback;

    } finally {

        botBefore.engine.kill();
        botAfter.engine.kill();
    }
}
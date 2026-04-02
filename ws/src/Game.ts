import { Chess } from "chess.js";
import WebSocket from "ws";
import prisma from "./prismaclient.js";
import { type Square } from "chess.js";
import { MOVE, GAME_OVER, INVALID_MOVE } from "./messages.js";
import { type Bot, sendToEngine } from "./Bot.js";
interface User {
    id: number,
    socket: WebSocket
    name: string
}

type Player = User | Bot;

function isUser(p: Player): p is User {
    return (p as Bot).type !== "bot";
}

function isBot(p: Player): p is Bot {
    return (p as Bot).type === "bot";
}
export class Game {
    public whiteplayer: User;
    public blackplayer: Player;
    public gameId: string;
    public board: Chess;
    public moves: string[];
    public startTime: Date;
    private endTime: Date | null;
    public moveCount = 0;
    public fenHistory: string[];
    private onEnd: (gameId: string) => void
    public whitedisconnectedAt: number | null = null;
    public blackdisconnectedAt: number | null = null;
    public disconnectTimer: NodeJS.Timeout | null = null

    constructor(player1: User, player2: Player, gameId: string, onEnd: (gameId: string) => void) {
        this.whiteplayer = player1;
        this.blackplayer = player2;
        this.gameId = gameId;
        this.board = new Chess();
        this.moves = [];
        this.startTime = new Date();
        this.endTime = null;
        this.fenHistory = [this.board.fen()];
        this.onEnd = onEnd;
        this.whitedisconnectedAt = null;
        this.blackdisconnectedAt = null;
        this.disconnectTimer = null;

       if (isBot(this.blackplayer)) {
  const bot = this.blackplayer;
  sendToEngine(bot, "uci");
  sendToEngine(bot, "isready");
  sendToEngine(bot, `setoption name Skill Level value ${bot.skill}`);
}
    }

   private makeBotMove(): Promise<void> {
  return new Promise((resolve) => {
    if (!isBot(this.blackplayer)) return resolve();
    const bot = this.blackplayer;

    sendToEngine(bot, `position fen ${this.board.fen()}`);
    sendToEngine(bot, `go movetime ${bot.movetime}`);

    const handler = async (data: Buffer) => {
      const lines = data.toString().split("\n");
      for (const line of lines) {
        if (!line.startsWith("bestmove")) continue;

        // remove listener immediately
        bot.engine.stdout?.off("data", handler);

        const bestMove = line.split(" ")[1];
        if (!bestMove || bestMove === "(none)") return resolve();

        const from  = bestMove.slice(0, 2);
        const to    = bestMove.slice(2, 4);
        const promo = bestMove[4];

        try {
          const m = this.board.move({ from, to, promotion: promo ?? "q" });
          if (!m) return resolve();

          this.moves.push(m.san);
          this.moveCount++;
          this.fenHistory.push(this.board.fen());

          this.whiteplayer.socket.send(JSON.stringify({
            type: MOVE,
            payload: { from, to },
            fen: this.board.fen(),
            turn: this.board.turn(),
          }));

          if (this.board.isGameOver()) {
            if (this.endTime !== null) return resolve();
            this.endTime = new Date();
            const { result, reason } = this.getResult();
            await this.storeindb(result, reason, this.gameId);
          }
        } catch (e) {
          console.log("Bot move error:", e);
        }

        resolve();
        return;
      }
    };

    bot.engine.stdout?.on("data", handler);
  });
}
    private getResult(): { result: string; reason: string } {
        if (this.board.isCheckmate()) {
            return {
                result: this.board.turn() === "w" ? "0-1" : "1-0",
                reason: "checkmate",
            };
        }
        if (this.board.isStalemate())
            return { result: "1/2-1/2", reason: "stalemate" };
        if (this.board.isInsufficientMaterial())
            return { result: "1/2-1/2", reason: "insufficient material" };
        if (this.board.isThreefoldRepetition())
            return { result: "1/2-1/2", reason: "threefold repetition" };
        if (this.board.isDraw())
            return { result: "1/2-1/2", reason: "50-move rule or draw" };
        return { result: "unknown", reason: "game ended unexpectedly" };
    }

    async storeindb(result: string, reason: string, gameId: string) {
        if (this.endTime === null) return;
        try {
            const existing = await prisma.game.findUnique({
                where: { id: gameId }
            });

            if (existing) {
                console.log("Game already stored, skipping...");
                return;
            }
            if (isUser(this.blackplayer)) {
                const savedgame = await prisma.game.create({
                    data: {
                        id: gameId,
                        whitePlayerId: this.whiteplayer.id,
                        blackPlayerId: this.blackplayer.id,
                        result: result,
                        reason: reason,
                        starttime: this.startTime,
                        endtime: this.endTime!
                    }
                });

                const moveData = this.moves.map((m, i) => ({
                    gameId: this.gameId,
                    playerId: i % 2 === 0 ? this.whiteplayer.id : (isUser(this.blackplayer) ? this.blackplayer.id : 0),
                    move: m,
                    fen: this.fenHistory[i + 1]!
                }));

                await prisma.move.createMany({
                    data: moveData
                });
            }
            this.whiteplayer.socket.send(
                JSON.stringify({ type: GAME_OVER, payload: { result, reason } })
            );

            if (isUser(this.blackplayer)) {
                this.blackplayer.socket.send(
                    JSON.stringify({ type: GAME_OVER, payload: { result, reason } })
                );
            }
            this.onEnd(this.gameId);
        } catch (e) {
            console.log("some backend error occured:", e);
        }
    }

    async makeMove(Socket: WebSocket, gameId: string, move: {
        from: string,
        to: string,
        promotion?: "q" | "r" | "b" | "n"; 
    }) {
        if (this.moveCount % 2 == 0 && Socket !== this.whiteplayer.socket)
            return;
        if (
            this.moveCount % 2 === 1 &&
            isUser(this.blackplayer) &&
            Socket !== this.blackplayer.socket
        ) return;

        try {
            const piece = this.board.get(move.from as Square);
            let finalMove = { ...move };
            if (
                piece?.type === "p" &&
                (move.to[1] === "8" || move.to[1] === "1")
            ) {
                finalMove.promotion = "q"; // default queen
            }
            const m = this.board.move(finalMove);
            if (!m) return;
            this.moves.push(m.san);
            this.moveCount++;
            this.fenHistory.push(this.board.fen());
            console.log("Move made:", move);
            this.whiteplayer.socket.send(
                JSON.stringify({
                    type: MOVE,
                    payload: move,
                    fen: this.board.fen(),
                    turn: this.board.turn()
                })
            );
            if (isUser(this.blackplayer)) {
                this.blackplayer.socket.send(JSON.stringify({
                    type: MOVE,
                    payload: move,
                    fen: this.board.fen(),
                    turn: this.board.turn(),
                }));
            }
        } catch (e) {
            console.log("Invalid move attempted:", move, "Error:", e);
            Socket.send(JSON.stringify({
                type: INVALID_MOVE,
                turn: this.board.turn(),
            }));
            return;
        }

        if (this.board.isGameOver()) {
            if (this.endTime !== null) return;
            this.endTime = new Date();
            const { result, reason } = this.getResult();
            await this.storeindb(result, reason, gameId);
            return;
        }
        if (isBot(this.blackplayer)) {
            await this.makeBotMove();
        }
    }
    async makeresign(Socket: WebSocket, gameId: string) {
        if (this.endTime !== null) return;
        this.endTime = new Date();

        let result: string;
        if (Socket === this.whiteplayer.socket) {
            result = "0-1";
        } else {
            result = "1-0";
        }

        await this.storeindb(result, "resignation", gameId);

    }
}
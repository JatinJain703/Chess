// src/screens/GameScreen.tsx
import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import type { Screen, GameInfo } from "../App.js";
import { Chess } from "chess.js";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

const PIECES: Record<string, string> = {
    K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
    k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
};

interface Analysis {
    summary: string;
    pros: string[];
    cons: string[];
    suggestion: string;
    threats: string[];
}


export default function GameScreen({
    ws,
    gameInfo,
    fen,
    goTo,
    isBotGame = false,
}: {
    ws: WebSocket | null;
    gameInfo: GameInfo;
    fen: string | null;
    goTo: (s: Screen) => void;
    isBotGame?: boolean;
}) {
    const [chess] = useState(() => new Chess());
    const [moveInput, setMoveInput] = useState("");
    const [error, setError] = useState("");
    const [inputMode, setInputMode] = useState<"move" | "analyze" | null>(null);
    const [turn, setTurn] = useState<"w" | "b">("w");
    const [analysis, setAnalysis] = useState<Analysis | null>(null);
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => {
        if (fen) {
            chess.load(fen);
            setTurn(chess.turn());
            // clear analysis when a real move is played
            setAnalysis(null);
            setAnalyzing(false);
        }
    }, [fen]);

    useEffect(() => {
        if (!ws) return;
        const handler = (e: MessageEvent) => {
            const data = JSON.parse(e.data);
            if (data.type === "invalid_move") {
                setError("✖ Invalid move — try again");
            }
            if (data.type === "move") {
                setError("");
            }
            if (data.type === "analyze_thinking") {
                setAnalyzing(true);
                setAnalysis(null);
                setError("");
            }
            if (data.type === "analyze_result") {
                setAnalyzing(false);
                if (data.error) {
                    setError(`✖ ${data.error}`);
                    setAnalysis(null);
                } else {
                    setAnalysis(data.analysis as Analysis);  // data.analysis, not data
                    setError("");
                }
            }
        };
        ws.addEventListener("message", handler);
        return () => ws.removeEventListener("message", handler);
    }, [ws]);

    const myTurn =
        (gameInfo.color === "white" && turn === "w") ||
        (gameInfo.color === "black" && turn === "b");

    useInput((input, key) => {
        if (inputMode) {
            if (key.escape) {
                setInputMode(null);
                setMoveInput("");
                setError("");
                return;
            }
            if (key.return) {
                if (inputMode === "move") sendMove();
                else sendAnalyze();
                return;
            }
            if (key.backspace || key.delete) {
                setMoveInput((m) => m.slice(0, -1));
                return;
            }
            if (input && !key.ctrl) {
                setMoveInput((m) => m + input);
            }
            return;
        }

        if (input === "m" && myTurn) { setInputMode("move"); setMoveInput(""); setError(""); }
        if (input === "a" && isBotGame) { setInputMode("analyze"); setMoveInput(""); setError(""); setAnalysis(null);setAnalyzing(false);  }
        if (input === "r") ws?.send(JSON.stringify({ type: "resign" }));
    });

    const sendMove = () => {
        if (moveInput.length < 4) { setError("✖ Format: e2e4"); return; }
        const from = moveInput.slice(0, 2);
        const to = moveInput.slice(2, 4);
        ws?.send(JSON.stringify({ type: "move", payload: { from, to } }));
        setMoveInput("");
        setInputMode(null);
    };

    const sendAnalyze = () => {
        if (moveInput.length < 4) { setError("✖ Format: e2e4"); return; }
        const from = moveInput.slice(0, 2);
        const to = moveInput.slice(2, 4);
        ws?.send(JSON.stringify({
            type: "analyze_move",
            gameid: gameInfo.gameId,
            from,
            to,
        }));
         setAnalyzing(true);
        setMoveInput("");
        setInputMode(null);
    };

    const renderBoard = () => {
        const board = chess.board();
        const rows = gameInfo.color === "black" ? [...board].reverse() : board;
        return rows.map((row, rowIdx) => {
            const rank = gameInfo.color === "black" ? rowIdx + 1 : 8 - rowIdx;
            const cols = gameInfo.color === "black" ? [...row].reverse() : row;
            return (
                <Box key={rowIdx}>
                    <Text color="yellow" dimColor>{rank} </Text>
                    {cols.map((cell, colIdx) => {
                        const isLight = (rowIdx + colIdx) % 2 === 0;
                        const piece = cell
                            ? (PIECES[cell.color === "w"
                                ? cell.type.toUpperCase()
                                : cell.type.toLowerCase()] ?? " ")
                            : " ";
                        return (
                            <Text
                                key={colIdx}
                                backgroundColor={isLight ? "white" : "gray"}
                                color={cell ? (cell.color === "w" ? "blue" : "magenta") : undefined}
                            >
                                {` ${piece} `}
                            </Text>
                        );
                    })}
                </Box>
            );
        });
    };

    const files = gameInfo.color === "black" ? [...FILES].reverse() : FILES;
    const underline = "─".repeat(48);
    const evalStr = (cp: number) =>
        cp > 0 ? `+${(cp / 100).toFixed(2)}` : `${(cp / 100).toFixed(2)}`;

    return (
        <Box
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            marginTop={2}
            marginBottom={2}
        >
            <Box
                flexDirection="column"
                borderStyle="round"
                borderColor="yellow"
                paddingX={3}
                paddingY={2}
                width={62}
            >
                {/* Top pieces */}
                <Box justifyContent="space-between" marginBottom={1}>
                    <Text color="yellow">♔ ♕ ♖</Text>
                    <Text color="yellow">♖ ♕ ♔</Text>
                </Box>

                {/* Players */}
                <Box justifyContent="space-between" marginBottom={1}>
                    <Box>
                        <Text color="white">♔ </Text>
                        <Text color="white">{gameInfo.whiteplayer}</Text>
                    </Box>
                    <Text color="yellow" dimColor>vs</Text>
                    <Box>
                        <Text color="yellow">♟ </Text>
                        <Text color="yellow">{gameInfo.blackplayer}</Text>
                    </Box>
                </Box>

                {/* Board */}
                <Box flexDirection="column" alignItems="center" marginBottom={1}>
                    {renderBoard()}
                    <Box>
                        <Text>{"   "}</Text>
                        {files.map((f) => (
                            <Text key={f} color="yellow" dimColor>{` ${f} `}</Text>
                        ))}
                    </Box>
                </Box>

                {/* Divider */}
                <Box justifyContent="center" marginBottom={1}>
                    <Text color="yellow" dimColor>{underline}</Text>
                </Box>

                {/* Turn */}
                <Box justifyContent="center" marginBottom={1}>
                    <Text dimColor>Turn  </Text>
                    <Text color={turn === "w" ? "white" : "yellow"} bold>
                        {turn === "w" ? "♔ White" : "♟ Black"}
                    </Text>
                    <Text color={myTurn ? "yellow" : "gray"}>
                        {myTurn ? "  ← your turn" : "  waiting..."}
                    </Text>
                </Box>

                {/* Move input */}
                <Box>
                    <Text color={inputMode === "move" ? "yellow" : myTurn ? "gray" : "gray"}>
                        {inputMode === "move" ? "▶ " : "  "}Move
                    </Text>
                </Box>
                <Box width={54} marginLeft={2}>
                    {inputMode === "move"
                        ? <Text color="yellow">{moveInput}_</Text>
                        : <Text dimColor>{myTurn ? "Press M to enter move" : "Wait for your turn..."}</Text>
                    }
                </Box>
                <Box marginBottom={1}>
                    <Text color={inputMode === "move" ? "yellow" : "gray"}>{underline}</Text>
                </Box>

                {/* Analyze input — only shown in bot mode */}
                {isBotGame && (
                    <>
                        <Box>
                            <Text color={inputMode === "analyze" ? "yellow" : "gray"}>
                                {inputMode === "analyze" ? "▶ " : "  "}Analyze
                            </Text>
                        </Box>
                        <Box width={54} marginLeft={2}>
                            {inputMode === "analyze"
                                ? <Text color="yellow">{moveInput}_</Text>
                                : <Text dimColor>Press A to analyze a move</Text>
                            }
                        </Box>
                        <Box marginBottom={1}>
                            <Text color={inputMode === "analyze" ? "yellow" : "gray"}>{underline}</Text>
                        </Box>
                    </>
                )}

                {/* Error — always one row */}
                <Box marginBottom={1}>
                    <Text color={error ? "red" : "yellow"} dimColor={!error}>
                        {error || " "}
                    </Text>
                </Box>

                {/* Analysis result — only shown when present */}
                {analyzing && (
                    <Box justifyContent="center" marginBottom={1}>
                        <Text color="yellow">♟  Analyzing...</Text>
                    </Box>
                )}

                {analysis && !analyzing && (
                    <>
                        <Box justifyContent="center" marginBottom={1}>
                            <Text color="yellow" dimColor>{underline}</Text>
                        </Box>

                        {/* Summary */}
                        <Box marginBottom={1} marginLeft={2}>
                            <Text dimColor>{analysis.summary}</Text>
                        </Box>

                        {/* Pros */}
                        {analysis.pros.length > 0 && (
                            <Box flexDirection="column" marginBottom={1} marginLeft={2}>
                                {analysis.pros.map((p, i) => (
                                    <Box key={i}>
                                        <Text color="green">✓ </Text>
                                        <Text dimColor>{p}</Text>
                                    </Box>
                                ))}
                            </Box>
                        )}

                        {/* Cons */}
                        {analysis.cons.length > 0 && (
                            <Box flexDirection="column" marginBottom={1} marginLeft={2}>
                                {analysis.cons.map((c, i) => (
                                    <Box key={i}>
                                        <Text color="red">✗ </Text>
                                        <Text dimColor>{c}</Text>
                                    </Box>
                                ))}
                            </Box>
                        )}

                        {/* Suggestion */}
                        <Box marginBottom={1} marginLeft={2}>
                            <Text color="yellow">→ </Text>
                            <Text dimColor>{analysis.suggestion}</Text>
                        </Box>

                        {/* Threats */}
                        {analysis.threats.length > 0 && (
                            <Box flexDirection="column" marginBottom={1} marginLeft={2}>
                                {analysis.threats.map((t, i) => (
                                    <Box key={i}>
                                        <Text color="red">⚠ </Text>
                                        <Text dimColor>{t}</Text>
                                    </Box>
                                ))}
                            </Box>
                        )}

                        <Box justifyContent="center" marginBottom={1}>
                            <Text color="yellow" dimColor>{underline}</Text>
                        </Box>
                    </>
                )}


                {/* Help */}
                <Box justifyContent="center" marginBottom={1}>
                    <Text dimColor>
                        {isBotGame
                            ? "M move  A analyze  R resign  Esc cancel  fmt: e2e4"
                            : "M move  R resign  Esc cancel  fmt: e2e4"}
                    </Text>
                </Box>

                {/* Bottom pieces */}
                <Box justifyContent="space-between">
                    <Text color="yellow">♚ ♛ ♜</Text>
                    <Text color="yellow">♜ ♛ ♚</Text>
                </Box>
            </Box>
        </Box>
    );
}
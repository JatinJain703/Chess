import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import type { Screen, GameInfo } from "../App.js";
import { Chess } from "chess.js";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

const PIECES: Record<string, string> = {
    K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
    k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
};

export default function GameScreen({
    ws,
    gameInfo,
    fen,
    goTo,
}: {
    ws: WebSocket | null;
    gameInfo: GameInfo;
    fen: string | null;
    goTo: (s: Screen) => void;
}) {
    const [chess] = useState(() => new Chess());
    const [moveInput, setMoveInput] = useState("");
    const [error, setError] = useState("");
    const [inputMode, setInputMode] = useState(false);
    const [turn, setTurn] = useState<"w" | "b">("w");

    useEffect(() => {
        if (fen) {
            chess.load(fen);
            setTurn(chess.turn());
        }
    }, [fen]);

    useEffect(() => {
        if (!ws) return;
        const handler = (e: MessageEvent) => {
            const data = JSON.parse(e.data);
            if (data.type === "invalid_move") setError("✖ Invalid move — try again");
            if (data.type === "move") setError("");
        };
        ws.addEventListener("message", handler);
        return () => ws.removeEventListener("message", handler);
    }, [ws]);

    const myTurn =
        (gameInfo.color === "white" && turn === "w") ||
        (gameInfo.color === "black" && turn === "b");

    useInput((input, key) => {
        if (inputMode) {
            if (key.escape) { setInputMode(false); setMoveInput(""); setError(""); }
            else if (key.return) { sendMove(); }
            else if (key.backspace || key.delete) { setMoveInput((m) => m.slice(0, -1)); }
            else if (input && !key.ctrl) { setMoveInput((m) => m + input); }
        } else {
            if (input === "m" && myTurn) setInputMode(true);
            if (input === "r") ws?.send(JSON.stringify({ type: "resign" }));
        }
    });

    const sendMove = () => {
        if (moveInput.length < 4) { setError("✖ Format: e2e4"); return; }
        const from = moveInput.slice(0, 2);
        const to = moveInput.slice(2, 4);
        ws?.send(JSON.stringify({ type: "move", payload: { from, to } }));
        setMoveInput("");
        setInputMode(false);
    };

    // exact same board render as original code
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
                    <Text color={myTurn ? "yellow" : "gray"}>
                        {inputMode ? "▶ " : "  "}Move
                    </Text>
                </Box>
                <Box width={54} marginLeft={2}>
                    {inputMode
                        ? <Text color="yellow">{moveInput}_</Text>
                        : <Text dimColor>{myTurn ? "Press M to enter move" : "Wait for your turn..."}</Text>
                    }
                </Box>
                <Box marginBottom={1}>
                    <Text color={inputMode ? "yellow" : "gray"}>{underline}</Text>
                </Box>

                {/* Error — always one row */}
                <Box marginBottom={1}>
                    <Text color={error ? "red" : "yellow"} dimColor={!error}>
                        {error || " "}
                    </Text>
                </Box>

                {/* Help */}
                <Box justifyContent="center" marginBottom={1}>
                    <Text dimColor>M move  R resign  Esc cancel  fmt: e2e4</Text>
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
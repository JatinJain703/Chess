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
    goTo
}: {
    ws: WebSocket | null;
    gameInfo: GameInfo;
    fen: string | null;
    goTo: (s: Screen) => void;
}) {
    const [chess] = useState(() => new Chess());
    const [moveInput, setMoveInput] = useState("");
    const [error, setError] = useState("");
    const [inputMode, setInputMode] = useState(false); // ← toggle between nav and input

    // update board when fen changes from server
    useEffect(() => {
        if (fen) chess.load(fen);
    }, [fen]);

    useInput((input, key) => {
        if (inputMode) {
            if (key.escape) {
                setInputMode(false);
                setMoveInput("");
                setError("");
            } else if (key.return) {
                sendMove();
            } else if (key.backspace || key.delete) {
                setMoveInput(m => m.slice(0, -1));
            } else if (input && !key.ctrl) {
                setMoveInput(m => m + input);
            }
        } else {
            if (input === "m") setInputMode(true);  // ← press M to enter move
            if (input === "r") {
                ws?.send(JSON.stringify({ type: "resign" }));
            }
        }
    });

    const sendMove = () => {
        if (moveInput.length < 4) {
            setError("Enter move like: e2e4");
            return;
        }

        const from = moveInput.slice(0, 2);
        const to = moveInput.slice(2, 4);

        ws?.send(JSON.stringify({
            type: "move",
            payload: { from, to }
        }));

        setMoveInput("");
        setInputMode(false);
        setError("");
    };

    const renderBoard = () => {
        const board = chess.board();
        // flip board if black
        const rows = gameInfo.color === "black" ? [...board].reverse() : board;

        return rows.map((row, rowIdx) => {
            const rank = gameInfo.color === "black" ? rowIdx + 1 : 8 - rowIdx;
            const cols = gameInfo.color === "black" ? [...row].reverse() : row;

            return (
                <Box key={rowIdx}>
                    <Text dimColor>{rank} </Text>
                    {cols.map((cell, colIdx) => {
                        const isLight = (rowIdx + colIdx) % 2 === 0;
                        const piece = cell ? PIECES[cell.color === "w"
                            ? cell.type.toUpperCase()
                            : cell.type.toLowerCase()] ?? " "
                            : " ";

                        return (
                            <Text
                                key={colIdx}
                                backgroundColor={isLight ? "white" : "gray"}
                                color={cell?.color === "w" ? "blue" : "red"}
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

    return (
        <Box flexDirection="row" marginTop={1} gap={4}>
            {/* Board */}
            <Box flexDirection="column">
                {renderBoard()}
                <Box>
                    <Text>  </Text>
                    {files.map(f => <Text key={f} dimColor>{` ${f} `}</Text>)}
                </Box>
            </Box>

            {/* Side Panel */}
            <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={2} paddingY={1} width={30}>
                <Text bold color="cyan">Game Info</Text>
                <Box marginTop={1} flexDirection="column">
                    <Text>⬜ {gameInfo.whiteplayer}</Text>
                    <Text>⬛ {gameInfo.blackplayer}</Text>
                </Box>

                <Box marginTop={1}>
                    <Text dimColor>You are </Text>
                    <Text color={gameInfo.color === "white" ? "white" : "gray"} bold>
                        {gameInfo.color}
                    </Text>
                </Box>

                <Box marginTop={1} flexDirection="column">
                    <Text bold color="cyan">Move Input</Text>
                    {inputMode ? (
                        <Box borderStyle="single" borderColor="cyan" paddingX={1} marginTop={1}>
                            <Text color="cyan">{moveInput}<Text color="cyan">_</Text></Text>
                        </Box>
                    ) : (
                        <Text dimColor>Press M to enter move</Text>
                    )}
                    {error && <Text color="red">{error}</Text>}
                </Box>

                <Box marginTop={2} flexDirection="column">
                    <Text dimColor>M - enter move</Text>
                    <Text dimColor>R - resign</Text>
                    <Text dimColor>Esc - cancel input</Text>
                    <Text dimColor>Format: e2e4</Text>
                </Box>
            </Box>
        </Box>
    );
}
// src/screens/JoinGame.tsx
import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import type { Screen } from "../App.js";

const underline = "─".repeat(48);

const JOIN_ART = [
  "░░▄░█ █▀█ █ █▄░█",
  "▄▄█▄█ █▄█ █ █░▀█",
];

interface Player { id: string; name: string; }
interface GameRoom { gameid: string; createdby: Player; players: Player[]; }

export default function JoinGame({
  ws, goTo,
}: { ws: WebSocket | null; goTo: (s: Screen) => void; }) {
  const [stage, setStage] = useState<"input" | "lobby">("input");
  const [gameId, setGameId] = useState("");
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ws) return;

    const handler = (e: MessageEvent) => {
      const data = JSON.parse(e.data);

      // backend sends { message: "Game does not exist" } or { message: "Game is full" }
      if (data.message && !data.type) {
        setError(`✖ ${data.message}`);
        return;
      }

      // backend sends { type: "player_joined", name, gameid, game } on successful join
      if (data.type === "player_joined" && data.game) {
        setGameRoom({
          gameid: data.game.gameid,
          createdby: { id: data.game.createdby.id, name: data.game.createdby.name },
          players: data.game.players.map((p: any) => ({ id: p.id, name: p.name })),
        });
        setStage("lobby");
        setError("");
        setMessage(`♟ ${data.name} joined`);
        return;
      }

      // another player left
      if (data.type === "player_left" && data.game) {
        setGameRoom({
          gameid: data.game.gameid,
          createdby: { id: data.game.createdby.id, name: data.game.createdby.name },
          players: data.game.players.map((p: any) => ({ id: p.id, name: p.name })),
        });
        setMessage(`♟ ${data.name} left`);
        return;
      }
    };

    ws.addEventListener("message", handler);
    return () => ws.removeEventListener("message", handler);
  }, [ws]);

  useInput((input, key) => {
    if (stage === "input") {
      if (key.escape) { goTo("menu"); return; }
      if (key.return) {
        if (!gameId.trim()) { setError("✖ Enter a game ID"); return; }
        ws?.send(JSON.stringify({ type: "join", gameid: gameId.trim() }));
        setError("");
        return;
      }
      if (key.backspace || key.delete) { setGameId((g) => g.slice(0, -1)); return; }
      if (input && !key.ctrl) { setGameId((g) => g + input); }
    }

    if (stage === "lobby") {
      if (input === "l") {
        ws?.send(JSON.stringify({ type: "leave", gameid: gameRoom?.gameid }));
        goTo("menu");
      }
      if (key.escape) {
        ws?.send(JSON.stringify({ type: "leave", gameid: gameRoom?.gameid }));
        goTo("menu");
      }
    }
  });

  return (
    <Box flexDirection="column" alignItems="center" justifyContent="center" marginTop={2} marginBottom={2}>
      <Box flexDirection="column" borderStyle="round" borderColor="yellow" paddingX={3} paddingY={2} width={62}>

        <Box justifyContent="space-between" marginBottom={1}>
          <Text color="yellow">♔ ♕ ♖</Text>
          <Text color="yellow">♖ ♕ ♔</Text>
        </Box>

        <Box flexDirection="column" alignItems="center" marginBottom={1}>
          {JOIN_ART.map((line, i) => (
            <Text key={i} color="yellow" bold>{line}</Text>
          ))}
        </Box>

        <Box justifyContent="center" marginBottom={2}>
          <Text italic dimColor>TERMINAL CHESS MASTER</Text>
        </Box>

        {stage === "input" ? (
          <>
            <Box marginBottom={0}>
              <Text color="yellow">▶ Game ID</Text>
            </Box>
            <Box width={54} marginLeft={2}>
              <Text color="yellow">{gameId}_</Text>
            </Box>
            <Box marginBottom={1}>
              <Text color="yellow">{underline}</Text>
            </Box>

            <Box marginBottom={1}>
              <Text color={error ? "red" : "yellow"} dimColor={!error}>
                {error || " "}
              </Text>
            </Box>

            <Box justifyContent="center" marginBottom={1}>
              <Text dimColor>↲ join  Esc back</Text>
            </Box>
          </>
        ) : (
          <>
            <Box marginBottom={1}>
              <Text dimColor>  Game ID  </Text>
              <Text color="yellow" bold>{gameRoom?.gameid}</Text>
            </Box>

            <Box justifyContent="center" marginBottom={1}>
              <Text color="yellow" dimColor>{underline}</Text>
            </Box>

            <Box paddingX={2} marginBottom={0}>
              <Text color="yellow">Players</Text>
            </Box>
            <Box justifyContent="center" marginBottom={1}>
              <Text color="yellow" dimColor>{underline}</Text>
            </Box>

            {gameRoom?.players.map((p, i) => (
              <Box key={p.id} paddingX={2}>
                <Text color={i === 0 ? "yellow" : "gray"}>
                  {i === 0 ? "▶ " : "  "}{p.name}
                  {p.id === gameRoom.createdby.id ? " (host)" : ""}
                </Text>
              </Box>
            ))}

            <Box justifyContent="center" marginTop={1} marginBottom={1}>
              <Text color="yellow" dimColor>{underline}</Text>
            </Box>

            <Box justifyContent="center" marginBottom={1}>
              <Text color={message ? "yellow" : "gray"} dimColor={!message}>
                {message || "Waiting for host to start..."}
              </Text>
            </Box>

            <Box justifyContent="center" marginBottom={1}>
              <Text dimColor>L leave  Esc back</Text>
            </Box>
          </>
        )}

        <Box justifyContent="space-between" marginTop={1}>
          <Text color="yellow">♚ ♛ ♜</Text>
          <Text color="yellow">♜ ♛ ♚</Text>
        </Box>
      </Box>
    </Box>
  );
}
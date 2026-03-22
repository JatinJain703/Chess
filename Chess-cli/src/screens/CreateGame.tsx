// src/screens/CreateGame.tsx
import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import type { Screen } from "../App.js";

const underline = "─".repeat(48);

const CREATE_ART = [
  "█▀▀ █▀█ █▀▀ ▄▀█ ▀█▀ █▀▀",
  "█▄▄ █▀▄ ██▄ █▀█ ░█░ ██▄",
];

interface Player { id: string; name: string; }
interface GameRoom { gameid: string; createdby: Player; players: Player[]; }

export default function CreateGame({
  ws, goTo,
}: { ws: WebSocket | null; goTo: (s: Screen) => void; }) {
  const [stage, setStage] = useState<"creating" | "lobby">("creating");
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null);
  const [message, setMessage] = useState("");
  // this client is always the creator on this screen
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    if (!ws) return;
    ws.send(JSON.stringify({ type: "create" }));

    const handler = (e: MessageEvent) => {
      const data = JSON.parse(e.data);

      // backend sends { gameid, game } on create — no type field
      if (data.gameid && data.game) {
        setGameRoom({
          gameid: data.game.gameid,
          createdby: { id: data.game.createdby.id, name: data.game.createdby.name },
          players: data.game.players.map((p: any) => ({ id: p.id, name: p.name })),
        });
        setIsCreator(true); // this client created the game
        setStage("lobby");
        return;
      }

      if (data.type === "player_joined") {
        setGameRoom({
          gameid: data.game.gameid,
          createdby: { id: data.game.createdby.id, name: data.game.createdby.name },
          players: data.game.players.map((p: any) => ({ id: p.id, name: p.name })),
        });
        setMessage(`♟ ${data.name} joined`);
        return;
      }

      if (data.type === "player_left") {
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
    // only creator can start
    if (input === "s" && stage === "lobby" && gameRoom && isCreator) {
      ws?.send(JSON.stringify({ type: "start", gameid: gameRoom.gameid }));
    }
    if (input === "l" && stage === "lobby" && gameRoom) {
      ws?.send(JSON.stringify({ type: "leave", gameid: gameRoom.gameid }));
      goTo("menu");
    }
    if (key.escape&& stage === "lobby" && gameRoom) {
      ws?.send(JSON.stringify({ type: "leave", gameid: gameRoom.gameid }));
      goTo("menu");
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
          {CREATE_ART.map((line, i) => (
            <Text key={i} color="yellow" bold>{line}</Text>
          ))}
        </Box>

        <Box justifyContent="center" marginBottom={2}>
          <Text italic dimColor>TERMINAL CHESS MASTER</Text>
        </Box>

        {stage === "creating" ? (
          <Box justifyContent="center" marginBottom={2}>
            <Text color="yellow">♟  Creating game...</Text>
          </Box>
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

            {/* Status message */}
            <Box justifyContent="center" marginBottom={1}>
              <Text color={message ? "yellow" : "gray"} dimColor={!message}>
                {message || "Waiting for players to join..."}
              </Text>
            </Box>

            {/* Creator badge */}
            {isCreator && (
              <Box justifyContent="center" marginBottom={1}>
                <Text color="yellow" dimColor>♔ You are the host</Text>
              </Box>
            )}

            {/* Help — show S only to creator */}
            <Box justifyContent="center" marginBottom={1}>
              <Text dimColor>
                {isCreator ? "S start  " : ""}L leave  Esc back
              </Text>
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
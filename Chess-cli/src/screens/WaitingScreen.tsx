import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import type { Screen } from "../App.js";

const PIECES = ["♔", "♕", "♖", "♗", "♘", "♙", "♚", "♛", "♜", "♝", "♞", "♟"];

export default function WaitingScreen({
  ws,
  goTo,
}: {
  ws: WebSocket | null;
  goTo: (s: Screen) => void;
}) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((f) => (f + 1) % PIECES.length);
    }, 200);
    return () => clearInterval(timer);
  }, []);

  useInput((_, key) => {
    if (key.escape) {
      ws?.send(JSON.stringify({ type: "remove" }));
      goTo("menu");
    }
  });

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

        {/* Heading */}
        <Box justifyContent="center" marginBottom={1}>
          <Text color="yellow" bold>█░█░█ ▄▀█ █ ▀█▀ █ █▄░█ █▀▀</Text>
        </Box>
        <Box justifyContent="center" marginBottom={2}>
          <Text color="yellow" bold>▀▄▀▄▀ █▀█ █ ░█░ █ █░▀█ █▄█</Text>
        </Box>

        {/* Subtitle */}
        <Box justifyContent="center" marginBottom={2}>
          <Text italic dimColor>TERMINAL CHESS MASTER</Text>
        </Box>

        {/* Spinning chess piece */}
        <Box justifyContent="center" marginBottom={1}>
          <Text color="yellow" bold>
            {PIECES[frame]}
          </Text>
        </Box>

        {/* Status */}
        <Box justifyContent="center" marginBottom={2}>
          <Text dimColor>Looking for an opponent...</Text>
        </Box>

        {/* Help */}
        <Box justifyContent="center" marginBottom={1}>
          <Text dimColor>Esc to cancel</Text>
        </Box>

        {/* Bottom pieces */}
        <Box justifyContent="space-between" marginTop={1}>
          <Text color="yellow">♚ ♛ ♜</Text>
          <Text color="yellow">♜ ♛ ♚</Text>
        </Box>
      </Box>
    </Box>
  );
}
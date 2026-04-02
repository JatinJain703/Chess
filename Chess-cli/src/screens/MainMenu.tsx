// src/screens/MainMenu.tsx
import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import type { Screen } from "../App.js";

const items = ["Play Game", "Play vs Bot", "Create Game", "Join Game", "Exit"] as const;

const MENU_ART = [
  "█▀▄▀█ █▀▀ █▄░█ █░█",
  "█░▀░█ ██▄ █░▀█ █▄█",
];

export default function MainMenu({
  token,
  ws,
  goTo,
}: {
  token: string | null;
  ws: WebSocket | null;
  goTo: (s: Screen) => void;
}) {
  const [selected, setSelected] = useState(0);

  useInput((_, key) => {
    if (key.upArrow)   setSelected((s) => Math.max(0, s - 1));
    if (key.downArrow) setSelected((s) => Math.min(items.length - 1, s + 1));
    if (key.return) {
      if (selected === 0) {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "init_game" }));
          goTo("waiting");
        }
        return;
      }
      if (selected === 1) goTo("bot_difficulty");
      if (selected === 2) goTo("create");
      if (selected === 3) goTo("join");
      if (selected === 4) process.exit(0);
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
        <Box flexDirection="column" alignItems="center" marginBottom={1}>
          {MENU_ART.map((line, i) => (
            <Text key={i} color="yellow" bold>{line}</Text>
          ))}
        </Box>

        {/* Subtitle */}
        <Box justifyContent="center" marginBottom={2}>
          <Text italic dimColor>TERMINAL CHESS MASTER</Text>
        </Box>

        {/* Logged in */}
        {token && (
          <Box justifyContent="center" marginBottom={1}>
            <Text color="yellow" dimColor>♟  Logged in ✓</Text>
          </Box>
        )}

        {/* Menu items */}
        <Box flexDirection="column" marginBottom={2}>
          {items.map((item, i) => (
            <Box key={item} paddingX={2}>
              <Text
                bold={i === selected}
                color={i === selected ? "yellow" : "gray"}
              >
                {i === selected ? "▶ " : "  "}
                {item}
              </Text>
            </Box>
          ))}
        </Box>

        {/* Help */}
        <Box justifyContent="center" marginTop={1}>
          <Text dimColor>↑↓ navigate  ↲ select</Text>
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
// src/screens/AuthMenu.tsx
import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import type { Screen } from "../App.js";

const items = ["Login", "Signup", "Login with Google", "Exit"] as const;

const CHESS_ART = [
  " ██████╗██╗  ██╗███████╗███████╗███████╗",
  "██╔════╝██║  ██║██╔════╝██╔════╝██╔════╝",
  "██║     ███████║█████╗  ███████╗███████╗ ",
  "██║     ██╔══██║██╔══╝  ╚════██║╚════██║",
  "╚██████╗██║  ██║███████╗███████║███████║",
  " ╚═════╝╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝",
];

export default function AuthMenu({ goTo }: { goTo: (s: Screen) => void }) {
  const [selected, setSelected] = useState(0);

  useInput((_, key) => {
    if (key.upArrow) setSelected((s) => Math.max(0, s - 1));
    if (key.downArrow) setSelected((s) => Math.min(items.length - 1, s + 1));
    if (key.return) {
      if (selected === 0) goTo("login");
      if (selected === 1) goTo("signup");
      if (selected === 3) process.exit(0);
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
        {/* Top chess pieces */}
        <Box justifyContent="space-between" marginBottom={1}>
          <Text color="yellow">♔ ♕ ♖</Text>
          <Text color="yellow">♖ ♕ ♔</Text>
        </Box>

        {/* Big block-letter chess title */}
        <Box flexDirection="column" alignItems="center" marginBottom={1}>
          {CHESS_ART.map((line, i) => (
            <Text key={i} color="yellow" bold>
              {line}
            </Text>
          ))}
        </Box>

        {/* Subtitle */}
        <Box justifyContent="center" marginBottom={2}>
          <Text italic dimColor>
            TERMINAL CHESS MASTER
          </Text>
        </Box>

        {/* Menu items — NO borderStyle toggle, fixed arrow width always */}
        <Box flexDirection="column" marginBottom={2}>
          {items.map((item, i) => (
            <Box key={item} paddingX={2} paddingY={0}>
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

        {/* Help text */}
        <Box marginTop={1} justifyContent="center">
          <Text dimColor>↑↓ navigate  ↲ select</Text>
        </Box>

        {/* Bottom chess pieces */}
        <Box justifyContent="space-between" marginTop={1}>
          <Text color="yellow">♚ ♛ ♜</Text>
          <Text color="yellow">♜ ♛ ♚</Text>
        </Box>
      </Box>
    </Box>
  );
}
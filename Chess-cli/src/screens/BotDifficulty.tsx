// src/screens/BotDifficulty.tsx
import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import type { Screen } from "../App.js";

const difficulties = ["Medium", "Hard"] as const;
export type Difficulty = typeof difficulties[number];

const DIFF_ART = [
  "█▀ █▀▀ █░░ █▀▀ █▀▀ ▀█▀",
  "▄█ ██▄ █▄▄ ██▄ █▄▄ ░█░",
];

const descriptions: Record<Difficulty, string> = {
  Medium: "Skill 10 — balanced, makes occasional errors",
  Hard:   "Skill 15 — strong play, hard to beat",
};

const colors: Record<Difficulty, string> = {
  Medium: "yellow",
  Hard:   "red",
};

export default function BotDifficulty({
  goTo,
  onSelect,
}: {
  goTo: (s: Screen) => void;
  onSelect: (d: Difficulty) => void;
}) {
  const [selected, setSelected] = useState(0);

  useInput((_, key) => {
    if (key.upArrow)   setSelected((s) => Math.max(0, s - 1));
    if (key.downArrow) setSelected((s) => Math.min(difficulties.length - 1, s + 1));
    if (key.return)    onSelect(difficulties[selected]!);
    if (key.escape)    goTo("menu");
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
       
        <Box justifyContent="space-between" marginBottom={1}>
          <Text color="yellow">♔ ♕ ♖</Text>
          <Text color="yellow">♖ ♕ ♔</Text>
        </Box>

      
        <Box flexDirection="column" alignItems="center" marginBottom={1}>
          {DIFF_ART.map((line, i) => (
            <Text key={i} color="yellow" bold>{line}</Text>
          ))}
        </Box>

        
        <Box justifyContent="center" marginBottom={2}>
          <Text italic dimColor>TERMINAL CHESS MASTER</Text>
        </Box>

       
        <Box flexDirection="column" marginBottom={2}>
          {difficulties.map((d, i) => (
            <Box key={d} flexDirection="column" paddingX={2}>
              <Text
                bold={i === selected}
                color={i === selected ? colors[d] : "gray"}
              >
                {i === selected ? "▶ " : "  "}{d}
              </Text>
              {i === selected && (
                <Box marginLeft={4}>
                  <Text dimColor>{descriptions[d]}</Text>
                </Box>
              )}
            </Box>
          ))}
        </Box>

        
        <Box justifyContent="center" marginBottom={1}>
          <Text dimColor>↑↓ navigate  ↲ select  Esc back</Text>
        </Box>

       
        <Box justifyContent="space-between" marginTop={1}>
          <Text color="yellow">♚ ♛ ♜</Text>
          <Text color="yellow">♜ ♛ ♚</Text>
        </Box>
      </Box>
    </Box>
  );
}
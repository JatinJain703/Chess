import React from "react";
import { Box, Text, useInput } from "ink";
import type { Screen, GameOverInfo } from "../App.js";

const WIN_ART = [
  "█▄█ █▀█ █░█   █░█░█ █ █▄░█ ▄",
  "░█░ █▄█ █▄█   ▀▄▀▄▀ █ █░▀█ ▄",
];

const LOSE_ART = [
  "█▄█ █▀█ █░█   █░░ █▀█ █▀ █▀▀",
  "░█░ █▄█ █▄█   █▄▄ █▄█ ▄█ ██▄",
];

const DRAW_ART = [
  "█▄█ █▀█ █░█   █▀▄ █▀█ ▄▀█ █░█░█",
  "░█░ █▄█ █▄█   █▄▀ █▀▄ █▀█ ▀▄▀▄▀",
];

export default function GameOverScreen({
  gameOver,
  goTo,
}: {
  gameOver: GameOverInfo;
  goTo: (s: Screen) => void;
}) {
  const won  = gameOver.result === "You Win";
  const draw = gameOver.result === "Draw";

  const art        = won ? WIN_ART  : draw ? DRAW_ART  : LOSE_ART;
  const resultText = won ? "You Win" : draw ? "Draw"    : "You Lose";
  const resultColor = won ? "green"  : draw ? "yellow"  : "red";
  const piece      = won ? "♔"      : draw ? "♖"       : "♟";

  useInput((_, key) => {
    if (key.return || key.escape) goTo("menu");
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

        {/* Result heading */}
        <Box flexDirection="column" alignItems="center" marginBottom={1}>
          {art.map((line, i) => (
            <Text key={i} color="yellow" bold>{line}</Text>
          ))}
        </Box>

        {/* Subtitle */}
        <Box justifyContent="center" marginBottom={2}>
          <Text italic dimColor>TERMINAL CHESS MASTER</Text>
        </Box>

        {/* Result badge */}
        <Box justifyContent="center" marginBottom={1}>
          <Text color={resultColor} bold>{piece}  {resultText}</Text>
        </Box>

        {/* Divider */}
        <Box justifyContent="center" marginBottom={1}>
          <Text color="yellow" dimColor>{"─".repeat(46)}</Text>
        </Box>

        {/* Reason */}
        <Box justifyContent="center" marginBottom={1}>
          <Text dimColor>Reason  </Text>
          <Text color="yellow">{gameOver.reason}</Text>
        </Box>

        {/* Divider */}
        <Box justifyContent="center" marginBottom={1}>
          <Text color="yellow" dimColor>{"─".repeat(46)}</Text>
        </Box>

        {/* Help */}
        <Box justifyContent="center" marginBottom={1}>
          <Text dimColor>↲ Enter  or  Esc  to return to menu</Text>
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
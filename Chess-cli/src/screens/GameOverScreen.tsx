import React from "react";
import { Box, Text, useInput } from "ink";
import type { Screen, GameOverInfo } from "../App.js";

export default function GameOverScreen({
    gameOver,
    goTo
}: {
    gameOver: GameOverInfo;
    goTo: (s: Screen) => void;
}) {
    const won = gameOver.result === "You Win";
    const draw = gameOver.result === "Draw";

    useInput((_, key) => {
        if (key.return || key.escape) goTo("menu");
    });

    const color = won ? "green" : draw ? "yellow" : "red";
    const emoji = won ? "🏆" : draw ? "🤝" : "💀";
    const title = won ? "You Win!" : draw ? "Draw!" : "You Lose!";

    return (
        <Box flexDirection="column" alignItems="center" marginTop={2}>
            <Box
                flexDirection="column"
                borderStyle="round"
                borderColor={color}
                paddingX={6}
                paddingY={2}
                width={40}
                alignItems="center"
            >
                <Text bold color={color}>{emoji} {title}</Text>

                <Box marginTop={1} flexDirection="column" alignItems="center">
                    <Text dimColor>Reason: </Text>
                    <Text>{gameOver.reason}</Text>
                </Box>

                <Box marginTop={2}>
                    <Text dimColor>Press Enter to go back to menu</Text>
                </Box>
            </Box>
        </Box>
    );
}
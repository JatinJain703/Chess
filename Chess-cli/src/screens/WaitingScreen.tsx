import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import type { Screen } from "../App.js";

const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export default function WaitingScreen({
    ws,
    goTo
}: {
    ws: WebSocket | null;
    goTo: (s: Screen) => void;
}) {
    const [frame, setFrame] = useState(0);

    // spinner animation
    useEffect(() => {
        const timer = setInterval(() => {
            setFrame(f => (f + 1) % SPINNER.length);
        }, 80);
        return () => clearInterval(timer);
    }, []);

    useInput((_, key) => {
        if (key.escape) {
            ws?.send(JSON.stringify({ type: "remove" })); // ← tell server to remove from queue
            goTo("menu");
        }
    });

    return (
        <Box flexDirection="column" alignItems="center" marginTop={2}>
            <Box
                flexDirection="column"
                borderStyle="round"
                borderColor="cyan"
                paddingX={6}
                paddingY={2}
                width={40}
                alignItems="center"
            >
                <Text bold color="cyan">Waiting for Opponent</Text>

                <Box marginTop={2} marginBottom={2}>
                    <Text color="yellow">{SPINNER[frame]} </Text>
                    <Text dimColor>Looking for a player...</Text>
                </Box>

                <Text dimColor>Esc to cancel</Text>
            </Box>
        </Box>
    );
}
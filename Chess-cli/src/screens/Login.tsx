// src/screens/Login.tsx
import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { login } from "../services/api.js";
import { saveToken } from "../utils/token.js";
import type { Screen } from "../App.js";

const fields = ["email", "password"] as const;

const LOGIN_ART = [
  "█░░ █▀█ █▀▀ █ █▄░█",
  "█▄▄ █▄█ █▄█ █ █░▀█",
];

export default function Login({
  goTo,
  onSuccess,
}: {
  goTo: (s: Screen) => void;
  onSuccess: (token: string) => void;
}) {
  const [focusedIdx, setFocusedIdx] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useInput((_, key) => {
    if (key.upArrow) setFocusedIdx((i) => Math.max(0, i - 1));
    if (key.downArrow) setFocusedIdx((i) => Math.min(fields.length - 1, i + 1));
    if (key.escape) goTo("auth");
  });

  const handleSubmit = async () => {
    if (!email || !password) { setError("All fields are required"); return; }
    setLoading(true);
    try {
      const token = await login(email, password);
      saveToken(token);
      onSuccess(token);
      goTo("menu");
    } catch (e: any) {
      setError(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // A fixed underline width matching the inner width of the box
  const underline = "─".repeat(48);

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

        {/* LOGIN heading */}
        <Box flexDirection="column" alignItems="center" marginBottom={1}>
          {LOGIN_ART.map((line, i) => (
            <Text key={i} color="yellow" bold>{line}</Text>
          ))}
        </Box>

        {/* Subtitle */}
        <Box justifyContent="center" marginBottom={2}>
          <Text italic dimColor>TERMINAL CHESS MASTER</Text>
        </Box>

        {/* Email label */}
        <Box marginBottom={0}>
          <Text color={focusedIdx === 0 ? "yellow" : "gray"}>
            {focusedIdx === 0 ? "▶ " : "  "}Email
          </Text>
        </Box>

        {/* Email input — no borderStyle, just plain box */}
        <Box paddingX={1} marginLeft={2}>
          <TextInput
            value={email}
            onChange={setEmail}
            onSubmit={() => setFocusedIdx(1)}
            focus={focusedIdx === 0}
            placeholder="you@example.com"
          />
        </Box>

        {/* Static underline — never changes, no reflow */}
        <Box marginBottom={1}>
          <Text color={focusedIdx === 0 ? "yellow" : "gray"}>{underline}</Text>
        </Box>

        {/* Password label */}
        <Box marginBottom={0}>
          <Text color={focusedIdx === 1 ? "yellow" : "gray"}>
            {focusedIdx === 1 ? "▶ " : "  "}Password
          </Text>
        </Box>

        {/* Password input — no borderStyle */}
        <Box paddingX={1} marginLeft={2}>
          <TextInput
            value={password}
            onChange={setPassword}
            onSubmit={handleSubmit}
            focus={focusedIdx === 1}
            mask="*"
            placeholder="••••••••"
          />
        </Box>

        {/* Static underline */}
        <Box marginBottom={1}>
          <Text color={focusedIdx === 1 ? "yellow" : "gray"}>{underline}</Text>
        </Box>

        {/* Error / loading — always one row */}
        <Box marginBottom={1}>
          <Text color={error ? "red" : "yellow"} dimColor={!error && !loading}>
            {error ? `  ✖ ${error}` : loading ? "  ♟ Logging in..." : " "}
          </Text>
        </Box>

        {/* Help */}
        <Box justifyContent="center" marginTop={1}>
          <Text dimColor>↑↓ switch field  ↲ next/submit  Esc back</Text>
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
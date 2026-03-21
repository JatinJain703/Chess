// src/screens/Signup.tsx
import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { signup } from "../services/api.js";
import { saveToken } from "../utils/token.js";
import type { Screen } from "../App.js";

const fields = ["name", "email", "password"] as const;

const SIGNUP_ART = [
  "█▀ █ █▀▀ █▄░█ █░█ █▀█",
  "▄█ █ █▄█ █░▀█ █▄█ █▀▀",
];

const underline = "─".repeat(48);

export default function Signup({
  goTo,
  onSuccess,
}: {
  goTo: (s: Screen) => void;
  onSuccess: (token: string) => void;
}) {
  const [focusedIdx, setFocusedIdx] = useState(0);
  const [name, setName] = useState("");
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
    if (!name || !email || !password) { setError("All fields are required"); return; }
    setLoading(true);
    try {
      const token = await signup(name, email, password);
      saveToken(token);
      onSuccess(token);
      goTo("menu");
    } catch (e: any) {
      setError(e.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

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
        paddingY={1}
        width={62}
      >
        {/* Top pieces */}
        <Box justifyContent="space-between" marginBottom={1}>
          <Text color="yellow">♔ ♕ ♖</Text>
          <Text color="yellow">♖ ♕ ♔</Text>
        </Box>

        {/* SIGNUP heading */}
        <Box flexDirection="column" alignItems="center" marginBottom={1}>
          {SIGNUP_ART.map((line, i) => (
            <Text key={i} color="yellow" bold>{line}</Text>
          ))}
        </Box>

        {/* Subtitle */}
        <Box justifyContent="center" marginBottom={1}>
          <Text italic dimColor>TERMINAL CHESS MASTER</Text>
        </Box>

        {/* Name */}
        <Box>
          <Text color={focusedIdx === 0 ? "yellow" : "gray"}>
            {focusedIdx === 0 ? "▶ " : "  "}Name
          </Text>
        </Box>
        <Box paddingX={1} marginLeft={2} width={54}>
          <TextInput
            value={name}
            onChange={setName}
            onSubmit={() => setFocusedIdx(1)}
            focus={focusedIdx === 0}
            placeholder="John Doe"
          />
        </Box>
        <Box marginBottom={1}>
          <Text color={focusedIdx === 0 ? "yellow" : "gray"}>{underline}</Text>
        </Box>

        {/* Email */}
        <Box>
          <Text color={focusedIdx === 1 ? "yellow" : "gray"}>
            {focusedIdx === 1 ? "▶ " : "  "}Email
          </Text>
        </Box>
        <Box paddingX={1} marginLeft={2} width={54}>
          <TextInput
            value={email}
            onChange={setEmail}
            onSubmit={() => setFocusedIdx(2)}
            focus={focusedIdx === 1}
            placeholder="you@example.com"
          />
        </Box>
        <Box marginBottom={1}>
          <Text color={focusedIdx === 1 ? "yellow" : "gray"}>{underline}</Text>
        </Box>

        {/* Password */}
        <Box>
          <Text color={focusedIdx === 2 ? "yellow" : "gray"}>
            {focusedIdx === 2 ? "▶ " : "  "}Password
          </Text>
        </Box>
        <Box paddingX={1} marginLeft={2} width={54}>
          <TextInput
            value={password}
            onChange={setPassword}
            onSubmit={handleSubmit}
            focus={focusedIdx === 2}
            mask="*"
            placeholder="••••••••"
          />
        </Box>
        <Box marginBottom={1}>
          <Text color={focusedIdx === 2 ? "yellow" : "gray"}>{underline}</Text>
        </Box>

        {/* Error / loading — always one row */}
        <Box>
          <Text color={error ? "red" : "yellow"} dimColor={!error && !loading}>
            {error ? `  ✖ ${error}` : loading ? "  ♟ Creating account..." : " "}
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
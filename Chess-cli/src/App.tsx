// App.tsx
import React, { useState, useRef } from "react";
import { Box, Text, useInput } from "ink";
import AuthMenu from "./screens/AuthMenu.js";
import Login from "./screens/Login.js";
import Signup from "./screens/Signup.js";
import MainMenu from "./screens/MainMenu.js";
import WaitingScreen from "./screens/WaitingScreen.js";
import CreateGame from "./screens/CreateGame.js";
import JoinGame from "./screens/JoinGame.js";
import BotDifficulty from "./screens/BotDifficulty.js";
import GameScreen from "./screens/GameScreen.js";
import GameOverScreen from "./screens/GameOverScreen.js";

export type Screen =
  | "auth" | "login" | "signup" | "menu"
  | "waiting" | "create" | "join" | "bot_difficulty"
  | "game" | "gameover";

export interface GameInfo {
  gameId: string;
  color: "white" | "black";
  whiteplayer: string;
  blackplayer: string;
}

export interface GameOverInfo {
  result: string;
  reason: string;
}

const WS_URL = "ws://localhost:8080";

function WsErrorScreen({
  error, onRetry, onBack,
}: { error: string; onRetry: () => void; onBack: () => void; }) {
  useInput((input, key) => {
    if (input.toLowerCase() === "r") onRetry();
    if (key.escape) onBack();
  });
  return (
    <Box flexDirection="column" alignItems="center" marginTop={2}>
      <Box flexDirection="column" borderStyle="round" borderColor="yellow" paddingX={4} paddingY={1} width={50}>
        <Box justifyContent="center" marginBottom={1}>
          <Text bold color="yellow">Connection Failed</Text>
        </Box>
        <Box justifyContent="center" marginBottom={1}>
          <Text color="red">✖ {error}</Text>
        </Box>
        <Box justifyContent="center">
          <Text dimColor>R retry  Esc back</Text>
        </Box>
      </Box>
    </Box>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("auth");
  const [token, setToken] = useState<string | null>(null);
  const [wsError, setWsError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
  const [gameOver, setGameOver] = useState<GameOverInfo | null>(null);
  const [fen, setFen] = useState<string | null>(null);
  const [isBotGame, setIsBotGame] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const playerColor = useRef<"white" | "black" | null>(null);

  const goTo = (s: Screen) => setScreen(s);

  const connectWS = (t: string) => {
    setWsError(null);
    setConnecting(true);

    ws.current = new WebSocket(`${WS_URL}?token=${t}`);

    ws.current.onopen = () => {
      setConnecting(false);
      goTo("menu");
    };

    ws.current.onerror = () => {
      setConnecting(false);
      setWsError("Could not connect to server. Please try again.");
      ws.current = null;
      process.stdin.resume();
      if (process.stdin.isTTY) process.stdin.setRawMode(true);
    };

    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === "GAME_START") {
        
        const color = data.whiteplayer === "You" ? "white" : "black";
        playerColor.current = color;
        setGameInfo({
          gameId: data.gameid,
          color,
          whiteplayer: data.whiteplayer,
          blackplayer: data.blackplayer,
        });
        setIsBotGame(data.botmode === "true");
        setFen(null);
        goTo("game");
      }

      if (data.type === "move") {
        setFen(data.fen);
      }

      if (data.type === "game_over") {
        const { result, reason } = data.payload;
        const color = playerColor.current;
        let displayResult = "";
        if (result === "1/2-1/2") displayResult = "Draw";
        else if (result === "1-0") displayResult = color === "white" ? "You Win" : "You Lose";
        else if (result === "0-1") displayResult = color === "black" ? "You Win" : "You Lose";
        else displayResult = "Game Over";
        setGameOver({ result: displayResult, reason });
        goTo("gameover");
      }
    };
  };

  const handleAuthSuccess = (t: string) => {
    setToken(t);
    connectWS(t);
  };

  const startBotGame = (difficulty: "Medium" | "Hard") => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "bot_start", difficulty }));
    }
  };

  if (connecting) return (
    <Box flexDirection="column" alignItems="center" marginTop={2}>
      <Text color="yellow">♟  Connecting to server...</Text>
    </Box>
  );

  if (wsError) return (
    <WsErrorScreen
      error={wsError}
      onRetry={() => { if (token) connectWS(token); }}
      onBack={() => { setWsError(null); goTo("auth"); }}
    />
  );

  if (screen === "auth")           return <AuthMenu goTo={goTo} />;
  if (screen === "login")          return <Login goTo={goTo} onSuccess={handleAuthSuccess} />;
  if (screen === "signup")         return <Signup goTo={goTo} onSuccess={handleAuthSuccess} />;
  if (screen === "menu")           return <MainMenu token={token} ws={ws.current} goTo={goTo} />;
  if (screen === "waiting")        return <WaitingScreen ws={ws.current} goTo={goTo} />;
  if (screen === "create")         return <CreateGame ws={ws.current} goTo={goTo} />;
  if (screen === "join")           return <JoinGame ws={ws.current} goTo={goTo} />;
  if (screen === "bot_difficulty") return (
    <BotDifficulty
      goTo={goTo}
      onSelect={(d) => startBotGame(d)}
    />
  );
  if (screen === "game")           return <GameScreen ws={ws.current} gameInfo={gameInfo!} fen={fen} goTo={goTo} isBotGame={isBotGame}/>;
  if (screen === "gameover")       return <GameOverScreen gameOver={gameOver!} goTo={goTo} />;
}
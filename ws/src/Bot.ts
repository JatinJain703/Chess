import { spawn, ChildProcess } from "child_process";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const stockfishPath = require.resolve("stockfish/bin/stockfish-18.js");

export interface Bot {
  type: "bot";
  skill: number;
  movetime: number;
  engine: ChildProcess;
}

export function createBot(skill: number, movetime: number): Bot {
  const engine = spawn("node", [stockfishPath], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  return { type: "bot", skill, movetime, engine };
}

export function sendToEngine(bot: Bot, cmd: string) {
  bot.engine.stdin?.write(cmd + "\n");
}
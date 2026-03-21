import { Chess } from "chess.js";
import WebSocket from "ws";
import { MOVE, GAME_OVER } from "./messages.js";
interface User {
    id: number,
    socket: WebSocket
    name: string
}
import prisma from "./prismaclient.js";

export class Game {
    public whiteplayer: User;
    public blackplayer: User;
    public gameId: string;
    public board: Chess;
    public moves: string[];
    public startTime: Date;
    private endTime: Date | null;
    public moveCount = 0;
    public fenHistory: string[];
    private onEnd: (gameId: string) => void
    public whitedisconnectedAt: number | null = null;
    public blackdisconnectedAt: number | null = null;
    public disconnectTimer: NodeJS.Timeout | null = null

    constructor(player1: User, player2: User, gameId: string, onEnd: (gameId: string) => void) {
        this.whiteplayer = player1;
        this.blackplayer = player2;
        this.gameId = gameId;
        this.board = new Chess();
        this.moves = [];
        this.startTime = new Date();
        this.endTime = null;
        this.fenHistory = [this.board.fen()];
        this.onEnd = onEnd;
        this.whitedisconnectedAt = null;
        this.blackdisconnectedAt = null;
        this.disconnectTimer = null;
    }

    async storeindb(result: string, reason: string, gameId: string) {
        if (this.endTime === null) return;
        try {
            const existing = await prisma.game.findUnique({
            where: { id: gameId }
        });

        if (existing) {
            console.log("Game already stored, skipping...");
            return;
        }
            const savedgame = await prisma.game.create({
                data: {
                    id: gameId,
                    whitePlayerId: this.whiteplayer.id,
                    blackPlayerId: this.blackplayer.id,
                    result: result,
                    reason: reason,
                    starttime: this.startTime,
                    endtime: this.endTime!
                }
            });

            this.whiteplayer.socket.send(
                JSON.stringify({ type: GAME_OVER, payload: savedgame })
            );
            this.blackplayer.socket.send(
                JSON.stringify({ type: GAME_OVER, payload: savedgame })
            );
            const moveData = this.moves.map((m, i) => ({
                gameId: this.gameId,
                playerId: i % 2 === 0 ? this.whiteplayer.id : this.blackplayer.id,
                move: m,
                fen: this.fenHistory[i + 1]!
            }));

            await prisma.move.createMany({
                data: moveData
            });
            this.onEnd(this.gameId);
        } catch (e) {
            console.log("some backend error occured:", e);
        }
    }

    async makeMove(Socket: WebSocket, gameId: string, move: {
        from: string,
        to: string
    }) {
        if (this.moveCount % 2 == 0 && Socket !== this.whiteplayer.socket)
            return;
        if (this.moveCount % 2 == 1 && Socket !== this.blackplayer.socket)
            return;

        try {
            const m = this.board.move(move);
            if (!m) return;
            this.moves.push(m.san);
            this.moveCount++;
            this.fenHistory.push(this.board.fen());
            console.log("Move made:", move);
        } catch (e) {
            console.log("Invalid move attempted:", move, "Error:", e);
            return;
        }

        this.whiteplayer.socket.send(
            JSON.stringify({
                type: MOVE,
                payload: move,
                fen: this.board.fen()
            })
        );
        this.blackplayer.socket.send(
            JSON.stringify({
                type: MOVE,
                payload: move,
                fen: this.board.fen()
            })
        );

        if (this.board.isGameOver()) {
            if (this.endTime !== null) return;
            this.endTime = new Date();

            let result, reason;

            if (this.board.isCheckmate()) {
                result = this.board.turn() === 'w' ? "0-1" : "1-0";
                reason = "checkmate";
            } else if (this.board.isStalemate()) {
                result = "1/2-1/2";
                reason = "stalemate";
            } else if (this.board.isInsufficientMaterial()) {
                result = "1/2-1/2";
                reason = "insufficient material";
            } else if (this.board.isThreefoldRepetition()) {
                result = "1/2-1/2";
                reason = "threefold repetition";
            } else if (this.board.isDraw()) {
                result = "1/2-1/2";
                reason = "50-move rule or draw";
            } else {
                result = "unknown";
                reason = "game ended unexpectedly";
            }

            await this.storeindb(result, reason, gameId);
        }
    }
    async makeresign(Socket: WebSocket, gameId: string) {
        if (this.endTime !== null) return;  
        this.endTime = new Date();
        const opponent =
            Socket === this.whiteplayer.socket ? this.blackplayer : this.whiteplayer;
        let result;
        if (opponent === this.blackplayer) {
            result = "0-1"
        }
        else {
            result = "1-0"
        }
        const reason = "resignation"
        await this.storeindb(result, reason, gameId);

    }
}
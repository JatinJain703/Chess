import { Game } from "./Game.js";
import WebSocket from "ws";
import { INIT_GAME, MOVE, REGISTER_USER, RESIGN, REMOVE, CREATE, JOIN, LEAVE, START } from "./messages.js";
import { v4 as uuidv4 } from "uuid";
interface User {
    name: string,
    id: number,
    socket: WebSocket
}

interface pending {
    gameid: string,
    createdby: User,
    players: User[]
}
export class GameManager {
    private games: Game[];
    private Users: User[];
    private pendinguser: User | null;
    private pendinggames: pending[];

    constructor() {
        this.games = [];
        this.Users = [];
        this.pendinguser = null;
        this.pendinggames = [];
    }

    async addUser(Socket: WebSocket, id: number, name: string) {
        const alreadyuser = this.Users.find(u => u.id === id)
        if (alreadyuser) {
            alreadyuser.socket = Socket;
            await this.handlereconnect(alreadyuser);
            return;
        }
        else {
            this.Users.push({ name: name, id: id, socket: Socket })
        }
        this.addHandler(Socket, id, name);
    }

    removeUser(Socket: WebSocket) {
        this.Users = this.Users.filter(user => user.socket !== Socket);
    }
    private async handlereconnect(user: User) {
        const game = this.games.find(game => game.whiteplayer.id === user.id || game.blackplayer.id === user.id);
        if (!game) {
            user.socket.send(JSON.stringify({ type: "error", message: "Game not found or already ended" }));
            return;
        }

        if (game.whiteplayer.id === user.id) {
            game.whitedisconnectedAt = null;
            game.whiteplayer.socket = user.socket;
        } else if (game.blackplayer.id === user.id) {
            game.blackdisconnectedAt = null;
            game.blackplayer.socket = user.socket;
        }

        if (game.disconnectTimer) {
            clearTimeout(game.disconnectTimer);
            game.disconnectTimer = null;
        }
        user.socket.send(JSON.stringify({
            type: "gameState",
            moves: game.moves,
            fenHistory: game.fenHistory
        }));
    }
    private addHandler(Socket: WebSocket, id: number, name: string) {
        Socket.on("message", async (data) => {
            let message;
            try {
                message = JSON.parse(data.toString());
            } catch {
                return;
            }
            if (message.type === INIT_GAME) {
                console.log("Init game request received from user:", name);
                const user = this.Users.find(u => u.socket === Socket)
                if (!user)
                    return;

                if (this.pendinguser && this.pendinguser.id !== user.id) {
                    const gameId = uuidv4();
                    const pendingUser = this.pendinguser;
                    const game = new Game(this.pendinguser, user, gameId, async (endedId) => {
                        this.games = this.games.filter(g => g.gameId !== endedId);
                        console.log(`Game ${endedId} removed from active games`);
                    });
                    this.games.push(game);
                    game.whiteplayer.socket.send(JSON.stringify({
                        type: "GAME_START",
                        gameid:gameId,
                        whiteplayer: "You",
                        blackplayer: user.name
                    }));

                    game.blackplayer.socket.send(JSON.stringify({
                        type: "GAME_START",
                        gameid:gameId,
                        whiteplayer: pendingUser.name,
                        blackplayer: "You"
                    }));
                    this.pendinguser = null;
                }
                else {
                    this.pendinguser = user;
                }
            }
            if (message.type === REMOVE) {
                console.log("Remove from queue:", id);
                if (this.pendinguser?.socket === Socket) {
                    Socket.send(JSON.stringify({ message: "Removed from queue" }));
                    this.pendinguser = null
                }
            }
            if (message.type === CREATE) {
                const gameId = uuidv4();
                const pendinggame = {
                    gameid: gameId,
                    createdby: ({ id: id, socket: Socket, name: name }),
                    players: [{
                        id: id,
                        socket: Socket,
                        name: name
                    }]
                };
                this.pendinggames.push(pendinggame);
                Socket.send(JSON.stringify({
                    gameid: gameId,
                    game: pendinggame
                }))
            }
            if (message.type === JOIN) {
                const game = this.pendinggames.find(g => g.gameid === message.gameid);
                if (!game) {
                    Socket.send(JSON.stringify({
                        message: "Game does not exist"
                    }))
                    return;
                }
                if (game.players.length > 1) {
                    Socket.send(JSON.stringify({
                        message: "Game is full"
                    }))
                    return;
                }
                if (game.players.find(p => p.id === id)) {
                    return;
                }
                game.players.push({ id: id, socket: Socket, name: name });
                for (let i = 0; i < game.players.length; i++) {
                    game.players[i]?.socket.send(JSON.stringify({
                        gameid: game.gameid,
                        game: game
                    }))
                }
            }
            if (message.type === LEAVE) {
                const game = this.pendinggames.find(g => g.gameid === message.gameid);
                if (!game) { return; }
                game.players = game.players.filter(p => p.socket !== Socket);
                if (game.players.length === 0) {
                    this.pendinggames = this.pendinggames.filter(g => g.gameid !== message.gameid);
                }
                else {
                    for (let i = 0; i < game.players.length; i++) {
                        game.players[i]?.socket.send(JSON.stringify({
                            gameid: game.gameid,
                            game: game
                        }))
                    }
                }
            }
            if (message.type === START) {
                const pendinggame = this.pendinggames.find(g => g.gameid === message.gameid);
                if (!pendinggame) {
                    Socket.send(JSON.stringify({ message: "Game not found" }));
                    return;
                }
                if (pendinggame.players.length < 2) {
                    Socket.send(JSON.stringify({ message: "Not enough players" }));
                    return;
                }
                this.pendinggames = this.pendinggames.filter(g => g.gameid !== message.gameid);
                const whiteplayer = pendinggame!.players[0]!;
                const blackplayer = pendinggame!.players[1]!;
                const game = new Game(whiteplayer, blackplayer, message.gameid, async (endedId) => {
                    this.games = this.games.filter(g => g.gameId !== endedId);
                    console.log(`Game ${endedId} removed from active games`);
                });
                whiteplayer.socket.send(JSON.stringify({
                    type: "GAME_START",
                    gameid: message.gameid,
                    whiteplayer: "You",
                    blackplayer: blackplayer.name
                }));

                blackplayer.socket.send(JSON.stringify({
                    type: "GAME_START",
                    gameid: message.gameid,
                    whiteplayer: whiteplayer.name,
                    blackplayer: "You"
                }));
                this.games.push(game);
            }
            if (message.type === MOVE) {
                console.log("Move received:", message.payload);
                const game = this.games.find(game => game.whiteplayer.id === id || game.blackplayer.id === id);
                if (game) {
                    await game.makeMove(Socket, game.gameId, message.payload);
                }
            }
            if (message.type === RESIGN) {
                const game = this.games.find(game => game.whiteplayer.id === id || game.blackplayer.id === id);
                if (game) {
                    await game.makeresign(Socket, game.gameId);
                }
            }
        })
        Socket.on("close", async () => {
            const user = this.Users.find(u => u.socket === Socket);
            const game = this.games.find(g =>
                g.whiteplayer.id === user?.id ||
                g.blackplayer.id === user?.id
            );
            if (!game) {
                if (this.pendinguser?.socket === Socket) {
                    this.pendinguser = null;
                }
                const pendinggame = this.pendinggames.find(g => g.players[0]?.socket === Socket || g.players[1]?.socket === Socket);
                if (pendinggame) {
                    pendinggame.players = pendinggame.players.filter(p => p.socket !== Socket);
                    if (pendinggame.players.length === 0) {
                        this.pendinggames = this.pendinggames.filter(g => g.gameid !== pendinggame.gameid);
                    }
                    else {
                        for (let i = 0; i < pendinggame.players.length; i++) {
                            pendinggame.players[i]?.socket.send(JSON.stringify({
                                gameid: pendinggame.gameid,
                                game: pendinggame
                            }))
                        }
                    }
                }
                this.removeUser(Socket);
                return;
            }

            if (game.whiteplayer.socket === Socket) {
                game.whitedisconnectedAt = Date.now();
            }
            else {
                game.blackdisconnectedAt = Date.now();
            }

            if (!game.disconnectTimer) {
                game.disconnectTimer = setTimeout(async () => {

                    if (game.whitedisconnectedAt == null && game.blackdisconnectedAt == null) {
                        game.disconnectTimer = null;
                        return;
                    }

                    if (game.whitedisconnectedAt && game.blackdisconnectedAt) {
                        console.log(`Both players disconnected in game ${game.gameId}`);

                        this.games = this.games.filter(g => g.gameId !== game.gameId);
                        this.removeUser(game.whiteplayer.socket);
                        this.removeUser(game.blackplayer.socket);

                        game.disconnectTimer = null;
                        return;
                    }

                    if (game.whitedisconnectedAt) {
                        console.log(`White resigned due to disconnect`);
                        await game.makeresign(game.whiteplayer.socket, game.gameId);
                        this.removeUser(game.whiteplayer.socket);
                    }

                    if (game.blackdisconnectedAt) {
                        console.log(`Black resigned due to disconnect`);
                        await game.makeresign(game.blackplayer.socket, game.gameId);
                        this.removeUser(game.blackplayer.socket);
                    }

                    game.disconnectTimer = null;

                }, 60000);
            }
        });
    }
}
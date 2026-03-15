import { Game } from "./Game.js";
import WebSocket from "ws";
import { INIT_GAME, MOVE, REGISTER_USER, RESIGN, REMOVE, CREATE, JOIN, LEAVE, START } from "./messages.js";
import { v4 as uuidv4 } from "uuid";
interface User {
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

    addUser(Socket: WebSocket) {
        this.addHandler(Socket);
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
    private addHandler(Socket: WebSocket) {
        Socket.on("message", async (data) => {
            const message = JSON.parse(data.toString());
            if (message.type === REGISTER_USER) {
                const alreadyuser = this.Users.find(u => u.id === message.UserId)
                if (alreadyuser) {
                    alreadyuser.socket = Socket;
                    await this.handlereconnect(alreadyuser);
                    return;
                }
                else {
                    this.Users.push({ id: message.UserId, socket: Socket })
                }
            }
            if (message.type === INIT_GAME) {
                const user = this.Users.find(u => u.socket === Socket)
                if (!user)
                    return;

                if (this.pendinguser) {
                    const gameId = uuidv4();
                    const pendingUser = this.pendinguser;
                    const game = new Game(this.pendinguser, user, gameId, async (endedId) => {
                        this.games = this.games.filter(g => g.gameId !== endedId);
                        console.log(`Game ${endedId} removed from active games`);
                    });
                    this.games.push(game);
                    this.pendinguser = null;
                }
                else {
                    this.pendinguser = user;
                }
            }
            if (message.type === REMOVE) {
                if (this.pendinguser?.socket === Socket) {
                    this.pendinguser = null
                }
            }
            if (message.type === CREATE) {
                const gameId = uuidv4();
                const pendinggame = {
                    gameid: gameId,
                    createdby: ({ id: message.UserId, socket: Socket }),
                    players: [{
                        id: message.UserId,
                        socket: Socket
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
                game.players.push({ id: message.UserId, socket: Socket })
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
                this.pendinggames = this.pendinggames.filter(g => g.gameid !== message.gameid);
                const whiteplayer = pendinggame!.players[0]!;
                const blackplayer = pendinggame!.players[1]!;
                const game = new Game(whiteplayer, blackplayer, message.gameid, async (endedId) => {
                    this.games = this.games.filter(g => g.gameId !== endedId);
                    console.log(`Game ${endedId} removed from active games`);
                });
                this.games.push(game);
            }
            if (message.type === MOVE) {
                const game = this.games.find(game => game.whiteplayer.socket === Socket || game.blackplayer.socket === Socket);
                if (game) {
                    game.makeMove(Socket, game.gameId, message.move);
                }
            }
            if (message.type === RESIGN) {
                const game = this.games.find(game => game.whiteplayer.socket === Socket || game.blackplayer.socket === Socket);
                if (game) {
                    game.makeresign(Socket, game.gameId);
                }
            }
        })
        Socket.on("close", async () => {
            const game = this.games.find(game => game.whiteplayer.socket === Socket || game.blackplayer.socket === Socket);
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
                                game: game
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
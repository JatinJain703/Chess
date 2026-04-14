import { WebSocketServer, WebSocket } from "ws";
import { GameManager } from "./GameManager.js";

import dotenv from "dotenv"
dotenv.config()
const PORT = Number(process.env.PORT) || 8080;
const wss = new WebSocketServer({ port: PORT});
const JWT_SECRET = process.env.JWT_SECRET!;
const gameManager = new GameManager();
import prisma from "./prismaclient.js";
import jwt, {type JwtPayload } from "jsonwebtoken";

wss.on("connection", async (socket,Request) => {
    const url = Request.url;
    if (!url) {
        return;
    }
    const queryParams = new URLSearchParams(url.split('?')[1]);
    const token = queryParams.get('token') || " ";
    let decoded: JwtPayload;
    console.log("Incoming token:", token);
    try {
        decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        console.log("Decoded token:", decoded);
    } catch (err) {
        console.error("Token verification failed:", err);
        socket.close();
        return;
    }
    if (!decoded) {
        socket.close();
    return;
   }
   const user= await prisma.user.findUnique({
    where:{
        id: decoded.id
    }   })
   if(!user)
   {  socket.close();
    return; 
   }
   console.log(`User ${user.name} connected with id ${user.id}`);
    gameManager.addUser(socket,user.id,user.name);
})
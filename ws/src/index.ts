import { WebSocketServer, WebSocket } from "ws";
import { GameManager } from "./GameManager.js";
const wss = new WebSocketServer({ port: 8080 });
import dotenv from "dotenv"
dotenv.config()
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
    try {
        decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (err) {
        wss.close();
        return;
    }
    if (!decoded) {
    wss.close();
    return;
   }
   const user= await prisma.user.findUnique({
    where:{
        id: decoded.id
    }   })
   if(!user)
   {  wss.close();
    return; 
   }
   console.log(`User ${user.name} connected with id ${user.id}`);
    gameManager.addUser(socket,user.id,user.name);
})
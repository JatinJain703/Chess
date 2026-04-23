import express from "express";
const router = express.Router();
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config(); 
const JWT_SECRET = process.env.JWT_SECRET!;
import prisma from "../prismaclient.js";

router.post("/login", async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
      
    let user;
    try{
     user = await prisma.user.findUnique({
        where: {
            email: email
        }
    })
  }catch(e:any)
  {
    return res.status(500).json({
                message: "something wrong in server"
            });
  }

    if (!user) {
        res.status(403).send({
            message: "user does not exist"
        })
        return;
    }
    if(user.provider!=="local"){
        return res.status(400).json({
            message: "This account was created using a third-party provider"
        })
    }
    const passmatch = await bcrypt.compare(password, user.password!);
    if (!passmatch) {
        res.status(403).send({
            message: "Wrong password"
        })
        return;
    }
    const token = jwt.sign({
        id: user.id
    }, JWT_SECRET)
   return res.json({
        token: token,
        message: "you are logged in"
    })
})

export default router;
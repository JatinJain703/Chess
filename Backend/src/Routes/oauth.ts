import express from "express";
const router = express.Router();
import prisma from "../prismaclient.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
import { OAuth2Client } from "google-auth-library";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET!;

router.post("/oauth", async (req, res) => {
    try {
        const { token } = req.body;

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        const { name, email, sub } = payload;
        if (!email || !sub) {
            return res.status(400).json({ message: "Invalid Google token" });
        }
        let user = await prisma.user.findUnique({
            where: {
                email: email
            }
        });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    name: name!,
                    email: email!,
                    provider: "google",
                    providerId: sub!
                }
            });
        }

        if (user.provider === "local") {
            return res.status(400).json({
                message: "Please login using email and password",
            });
        }
        const mytoken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1h" });
        res.json({ token: mytoken, message: "Logged in with Google" });
    } catch (error) {
        console.error("OAuth error:", error);
        res.status(500).json({ message: "Google OAuth failed" });
    }
});

export default router;

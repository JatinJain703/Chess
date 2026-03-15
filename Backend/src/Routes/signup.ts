import express from "express";
const router = express.Router();
import z from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET!;
import prisma from "../prismaclient.js";
import { Prisma } from "@prisma/client";

const requiredbody = z.object({
    email: z.string().email({ message: "invalid email" }),
    password: z.string().min(5, { message: "Password must be at least 5 characters long and include at least 1 letter, 1 number, and 1 special character." }).refine((val) => {
        return (
            /[A-Za-z]/.test(val) &&     // At least one letter
            /[0-9]/.test(val) &&        // At least one number
            /[^A-Za-z0-9]/.test(val)    // At least one special character
        );
    }, {
        message: "Password must be at least 5 characters long and include at least 1 letter, 1 number, and 1 special character."
    }),
    name: z.string().min(5, { message: "invalid name" })
});

router.post("/signup", async (req, res) => {

    const parseddata = requiredbody.safeParse(req.body);
    if (!parseddata.success) {
        const firstErrorMessage = parseddata.error.issues[0]?.message ?? "Invalid input";
        return res.status(400).json({
            message: firstErrorMessage
        });
    }

    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    const hashedpassword = await bcrypt.hash(password, 5);

    try {
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedpassword
            }
        })

        const token = jwt.sign({
            id: user.id
        }, JWT_SECRET)
        res.json({
            token: token,
            message: "you are logged in"
        })
    } catch (e: any) {

      console.log(e);
        if (e instanceof Prisma.PrismaClientKnownRequestError) {

            if (e.code === "P2002") {
                return res.status(400).json({
                    message: "Email already registered"
                });
            }

        }

        return res.status(500).json({
            message: "Something went wrong in server"
        });

    }
})

export default router;
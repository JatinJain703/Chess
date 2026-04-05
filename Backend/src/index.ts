import express from "express";
const app=express();
import  signuprouter from "./Routes/signup.js";
import  loginrouter from "./Routes/login.js";
import dotenv from "dotenv";
dotenv.config(); 


app.use(express.json());

app.use("/auth",signuprouter);
app.use("/auth",loginrouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`WS running on ${PORT}`));


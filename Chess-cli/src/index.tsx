#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import App from "./App.js";
process.stdin.setRawMode(true);  
process.stdin.resume();

render(<App />, {
    stdin: process.stdin,
});
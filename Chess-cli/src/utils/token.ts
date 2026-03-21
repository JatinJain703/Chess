import fs from "fs";
import os from "os";
import path from "path";

const dir = path.join(os.homedir(), ".chess-cli");
const file = path.join(dir, "config.json");

export function saveToken(token:string) {

if(!fs.existsSync(dir)){
fs.mkdirSync(dir);
}

fs.writeFileSync(file,JSON.stringify({token}));
 console.log("Token saved to:", file);
}

export function getToken():string|null{

if(!fs.existsSync(file)) return null;

const data = JSON.parse(fs.readFileSync(file,"utf-8"));

return data.token;

}
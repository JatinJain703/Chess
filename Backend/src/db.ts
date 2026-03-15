import mongoose from  "mongoose";
const schema = mongoose.Schema;
const objectId = schema.Types.ObjectId;
import {Redis} from "ioredis"

export const redis = new Redis();

const User=new schema({
    name:String,
    email:{type:String,unique:true},
    password:String,
    games:[
        {
        gameId:objectId,
        player:{
            userId:objectId,
            name:String
        }
        }
    ]
})

const Game=new schema({
    whiteplayer:objectId,
    blackplayer:objectId,
    moves:[String],
    fenHistory:[String],
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    result: { type: String},
    reason: { type: String } 
})

const UserModel=mongoose.model('User',User);
const GameModel=mongoose.model('Game',Game);

export{
    UserModel,
    GameModel
}
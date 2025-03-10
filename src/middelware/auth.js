const jwt = require("jsonwebtoken");
const User = require("../models/user");

const authUser = async (req,res,next)=>{
    try{ 
        const {token} = req.cookies;
        if(!token){
            throw new Error("Invalid Token");
        }
        const decodeObj = await jwt.verify(token,"WedDev*10*");
        const {_id} = decodeObj;
        const user = await User.findById(_id);
        if(!user){
            throw new Error("User not found!");
        }
        req.user = user;
        next();
    }catch(err){
        res.status(400).send(err.message);
    }}
module.exports = authUser;
const express = require("express");
const userRouter = express.Router();
const ConnectionRequest = require("../models/connectionRequest");
const authUser = require("../middelware/auth");
const User = require("../models/user");

const UserData = "firstName lastName Skills age gender";

userRouter.get("/user/request/recieved",authUser,async(req,res)=>{
    try{
        const loggedInUser = req.user;
        const connectionRequest = await ConnectionRequest.find({
            toUserId: loggedInUser._id,
            status: "interested",
        }).populate("fromUserId",UserData)
        if (connectionRequest.length === 0) {
            return res.send("No pending requests!");
        }
        res.json({
            message:"Data Fetch Successfully!",
            data: connectionRequest,
        })
    }catch(err){
        res.status(400).send("Error: "+err.message);
    }

})

userRouter.get("/user/connections",authUser,async(req,res)=>{
    try{
        const loggedInUser = req.user;
        
        const connectionRequest = await ConnectionRequest.find({
            $or:[
                { fromUserId: loggedInUser._id, status: "accepted" },
                { toUserId: loggedInUser._id, status: "accepted"},
            ]
        }).populate("fromUserId",UserData).populate("toUserId",UserData)
        
        const data = connectionRequest.map((row)=>{
            if(row.fromUserId._id.toString() === loggedInUser._id.toString()){
                return row.toUserId
            }
            return row.fromUserId
        })
        if (data.length === 0) {
            return res.send("No connections yet!");
        }
        res.json({data});
    }catch(err){
        res.status(400).send("Error: "+err.message);
    }
})

userRouter.get("/feed",authUser,async(req,res)=>{
    try{
        const loggedInUser = req.user;

        const page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;
        limit = limit>50 ? 50 : limit;
        const skip = (page - 1)*limit;

        const connectionRequest = await ConnectionRequest.find({
            $or:[
                {fromUserId: loggedInUser._id},
                {toUserId: loggedInUser._id},
            ]
        }).select("fromUserId toUserId") 

        const hideUserFromFeed = new Set();
        connectionRequest.forEach((req)=>{
            hideUserFromFeed.add(req.fromUserId.toString())
            hideUserFromFeed.add(req.toUserId.toString())
        })

        const users = await User.find({
            $and:[
                { _id: {$nin: Array.from(hideUserFromFeed)}},
                { _id: {$ne: loggedInUser._id}}
            ]
        }).select(UserData)
        .limit(limit)
        .skip(skip)

        res.json({data: users});

    }catch(err){
        res.status(400).send("Error: "+err.message);
    }
})

module.exports = userRouter;
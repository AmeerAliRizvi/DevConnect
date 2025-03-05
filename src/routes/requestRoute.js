const express = require("express");
const requestRouter = express.Router();
exports.requestRouter = requestRouter;
const authUser = require("../middelware/auth");
const User = require("../models/user");
const ConnectionRequest = require("../models/connectionRequest");

requestRouter.post("/request/send/:status/:toUserId",authUser,async (req,res)=>{
    try{
        const fromUserId = req.user._id;
        const toUserId = req.params.toUserId;
        const status = req.params.status;

        const allowedStatus = ["ignored","interested"];
        if(!allowedStatus.includes(status)){
            return res.status(400).json({message: "Invalid status!"})
        }

        const toUser = await User.findById(toUserId);
        if(!toUser){
            return res.status(400).json({message: "User not found!"})
        }

        const existingRequest = await ConnectionRequest.findOne({
            $or:[
                {fromUserId,toUserId},
                {fromUserId:toUserId, toUserId:fromUserId},
            ]
        });
        if(existingRequest){
            return res.status(400).json({message: "Request already exist!"})
        }

        const connectionRequest = new ConnectionRequest({
            fromUserId,
            toUserId,
            status,
        })

        const data = await connectionRequest.save();
        res.json({
            message: req.user.firstName + `${status === "ignored"?" ignored ":" is intrested in "}` + toUser.firstName
        })

    } catch(err){
        res.status(400).send("Error:" + err.message);
    }
    
})

requestRouter.post("/request/review/:status/:requestId",authUser,async(req,res)=>{
    try{
        const loggedInUser = req.user;
        const {status,requestId} = req.params;

        const allowedStatus = ["accepted","rejected"];
        if(!allowedStatus.includes(status)){
        return res.status(400).json({message: "Invalid Status!!"});
        }
        const connectionRequest = await ConnectionRequest.findOne({
            _id: requestId,
            toUserId: loggedInUser,
            status: "interested",
        })
        if(!connectionRequest){
            return res.status(404).json({message:"Connection request not found!"})
        }

        connectionRequest.status = status;
        const data = await connectionRequest.save();
        res.json({message: "Connection request: "+ status,data});
    }catch(err){
        res.status(400).send("Error: "+err.message);
    }
    }
)

module.exports = requestRouter;
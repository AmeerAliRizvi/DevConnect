const express = require("express");
const userRouter = express.Router();
const ConnectionRequest = require("../models/connectionRequest");
const authUser = require("../middelware/auth");
const User = require("../models/user");
const mongoose = require("mongoose");

const UserData = "firstName lastName Skills age gender photoUrl About title";

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


userRouter.post("/feed", authUser, async (req, res) => {
  try {
    const loggedInUser = req.user;
    
    // pagination parameters
    let { seenUserIds = [], limit = 12 } = req.body;
    limit = parseInt(limit);
    limit = limit > 50 ? 50 : limit;

    // 1️⃣ Find ALL connection requests (sent OR received)
    // We don't want to show users we already sent a request to,
    // users who sent us a request, or users we ignored/passed.
    const connections = await ConnectionRequest.find({
      $or: [
        { fromUserId: loggedInUser._id },
        { toUserId: loggedInUser._id },
      ],
    }).select("fromUserId toUserId");

    // 2️⃣ Build a Set for O(1) lookups
    const excludeIds = new Set();

    connections.forEach((conn) => {
      excludeIds.add(conn.fromUserId.toString());
      excludeIds.add(conn.toUserId.toString());
    });

    // Add currently loaded users (from frontend infinite scroll) to exclude list
    seenUserIds.forEach(id => excludeIds.add(id));

    // Add self
    excludeIds.add(loggedInUser._id.toString());

    // 3️⃣ Aggregation Pipeline
    const users = await User.aggregate([
      {
        $match: {
          _id: { 
            $nin: Array.from(excludeIds).map(id => new mongoose.Types.ObjectId(id)) 
          }
        }
      },
      { $sample: { size: limit } }, // Randomize
      {
        $project: {
          firstName: 1,
          lastName: 1,
          skills: 1,
          photoUrl: 1,
          title: 1,
          about: 1,
          age: 1,
          status: 1,
          gender: 1,
        }
      }
    ]);

    res.json({ data: users });

  } catch (err) {
    console.error("Feed API Error:", err);
    res.status(400).json({ error: err.message });
  }
});

userRouter.delete("/remove-connection/:targetUserId", authUser, async(req,res)=>{
  try{
    const targetUserId = req.params.targetUserId;
    const loggedInUser = req.user._id;

    const connection = await ConnectionRequest.findOneAndDelete({
      $or:[
        {fromUserId: loggedInUser, toUserId: targetUserId },
        {fromUserId: targetUserId, toUserId: loggedInUser},
      ],
      status: "accepted",
    });

    if(!connection){
      return res.status(404).json({error: "Connection Not Found"});
    }

    res.status(200).json({message: "Connection Removed Successfully", data: connection});

  }catch(err){
    res.status(400).json({error: "Review Failed: " + err.message})
  }

});
  

module.exports = userRouter;
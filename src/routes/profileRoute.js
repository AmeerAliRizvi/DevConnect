const express = require('express');
const profileRouter = express.Router();
const authUser = require('../middelware/auth')
const validateEditProfileData = require("../utils/validate");

profileRouter.get("/profile/view",authUser,async (req,res)=>{
    try{
        const user = req.user;
        res.send(user);
    }catch(err){
        res.status(400).send(err.message);
    }
})

profileRouter.patch("/profile/edit",authUser,async (req,res)=>{
    try{
    if(!validateEditProfileData(req)){
        throw new Error("Invalid Edit Request!");
    }
    const loggedInUser = req.user;
    
    Object.keys(req.body).forEach((keys)=> (loggedInUser[keys] = req.body[keys]))
    await loggedInUser.save();
    res.json({
        message: `${loggedInUser.firstName} your profile updated!`,
        data:loggedInUser,
    })

    }catch(err){
        res.status(400).send(err.message);
    }

})

module.exports = profileRouter;
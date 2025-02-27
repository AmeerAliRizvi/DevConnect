const express = require("express");
const authRouter = express.Router();
const User = require("../models/user");
const bcrypt = require('bcrypt');
const authUser = require("../middelware/auth");
const {validatePassword} = require("../utils/validate");

authRouter.post("/signup", async (req,res)=>{

    try{
        const {firstName,lastName,emailId,password,age,gender,Skills} = req.body;
        const passwordHash = await bcrypt.hash(password,10);

        const user = new User({ 
            firstName,
            lastName,
            emailId,
            password: passwordHash,
            age,
            gender,
            Skills,
    });
        await user.save()
        res.send('User Saved!');
    }
    catch(err){
        if (err.code === 11000) {
            res.send("Email already exists!");
        } else {
            res.status(400).send(err.message);
        }
    }
    
})

authRouter.post("/login",async (req,res)=>{
    try{
        const {emailId,password} = req.body;
        const user = await User.findOne({emailId: emailId});
        if(!user){
            throw new Error("Invalid Credentials!");
        }
        const validPassword = await user.validatePassword(password)
        if(validPassword){

            const token = await user.getJwt();
            res.cookie("token", token);
            res.send("Logged In Successfully!");
        }
        else{
            throw new Error("Password Incorrect");
        }
    }catch(err){
        
        res.status(400).send("Error " + err.message);
    }
})

authRouter.post("/logout",(req,res)=>{
    res.cookie("token", null,{
        expires: new Date(Date.now()),
    })
    res.send("Logout Successfully!!")
})

authRouter.patch("/forgotPassword",authUser,async (req,res)=>{
    try{
        console.log(req.body)
        const{password} = req.body;
        if(!validatePassword(password)){
            throw new Error("Enter strong password!");
        }

        const newHashPassword = await bcrypt.hash(password,10);
        req.user.password = newHashPassword;
        await req.user.save()
        res.send("Password Updated!")
    }catch(err){
        res.status(400).send(err.message);
    }
})

module.exports = authRouter;
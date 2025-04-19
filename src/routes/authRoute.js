const express = require("express");
const authRouter = express.Router();
const User = require("../models/user");
const bcrypt = require('bcrypt');
const authUser = require("../middelware/auth");
const {validatePassword} = require("../utils/validate");


authRouter.post("/signup", async (req, res) => {
    try {
        console.log("Received Data:", req.body); // Log the received data

        const { firstName, lastName, emailId, password, age, gender, Skills, photoUrl, About } = req.body;

        if (!validatePassword(password)) {
            return res.status(400).json({ error: "Password must be at least 8 characters long and include uppercase, lowercase, numbers, and symbols" });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const defaultImages = {
            male: "https://thehotelexperience.com/wp-content/uploads/2019/08/default-avatar.png",
            female: "https://t3.ftcdn.net/jpg/04/43/94/64/360_F_443946496_oS2DyLfj5a067Dqnj6OazMFtMasjh40K.jpg",
        };

        const assignedGender = gender.toLowerCase(); // Ensure lowercase
        const assignedPhotoUrl = photoUrl && photoUrl.trim() ? photoUrl : defaultImages[assignedGender] || defaultImages["male"];
 
        const user = new User({
            firstName,
            lastName,
            emailId,
            password: passwordHash,
            age,
            gender: assignedGender,
            Skills,
            photoUrl: assignedPhotoUrl,
            About,
        });

        const savedUser = await user.save();
        const token = await savedUser.getJwt();
        res.cookie("token", token);
        res.json({ message: "User Saved!" , data: savedUser});

    } catch (err) {
        if (err.code === 11000) {
            res.status(409).json({ error: "Email already exists!" });
        } else {
            console.error("Signup Error:", err);
            res.status(400).json({ error: err.message });
        }
    }
});



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
            
            res.json({ 
                message: "Login successful",
                data: user // Same structure as signup
            });
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
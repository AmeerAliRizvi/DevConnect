const express = require('express');
const profileRouter = express.Router();
const authUser = require('../middelware/auth')
const {validateEditProfileData} = require("../utils/validate");
const User = require('../models/user');

profileRouter.get("/profile/view",authUser,async (req,res)=>{
    try{
        const user = req.user;
        res.send(user);
    }catch(err){
        res.status(400).send(err.message);
    }
})

profileRouter.patch("/profile/edit", authUser, async (req, res) => {
    try {
        const validation = validateEditProfileData(req);

        if (!validation.success) {
            return res.status(400).json({ error: validation.message });
        }

        const loggedInUser = req.user;
        const defaultImages = {
            male: "https://thehotelexperience.com/wp-content/uploads/2019/08/default-avatar.png",
            female: "https://t3.ftcdn.net/jpg/04/43/94/64/360_F_443946496_oS2DyLfj5a067Dqnj6OazMFtMasjh40K.jpg",
        };

        // Check if gender is being updated
        const isGenderChanging = req.body.gender && req.body.gender !== loggedInUser.gender;

        // Loop through request body to update fields
        Object.keys(req.body).forEach((key) => {
            loggedInUser[key] = req.body[key];
        });

        // If gender changed & no new image is provided, update to default image
        if (isGenderChanging && !req.body.photoUrl) {
            loggedInUser.photoUrl = defaultImages[req.body.gender];
        }

        await loggedInUser.save();

        res.json({
            message: `${loggedInUser.firstName}, your profile has been updated!`,
            data: loggedInUser,
        });

    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

profileRouter.get("/profile/view/:userId", authUser, async(req,res) => {
    try{ 
        const userId = req.params.userId;
        const user = await User.findById(userId);

        if(!user){
            return res.status(404).json({message: "User not found"});
        }

        res.json({message: "User Profile Fetched", data: user})
    }catch(err){
        res.status(400).send("Error: " + err.message);
    }

})


module.exports = profileRouter;
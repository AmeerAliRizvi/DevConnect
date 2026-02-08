const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const valid = require("../middelware/valid");
const {signupSchema, loginSchema} = require("../utils/validationRules");
const authUser = require("../middelware/auth");
const bcrypt = require("bcrypt");
const router = express.Router();
const generateOtp = require("../utils/generateOtp");

const verifyRefreshTokenAndGetUser = async (token) => {
  const decoded = jwt.verify(token, process.env.REFRESH_SECRET);
  const user = await User.findById(decoded._id);
  if (!user) return null;

  let match = false;
  for (const stored of user.refreshTokens) {
    const isSame = await bcrypt.compare(token, stored);
    if (isSame) {
      match = true;
      break;
    }
  }
  if (!match) return null;
  return user;
}


router.post("/signup",valid(signupSchema), async (req, res) => {
  try {
    const { firstName, lastName, emailId, password, age, gender } = req.body;

    const normalizedEmail = emailId.toLowerCase();

   
    const existing = await User.findOne({ emailId: normalizedEmail });

    if (existing) {
 
      if (existing.isVerified) {
        return res.status(400).json({
          success: false,
          message: "User already exists with this email. Please log in.",
        });
      }
      // regenerate OTP and resend instead of blocking

      const otp = generateOtp(4);
      const hashedOtp = await bcrypt.hash(otp, 10);

      existing.emailOtp = hashedOtp;
      existing.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await existing.save();

      console.log("Resent OTP for", normalizedEmail, "=>", otp);

      return res.status(200).json({
        success: true,
        message:
          "An account with this email already exists but is not verified. We have sent a new OTP.",
      });
    }

    

    const defaultImages = {
      male: "https://thehotelexperience.com/wp-content/uploads/2019/08/default-avatar.png",
      female:
        "https://t3.ftcdn.net/jpg/04/43/94/64/360_F_443946496_oS2DyLfj5a067Dqnj6OazMFtMasjh40K.jpg",
    };

    const assignedGender = gender.toLowerCase();
    const assignedPhotoUrl =
      defaultImages[assignedGender] || defaultImages["male"];

    const user = new User({
      firstName,
      lastName,
      emailId: normalizedEmail,
      password,
      age,
      gender: assignedGender,
      photoUrl: assignedPhotoUrl,
      isVerified: false,
    });

    const otp = generateOtp(4);
    const hashedOtp = await bcrypt.hash(otp, 10);

    user.emailOtp = hashedOtp;
    user.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

    console.log("OTP for", normalizedEmail, "=>", otp);

    res.status(201).json({
      success: true,
      message: "Signup successful. Please verify your email with the OTP sent.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/verify-email", async(req,res) => {
  try{
    console.log("Verify body:", req.body);

  const {emailId, otp} = req.body;

    const user = await User.findOne({ emailId });
    if(!user){
         console.log("Failed to find user with search term:", emailId);
      return res.status(400).json({ error: "User not found" });
    }
    
    if(!user.emailOtp || !user.emailOtpExpires){
      return res.status(400).json({
        error: "Otp not found. Please signup again."
      })
    }

    if(user.emailOtpExpires < new Date()){
      return res.status(400).json({
        error: "OTP expired. Please request a new one."
      })
    }

    const isMatch = await bcrypt.compare(otp, user.emailOtp);
    if(!isMatch){
      return res.status(400).json({
        error: "Invalid OTP"
      })
    }

    user.isVerified = true;
    user.emailOtp = undefined;
    user.emailOtpExpires = undefined;
    await user.save();

    const accessToken = user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

     res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Email verified and logged in successfully.",
      data: {
        user: user.toJSON(),
      },
    });

  }catch(err){
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
})

router.post("/resend-otp", async (req, res) => {
    try {
        const { emailId } = req.body;
       
        const cleanEmailId = emailId?.trim()?.toLowerCase();

   
        if (!cleanEmailId) {
            return res.status(400).json({ 
                success: false, 
                message: "Email ID is required for OTP resend." 
            });
        }

      
        const user = await User.findOne({ emailId: cleanEmailId });

        if (!user) {
            
            return res.status(400).json({ 
                success: false, 
                message: "A user with this email could not be found." 
            }); 
        }

        //Prevent resending if the user is already verified
        if (user.isVerified) {
            return res.status(400).json({ 
                success: false, 
                message: "Email is already verified. Please proceed to login." 
            });
        }
        
        
        const MIN_RESEND_INTERVAL_MS = 60 * 1000; // 60 seconds cooldown
        if (user.emailOtpExpires) {
        
            const lastOtpGenerationTime = user.emailOtpExpires.getTime() - (10 * 60 * 1000); 
            if ((Date.now() - lastOtpGenerationTime) < MIN_RESEND_INTERVAL_MS) {
                 return res.status(429).json({
                    success: false,
                    message: "Please wait 60 seconds before requesting a new OTP."
                });
            }
        }

        const otp = generateOtp(4); 
        const hashedOtp = await bcrypt.hash(otp, 10);

       
        user.emailOtp = hashedOtp;
      
        user.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000); 

        await user.save();
        
        
        console.log("==========================================");
        console.log(`NEW OTP for ${cleanEmailId}: ${otp}`); 
        console.log("==========================================");
  
        return res.status(200).json({
            success: true,
            message: "A new OTP has been successfully sent to your email.",
        });

    } catch (err) {
        console.error("OTP Resend Error:", err);
        return res.status(500).json({ 
            success: false,
            error: "Server error during OTP resend process." 
        });
    }
});

router.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    const user = await User.findOne({ emailId });
    if (!user) return res.status(400).json({ error: "Invalid email or password" });

    const isValid = await user.validatePassword(password);
    if (!isValid) return res.status(400).json({ error: "Invalid email or password" });

      if (!user.isVerified) {
      const now = new Date();

      // If OTP missing or expired → generate new one
      if (!user.emailOtp || !user.emailOtpExpires || user.emailOtpExpires < now) {
        const otp = generateOtp(4);
        user.emailOtp = await bcrypt.hash(otp, 10);
        user.emailOtpExpires = new Date(now.getTime() + 10 * 60 * 1000);
        await user.save();

        console.log("LOGIN OTP for", user.emailId, "=>", otp);
        // sendEmail(user.emailId, otp)
      }

      return res.status(403).json({
        error: "Email not verified. OTP sent to your email.",
      });
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Login successful",
      data: {
        user: user.toJSON(),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/logout", async(req,res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token && req.user) {
      const newTokens = [];
      for (const stored of req.user.refreshTokens) {
        const match = await bcrypt.compare(token, stored);
        if (!match) newTokens.push(stored);
      }
      req.user.refreshTokens = newTokens;
      await req.user.save();
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
})

router.post("/refreshToken", async(req,res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ error: "Refresh token missing" });
    }

    const user = await verifyRefreshTokenAndGetUser(token);
    if (!user) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ error: "Email not verified" });
    }

    const newAccessToken = user.generateAccessToken();

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000,
    });

    res.json({ message: "Access token refreshed" });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Could not refresh token" });
  }
})

router.get("/me", authUser, (req, res) => {
  res.json({ data: req.user.toJSON() });
});

module.exports = router;



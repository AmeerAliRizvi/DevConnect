const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String,
     required: true, 
     trim: true 
    },

    lastName: { 
      type: String, 
      trim: true 
    },
    emailId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: (val) => validator.isEmail(val),
    },

    password: { type: String, 
      required: true 
    },

    age: Number,

    gender: { 
      type: String, 
      lowercase: true,
      enum: ["male", "female", "other"] 
    },

    skills: { 
      type: [String], 
      default: [], 
    },

    photoUrl: String,

    about: String,

    refreshTokens: [String],

    emailOtp: { type: String },

    emailOtpExpires: { type: Date },

    isVerified: { 
      type: Boolean, 
      default: false 
    }, 

    status: {
      type: String,
      enum: ["open","in_team"],
      default: "open",
    },

    title: {
          type: String,
          maxlength: 100,
          trim: true,
      },

    externalLinks: {
        github: String,
        linkedin: String,
        portfolio: String,
    },

  },

  { timestamps: true }
);

// hash password before save
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// normal auth tokens
userSchema.methods.generateAccessToken = function () {

  return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, { expiresIn: "15m" });
};

userSchema.methods.generateRefreshToken = async function () {
  const token = jwt.sign({ _id: this._id }, process.env.REFRESH_SECRET, { expiresIn: "30d" });
  const hashed = await bcrypt.hash(token, 10);
  this.refreshTokens.push(hashed);
  await this.save();
  return token;
};

userSchema.methods.validatePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokens;
  delete obj.emailOtp;
  delete obj.emailOtpExpires;
  return obj;
};

module.exports = mongoose.model("User", userSchema);

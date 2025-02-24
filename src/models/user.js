const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName : {
        type: String
    },
    emailId : {
        type: String,
        required: true,
        trim: true,
        unique: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error("Invalid Email!");
            }
        }
    },
    password : {
        type: String,
        required: true,
        validate(value){
            if(!validator.isStrongPassword(value)){
                throw new Error("minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1");
            }
        }
    },
    age : {
        type: Number
    },
    gender : {
        type: String,
        validate(value){
            if(!['male','female'].includes(value)){
                throw new Error("Gender not valid!");
            }
        }
    },
    Skills:{
        type:[String]
    }
},
{
    timestamps: true
}
);

module.exports = mongoose.model("User", userSchema);
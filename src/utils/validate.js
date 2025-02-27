const validator = require("validator")

const validateEditProfileData = (req)=>{
    const allowedFields = [
        "firstName",
        "lastName",
        "age",
        "gender",
        "Skills",
    ]
    const isAllowed = Object.keys(req.body).every((field) =>
        allowedFields.includes(field)
    )
    return isAllowed;
}

const validatePassword = (password)=>{
    if(!password){
        return false;
    }
    return validator.isStrongPassword(password);
    
}

module.exports = {
    validateEditProfileData,
    validatePassword
};

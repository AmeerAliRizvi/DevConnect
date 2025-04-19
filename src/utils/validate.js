const validator = require("validator")

const validateEditProfileData = (req) => {
    const allowedFields = ["firstName", "lastName", "age", "gender", "Skills", "photoUrl", "About"];

    // Check for invalid fields
    const invalidFields = Object.keys(req.body).filter(field => !allowedFields.includes(field));
    if (invalidFields.length > 0) {
        return { success: false, message: `Invalid fields: ${invalidFields.join(", ")}` };
    }

    // Validate About (must be between 5 and 100 words)
    if (req.body.About !== undefined) {
        if (typeof req.body.About !== "string") {
            return { success: false, message: "About section must be a string" };
        }
        const wordCount = req.body.About.trim().split(/\s+/).length;
        if (wordCount < 5 || wordCount > 100) {
            return { success: false, message: "About section must be between 5 and 100 words" };
        }
    }

    // Validate photoUrl (must be a valid URL)
    if (req.body.photoUrl !== undefined && !isValidUrl(req.body.photoUrl)) {
        return { success: false, message: "Invalid photo URL format" };
    }

    return { success: true };
};



// Helper function to validate URLs
const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch (_) {
        return false;
    }
};


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

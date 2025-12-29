const validator = require("validator");

const validateEditProfileData = (req) => {
  const allowedFields = ["firstName","lastName","age","gender","skills","photoUrl","about","title","status","externalLinks"];
  const invalidFields = Object.keys(req.body).filter(f => !allowedFields.includes(f));
  if (invalidFields.length) return { success:false, message:`Invalid fields: ${invalidFields.join(", ")}` };

  if (req.body.age !== undefined && (!Number.isInteger(req.body.age) || req.body.age <= 0))
    return { success:false, message:"Age must be a positive integer" };

  if (req.body.gender !== undefined && !["male","female","other"].includes(req.body.gender.toLowerCase()))
    return { success:false, message:"Gender must be 'male', 'female', or 'other'" };

  if (req.body.Skills !== undefined) {
    if (!Array.isArray(req.body.Skills)) return { success:false, message:"Skills must be an array" };
    if (!req.body.Skills.every(s => typeof s === "string")) return { success:false, message:"All skills must be strings" };
  }

  if (req.body.About !== undefined) {
    if (typeof req.body.About !== "string") return { success:false, message:"About must be a string" };
    const words = req.body.About.trim().replace(/\s+/g," ").split(" ").length;
    if (words <5 || words>100) return { success:false, message:"About must be 5-100 words" };
  }

  if (req.body.photoUrl !== undefined) {
    try { const u = new URL(req.body.photoUrl); if (!["http:","https:"].includes(u.protocol)) throw new Error(); } 
    catch { return { success:false, message:"Invalid photo URL" }; }
  }

  return { success:true };
};

const validatePassword = (password) => {
  if (!password) return false;
  return validator.isStrongPassword(password, {
    minLength:8,
    minLowercase:1,
    minUppercase:1,
    minNumbers:1,
    minSymbols:1
  });
};

module.exports = { validateEditProfileData, validatePassword };

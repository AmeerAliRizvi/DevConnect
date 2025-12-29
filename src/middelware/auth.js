const jwt = require("jsonwebtoken");
const User = require("../models/user");

const authUser = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) return res.status(401).json({ error: "Access token missing" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id);
    if (!user) return res.status(401).json({ error: "User not found" });

    if(!user.isVerified) return res.status(403).json({ error: "Email Not Verified" });

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Access token expired" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = authUser;

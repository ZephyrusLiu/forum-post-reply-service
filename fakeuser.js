const jwt = require("jsonwebtoken");

const payload = {
  userId: "507f1f77bcf86cd799439041",
  type: "user",        // user | admin | super
  status: "active",    // unverified | active | banned
};

const SECRET = process.env.JWT_SECRET || "super-secret-key";

const token = jwt.sign(payload, SECRET, { expiresIn: "7d" });

console.log("Bearer", token);

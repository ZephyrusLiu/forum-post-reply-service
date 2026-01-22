const jwt = require("jsonwebtoken");

const payload = {
  userId: "507f1f77bcf86cd799439011", // valid ObjectId format
  role: "USER",
  isEmailVerified: true,
  isBanned: false,
};


const SECRET = process.env.JWT_SECRET || "super-secret-key";
// IMPORTANT: the running server must use the same JWT_SECRET value

const token = jwt.sign(payload, SECRET, { expiresIn: "7d" });

console.log(token);

// Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJyb2xlIjoiVVNFUiIsImlzRW1haWxWZXJpZmllZCI6dHJ1ZSwiaXNCYW5uZWQiOmZhbHNlLCJpYXQiOjE3NjkwMzEzMDMsImV4cCI6MTc2OTYzNjEwM30.SqBf2AhBJdCpSeXO51yQU3Mehvbya5ex94pUYdLfeFE
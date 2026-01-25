const jwt = require("jsonwebtoken");

const payload = {
  userId: "507f1f77bcf86cd799439011",
  type: "user",        // user | admin | super
  status: "active",    // unverified | active | banned
};

const SECRET = process.env.JWT_SECRET || "super-secret-key";

const token = jwt.sign(payload, SECRET, { expiresIn: "7d" });

console.log("Bearer", token);

// admintoken = Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwNDEiLCJ0eXBlIjoiYWRtaW4iLCJzdGF0dXMiOiJhY3RpdmUiLCJpYXQiOjE3NjkwNjExMjgsImV4cCI6MTc2OTY2NTkyOH0.ARulJ0MlHeFFYXl1Zv2B87HzwHd7QHan06E-GaKbpjU;
// user507f1f77bcf86cd799439041 =  Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwNDEiLCJ0eXBlIjoidXNlciIsInN0YXR1cyI6ImFjdGl2ZSIsImlhdCI6MTc2OTA2MTc5NywiZXhwIjoxNzY5NjY2NTk3fQ.JWNcqMlGTmwzo9wWicFGLNgqBdnCxj0rWGhyMnQc0oE
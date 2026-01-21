const jwt = require("jsonwebtoken");

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.userId,
      type: decoded.type,     // user | admin | super
      status: decoded.status, // unverified | active | banned
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

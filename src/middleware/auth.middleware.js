const jwt = require("jsonwebtoken");

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "UNAUTHORIZED", message: "Unauthorized" });
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ your token uses `id` (number) and `sub` (string)
    const userId = decoded.userId ?? decoded.id ?? decoded.sub;

    if (userId == null) {
      return res.status(401).json({ error: "UNAUTHORIZED", message: "Token missing user id" });
    }

    req.user = {
      id: String(userId),          // ✅ user-service id
      userId: String(userId),      // ✅ alias (helps older code)
      type: decoded.type,          // user | admin | super
      status: decoded.status,      // unverified | active | banned
      iss: decoded.iss,
      sub: decoded.sub,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: "UNAUTHORIZED", message: "Invalid token" });
  }
};

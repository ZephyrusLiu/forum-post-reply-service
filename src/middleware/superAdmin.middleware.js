// src/middleware/superAdmin.middleware.js
module.exports = function superAdmin(req, res, next) {
  const user = req.user;

  // must be authenticated
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // banned users are never allowed
  if (user.status === "banned") {
    return res.status(403).json({ error: "Forbidden" });
  }

  // only super admins
  if (user.type !== "super") {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
};

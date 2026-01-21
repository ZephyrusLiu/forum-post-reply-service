// src/middleware/superAdmin.middleware.js
module.exports = function superAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
};

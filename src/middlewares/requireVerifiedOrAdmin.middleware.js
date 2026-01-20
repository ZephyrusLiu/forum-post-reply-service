// src/middleware/requireVerifiedOrAdmin.middleware.js
const { ForbiddenError } = require("../errors/httpErrors");

module.exports = function requireVerifiedOrAdmin(req, _res, next) {
  const role = req.user?.role;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const isVerified = req.user?.isEmailVerified === true;

  if (!isAdmin && !isVerified) {
    return next(new ForbiddenError("Email verification required"));
  }

  next();
};

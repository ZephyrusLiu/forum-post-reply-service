const { ForbiddenError } = require("../errors/httpErrors");

module.exports = function requireEmailVerified(req, _res, next) {
  if (!req.user) {
    return next(new ForbiddenError("Unauthorized"));
  }

  if (req.user?.isEmailVerified !== true) {
    return next(new ForbiddenError("Email verification required"));
  }

  next();
};

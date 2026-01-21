// src/middlewares/requireNotBanned.js
const { ForbiddenError } = require("../errors/httpErrors");

module.exports = function requireNotBanned(req, _res, next) {
  if (req.user?.isBanned) return next(new ForbiddenError("Forbidden"));
  next();
};


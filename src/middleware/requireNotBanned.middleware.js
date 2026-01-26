module.exports = (req, res, next) => {
  // Normalize userId for downstream ownership/permission checks
  if (req.user) {
    req.user.userId = req.user.userId ?? req.user.id ?? req.user.sub;
  }

  if (!req.user || req.user.status === "banned") {
    return res.status(403).json({ error: "FORBIDDEN", message: "banned Forbidden" });
  }

  next();
};

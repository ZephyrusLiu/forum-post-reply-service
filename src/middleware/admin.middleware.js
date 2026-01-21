module.exports = function admin(req, res, next) {
  const user = req.user;

  // must be authenticated
  if (!user || !user.type) {
    return res.status(403).json({ message: "Forbidden" });
  }

  // banned users are never allowed
  if (user.status === "banned") {
    return res.status(403).json({ message: "Forbidden" });
  }

  // only admin or super
  if (user.type !== "admin" && user.type !== "super") {
    return res.status(403).json({ message: "Forbidden" });
  }

  next();
};

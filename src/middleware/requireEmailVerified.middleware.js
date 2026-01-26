module.exports = (req, res, next) => {
  if (req.user) {
    req.user.userId = req.user.userId ?? req.user.id ?? req.user.sub;
  }

  const status = String(req.user?.status ?? "").toLowerCase();

  if (!req.user || status !== "active") {
    return res.status(403).json({
      error: "FORBIDDEN",
      message: "Forbidden verify email",
    });
  }

  next();
};

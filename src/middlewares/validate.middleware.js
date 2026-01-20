exports.requireBody = (fields) => (req, res, next) => {
  for (const f of fields) {
    if (!req.body[f]) return res.status(400).json({ error: `${f} required` });
  }
  next();
};

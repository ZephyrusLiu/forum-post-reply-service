exports.getUsers = async (req, res, next) => {
  try {
    // fetch users from repo
    res.json([]);
  } catch (err) {
    next(err);
  }
};

exports.banUser = async (req, res, next) => {
  try {
    // ban logic
    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
};

exports.unbanUser = async (req, res, next) => {
  try {
    // unban logic
    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
};


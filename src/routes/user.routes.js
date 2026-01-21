const router = require("express").Router();

const auth = require("../middleware/auth.middleware");
const requireNotBanned = require("../middleware/requireNotBanned.middleware");
const admin = require("../middleware/admin.middleware");
const c = require("../controllers/user.controller");

// User management (ADMIN / SUPER_ADMIN only)
router.get(
  "/admin/users",
  auth,
  requireNotBanned,
  admin,
  c.getUsers
);

router.patch(
  "/admin/users/:userId/ban",
  auth,
  requireNotBanned,
  admin,
  c.banUser
);

router.patch(
  "/admin/users/:userId/unban",
  auth,
  requireNotBanned,
  admin,
  c.unbanUser
);

module.exports = router;

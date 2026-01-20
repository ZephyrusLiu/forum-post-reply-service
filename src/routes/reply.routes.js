const router = require("express").Router();

const auth = require("../middleware/auth.middleware");
const requireNotBanned = require("../middleware/requireNotBanned.middleware");
const requireEmailVerified = require("../middleware/requireEmailVerified.middleware");
const c = require("../controllers/reply.controller");

/**
 * =====================================================
 * STRICT MODE (per requirement)
 *
 * Visitor / Banned User:
 *  - Only login / register / contact-us
 *  - NO access to replies
 *
 * Normal User (NOT email verified):
 *  - Can VIEW replies for PUBLISHED posts
 *  - CANNOT create / update / delete replies
 *
 * Normal User (email verified):
 *  - Can create replies to PUBLISHED posts (if not archived)
 *  - Can update/delete own replies
 *  - [Bonus] admin or post owner can delete others (enforced in service)
 * =====================================================
 */

/* =====================
   VIEW REPLIES
   - Logged in
   - Not banned
   - Email verification NOT required
   ===================== */
router.get(
  "/posts/:postId/replies",
  auth,
  requireNotBanned,
  c.getReplies
);

/* =====================
   VERIFIED USER ACTIONS
   - Logged in
   - Not banned
   - Email verified
   ===================== */
router.post(
  "/posts/:postId/replies",
  auth,
  requireNotBanned,
  requireEmailVerified,
  c.createReply
);

router.patch(
  "/replies/:replyId",
  auth,
  requireNotBanned,
  requireEmailVerified,
  c.updateReply
);

router.delete(
  "/replies/:replyId",
  auth,
  requireNotBanned,
  requireEmailVerified,
  c.deleteReply
);

module.exports = router;

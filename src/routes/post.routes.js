const router = require("express").Router();

const auth = require("../middleware/auth.middleware");
const admin = require("../middleware/admin.middleware");
const requireNotBanned = require("../middleware/requireNotBanned.middleware");
const requireEmailVerified = require("../middleware/requireEmailVerified.middleware");
const c = require("../controllers/post.controller");

/**
 * =====================================================
 * STRICT MODE (per requirement)
 *
 * Visitor / Banned User:
 *  - Only login / register / contact-us
 *  - NO access to posts
 *
 * Normal User (NOT email verified):
 *  - Can VIEW published posts
 *  - CANNOT create / update / delete / reply
 *
 * Normal User (email verified):
 *  - Can create / update / delete OWN posts
 *  - Can change visibility, archive, etc.
 *
 * Admin / Super Admin:
 *  - Can create posts using same create endpoint (/posts)
 *  - Can ban / unban / recover posts
 *  - Cannot modify OTHER users’ posts (enforced in service)
 * =====================================================
 */

/* =====================
   VIEW POSTS
   - Logged in
   - Not banned
   - Email verification NOT required
   ===================== */
router.get("/posts/me", auth, requireNotBanned, c.getMyPosts);
router.get('/posts/me/:postId', auth, requireNotBanned, c.getMyPostById);
router.get("/posts", auth, requireNotBanned, c.getPosts);
router.get("/posts/:postId", auth, requireNotBanned, c.getPost);


// Top posts by replies (current user)
router.get("/me/posts/top", auth, requireNotBanned, c.getMyTopPosts);

// Drafts (current user)
router.get("/me/posts/drafts", auth, requireNotBanned, c.getMyDrafts);


/* =====================
   CREATE / UPDATE / DELETE (Owner actions)
   - Logged in
   - Not banned
   ===================== */
router.post("/posts", auth, requireNotBanned, requireEmailVerified, c.createPost);
// routes/post.routes.js

router.post(
  "/posts/publish",
  auth,
  requireNotBanned,
  requireEmailVerified,
  c.createAndPublishPost
);


router.patch("/posts/:postId", auth, requireNotBanned, requireEmailVerified, c.updatePost);

router.delete("/posts/:postId", auth, requireNotBanned, requireEmailVerified, c.deletePost);

/* =====================
   OWNER STATE CHANGES
   - Service should still enforce owner for these actions
   ===================== */
router.post("/posts/:postId/publish", auth, requireNotBanned, requireEmailVerified, c.publishPost);
router.post("/posts/:postId/hide", auth, requireNotBanned, requireEmailVerified, c.hidePost);
router.post("/posts/:postId/unhide", auth, requireNotBanned, requireEmailVerified, c.unhidePost);
router.post("/posts/:postId/archive", auth, requireNotBanned, requireEmailVerified, c.archivePost);
router.post("/posts/:postId/unarchive", auth, requireNotBanned, requireEmailVerified, c.unarchivePost);

/* =====================
   ADMIN / SUPER ADMIN
   - Logged in
   - Not banned
   - ADMIN or SUPER_ADMIN
   ===================== */
router.post("/admin/posts/:postId/ban", auth, requireNotBanned, admin, c.banPost);
router.post("/admin/posts/:postId/unban", auth, requireNotBanned, admin, c.unbanPost);

router.get("/admin/posts/deleted", auth, requireNotBanned, admin, c.getDeletedPosts);
router.get("/admin/posts/:postId/deleted", auth, requireNotBanned, admin, c.getDeletedPostById);

router.post("/admin/posts/:postId/recover", auth, requireNotBanned, admin, c.recoverPost);
router.get(
  "/admin/posts/banned",
  auth,
  requireNotBanned,
  admin,
  c.getBannedPosts
);
router.get("/admin/posts/:postId", auth, requireNotBanned, admin, c.getAnyPostById);


module.exports = router;

const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const admin = require("../middleware/admin.middleware");
const c = require("../controllers/post.controller");

// public
router.get("/posts", c.getPosts);
router.get("/posts/:postId", c.getPost);

// authenticated
router.post("/posts", auth, c.createPost);
router.patch("/posts/:postId", auth, c.updatePost);
router.delete("/posts/:postId", auth, c.deletePost);

// admin
router.post("/admin/posts/:postId/ban", auth, admin, c.banPost);
router.post("/admin/posts/:postId/unban", auth, admin, c.unbanPost);

module.exports = router;

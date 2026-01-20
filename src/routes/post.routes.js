const router = require("express").Router();
const c = require("../controllers/post.controller");

router.post("/posts", c.createPost);
router.get("/posts", c.getPosts);
router.get("/posts/:postId", c.getPost);

module.exports = router;

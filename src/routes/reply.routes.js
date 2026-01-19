const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const c = require("../controllers/reply.controller");

// public
router.get("/posts/:postId/replies", c.getReplies);

// authenticated
router.post("/posts/:postId/replies", auth, c.createReply);
router.patch("/replies/:replyId", auth, c.updateReply);
router.delete("/replies/:replyId", auth, c.deleteReply);

module.exports = router;

const router = require("express").Router();
const c = require("../controllers/reply.controller");

router.post("/posts/:postId/replies", c.createReply);
router.get("/posts/:postId/replies", c.getReplies);

module.exports = router;

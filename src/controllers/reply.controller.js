 const replyService = require("../services/reply.service");

exports.createReply = async (req, res) => {
  const reply = await replyService.createReply(
    req.params.postId,
    req.user.id,
    req.body.comment
  );
  res.status(201).json(reply);
};

exports.getReplies = async (req, res) => {
  const replies = await replyService.getReplies(req.params.postId);
  if (!replies) return res.sendStatus(404);
  res.json(replies);
};

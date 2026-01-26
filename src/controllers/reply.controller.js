const replyService = require("../services/reply.service");

exports.createReply = async (req, res) => {
  const userId = String(req.user?.id ?? req.user?.userId ?? req.user?.sub); // ✅ string
  const reply = await replyService.createReply(
    req.params.postId,
    userId,                   // ✅ NOT req.user
    req.body.comment,
    req.body.parentReplyId
  );
  res.status(201).json(reply);
};

 

exports.getReplies = async (req, res, next) => {
  try {
    const replies = await replyService.getReplies(
      req.params.postId,
      req.user        // 👈 pass user context
    );
    res.json(replies);
  } catch (err) {
    next(err);
  }
};


exports.updateReply = async (req, res, next) => {
  try {
    const updated = await replyService.updateReply(
      req.params.replyId,
      req.user,              // ✅ FIX
      req.body.comment
    );
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.deleteReply = async (req, res, next) => {
  try {
    const deleted = await replyService.deleteReply(
      req.params.replyId,
      req.user               // ✅ FIX
    );
    res.json(deleted);
  } catch (err) {
    next(err);
  }
};

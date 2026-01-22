const replyService = require("../services/reply.service");

exports.createReply = async (req, res, next) => {
  try {
    const reply = await replyService.createReply(
      req.params.postId,
      req.user,              // ✅ FIX
      req.body.comment
    );
    res.status(201).json(reply);
  } catch (err) {
    next(err);
  }
};

exports.getReplies = async (req, res, next) => {
  try {
    const replies = await replyService.getReplies(req.params.postId);
    if (!replies) return res.sendStatus(404);
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

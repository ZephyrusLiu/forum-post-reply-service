const replyRepo = require("../repositories/reply.mongo.repo");
const postRepo = require("../repositories/post.mongo.repo");

exports.createReply = async (postId, userId, comment) => {
  const post = await postRepo.findById(postId);

  if (
    !post ||
    post.stage !== "PUBLISHED" ||
    post.isArchived === true
  ) {
    throw new Error("Replies not allowed");
  }

  return replyRepo.create({ postId, userId, comment });
};

exports.getReplies = async (postId) => {
  const post = await postRepo.findById(postId);
  if (!post || post.stage !== "PUBLISHED") return null;

  return replyRepo.findByPost(postId);
};

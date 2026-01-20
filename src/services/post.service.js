const postRepo = require("../repositories/post.mongo.repo");

exports.createDraft = (userId, data) =>
  postRepo.create({ ...data, userId });

exports.publish = async (postId, userId) => {
  const post = await postRepo.findById(postId);
  if (!post || !post.userId.equals(userId)) throw new Error("Forbidden");

  return postRepo.update(postId, { stage: "PUBLISHED" });
};

exports.getPublicPosts = () => postRepo.findPublic();

exports.getPostForPublic = async (postId) => {
  const post = await postRepo.findById(postId);
  if (!post || post.stage !== "PUBLISHED") return null;
  return post;
};

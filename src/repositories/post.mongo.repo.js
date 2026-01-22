const Post = require("../models/post.mongo.model");

exports.create = (data) => Post.create(data);

exports.findPublic = () =>
  Post.find({ stage: "PUBLISHED" }).sort({ createdAt: -1 });

exports.findById = (id) => Post.findById(id);

exports.findByUser = (userId) =>
  Post.find({ userId }).sort({ createdAt: -1 });

exports.update = (id, data) =>
  Post.findByIdAndUpdate(id, data, { new: true });

exports.findTopByRepliesForUser = async (userId, limit) => {
  return Post.find({ userId, stage: "PUBLISHED" })
    .sort({ repliesCount: -1, updatedAt: -1 })
    .limit(limit)
    .lean();
};

exports.findDraftsByUser = async (userId) => {
  return Post.find({ userId, stage: "UNPUBLISHED" })
    .sort({ updatedAt: -1 })
    .lean();
};

exports.incrementRepliesCount = async (postId, delta) => {
  return Post.findByIdAndUpdate(
    postId,
    { $inc: { repliesCount: delta } },
    { new: true }
  );
};

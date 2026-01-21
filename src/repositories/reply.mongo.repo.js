const Reply = require("../models/reply.mongo.model");

exports.create = async (data) => {
  const doc = await Reply.create(data);
  return doc;
};

exports.findById = async (id) => {
  return Reply.findById(id);
};

exports.findByPost = async (postId) => {
  return Reply.find({ postId, isActive: true })
    .sort({ createdAt: 1 });
};

exports.update = async (id, update) => {
  return Reply.findByIdAndUpdate(id, update, { new: true });
};

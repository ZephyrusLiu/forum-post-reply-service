const Reply = require("../models/reply.mongo.model");

exports.createReply = async (data) => {
  const doc = await Reply.create(data);
  return { id: doc._id.toString(), ...doc.toObject() };
};

exports.getReplyById = async (id) =>
  Reply.findById(id).lean();

exports.listRepliesByPost = async (postId) =>
  Reply.find({ postId }).sort({ createdAt: 1 }).lean();

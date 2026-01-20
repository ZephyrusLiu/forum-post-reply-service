const Post = require("../models/post.mongo.model");

exports.create = (data) => Post.create(data);

exports.findPublic = () =>
  Post.find({ stage: "PUBLISHED" }).sort({ createdAt: -1 });

exports.findById = (id) => Post.findById(id);

exports.findByUser = (userId) =>
  Post.find({ userId }).sort({ createdAt: -1 });

exports.update = (id, data) =>
  Post.findByIdAndUpdate(id, data, { new: true });

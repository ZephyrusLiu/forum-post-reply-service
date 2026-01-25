// src/repositories/post.mongo.repo.js
const Post = require("../models/post.mongo.model");

/* =====================
   CREATE
   ===================== */
exports.create = (data) => Post.create(data);

/* =====================
   READ
   ===================== */

// Public posts (latest first)
exports.findPublic = () =>
  Post.find({ stage: "PUBLISHED" }).sort({ createdAt: -1 }).lean();

// Any post by id (no stage restriction) - repo returns null if not found
exports.findById = (id) => Post.findById(id);

// Posts by user (latest first)
exports.findByUser = (userId) =>
  Post.find({ userId }).sort({ createdAt: -1 }).lean();

// Top posts by replies for a user
exports.findTopByRepliesForUser = async (userId, limit = 5) => {
  return Post.find({ userId, stage: "PUBLISHED" })
    .sort({ repliesCount: -1, updatedAt: -1 })
    .limit(limit)
    .lean();
};

// Drafts for a user
exports.findDraftsByUser = async (userId) => {
  return Post.find({ userId, stage: "UNPUBLISHED" })
    .sort({ updatedAt: -1 })
    .lean();
};

// Deleted posts list (admin usage)
exports.findDeleted = async () => {
  return Post.find({ stage: "DELETED" })
    .sort({ deletedAt: -1, createdAt: -1 })
    .lean();
};

// Deleted post by id (admin usage)
exports.findDeletedById = async (postId) => {
  return Post.findOne({ _id: postId, stage: "DELETED" }).lean();
};

// Banned posts list
exports.findBanned = async () => {
  return Post.find({ stage: "BANNED" }).sort({ createdAt: -1 }).lean();
};

/* =====================
   UPDATE
   ===================== */

exports.update = (id, data) => Post.findByIdAndUpdate(id, data, { new: true });

/* =====================
   REPLIES COUNT
   ===================== */

exports.incrementRepliesCount = async (postId, delta) => {
  return Post.findByIdAndUpdate(
    postId,
    { $inc: { repliesCount: delta } },
    { new: true }
  );
};

/* =====================
   ARCHIVE / UNARCHIVE (OWNER ONLY)
   - Repo enforces:
     - owner match
     - correct state
   ===================== */

// Archive: only if owner, stage PUBLISHED, not already archived
exports.archiveByIdForOwner = async (postId, userId) => {
  return Post.findOneAndUpdate(
    {
      _id: postId,
      userId,
      stage: "PUBLISHED",
      isArchived: false,
    },
    { $set: { isArchived: true } },
    { new: true }
  );
};

// Unarchive: only if owner and currently archived
exports.unarchiveByIdForOwner = async (postId, userId) => {
  return Post.findOneAndUpdate(
    {
      _id: postId,
      userId,
      isArchived: true,
    },
    { $set: { isArchived: false } },
    { new: true }
  );
};

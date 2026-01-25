// src/services/reply.service.js

const replyRepo = require("../repositories/reply.mongo.repo");
const postRepo = require("../repositories/post.mongo.repo");
const {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} = require("../errors/httpErrors");

function ensureCanViewReplies(post) {
  // Replies visible only for PUBLISHED posts
  if (!post || post.stage !== "PUBLISHED") {
    throw new NotFoundError("Post not found");
  }
}

function ensureCanCreateReply(post) {
  // Replies allowed only if post is PUBLISHED and not archived
  if (!post) throw new NotFoundError("Post not found");
  if (post.stage !== "PUBLISHED") throw new ConflictError("Replies not allowed");
  if (post.isArchived === true) throw new ConflictError("Replies not allowed");
}

function isAdmin(user) {
  const type = user?.type; // ✅ role -> type
  return type === "admin" || type === "super";
}

// ✅ string-safe owner check (no .equals)
function isOwnerId(a, b) {
  if (!a || !b) return false;
  return String(a) === String(b);
}

function ensureReplyOwnerOrAdmin(replyUserId, user) {
  if (!user || !user.id) throw new ForbiddenError("Forbidden");

  const owner = isOwnerId(replyUserId, user.id); // ✅ FIX
  if (owner || isAdmin(user)) return;

  throw new ForbiddenError("Forbidden");
}

async function ensureCanDeleteReply(reply, user) {
  if (!user || !user.id) throw new ForbiddenError("Forbidden");

  // reply owner can delete
  if (isOwnerId(reply.userId, user.id)) return; // ✅ FIX

  // admin/super can delete (bonus)
  if (isAdmin(user)) return;

  // post owner can delete others' replies (bonus)
  const post = await postRepo.findById(reply.postId);
  if (!post) throw new NotFoundError("Post not found");

  // post.userId might be ObjectId or string depending on your Post model/repo
  if (isOwnerId(post.userId, user.id)) return; // ✅ FIX

  throw new ForbiddenError("Forbidden");
}

/**
 * Create reply
 * - Auth handled by middleware
 * - Allowed only if post is PUBLISHED and not archived
 *
 * NOTE: userId in Reply model is STRING now.
 */
exports.createReply = async (postId, userId, comment, parentReplyId = null) => {
  // ✅ force string
  userId = String(userId);

  // (optional but recommended) validate parent if provided
  if (parentReplyId) {
    const parent = await replyRepo.findById(parentReplyId);
    if (!parent) throw new NotFoundError("Parent reply not found");
    if (String(parent.postId) !== String(postId)) {
      throw new BadRequestError("Parent reply does not belong to this post");
    }
  }

  return replyRepo.create({
    postId,
    userId,                         // ✅ string "7"
    comment,
    parentReplyId: parentReplyId || null,  // ✅ persist this
    isActive: true,
  });
};

/**
 * List replies for a post
 * - Only if post is PUBLISHED
 */
exports.getReplies = async (postId, user) => {
  const post = await postRepo.findById(postId);
  if (!post) throw new NotFoundError("Post not found");

  const isAdmin = user?.type === "admin" || user?.type === "super";

  // 🔑 single rule
  if (post.stage !== "PUBLISHED" && !isAdmin) {
    throw new NotFoundError("Post not found");
  }

  return replyRepo.findByPost(postId);
};


/**
 * Update reply
 * - Only reply owner (and optionally admin/super)
 * - If reply inactive => not found
 */
exports.updateReply = async (replyId, user, comment) => {
  if (!comment || typeof comment !== "string" || comment.trim().length === 0) {
    throw new BadRequestError("Comment is required");
  }

  if (!user || !user.id) throw new ForbiddenError("Forbidden");
  if (user.status === "banned") throw new ForbiddenError("Forbidden");
  if (user.status !== "active") throw new ForbiddenError("Forbidden");

  const reply = await replyRepo.findById(replyId);
  if (!reply || reply.isActive === false) {
    throw new NotFoundError("Reply not found");
  }

  ensureReplyOwnerOrAdmin(reply.userId, user); // ✅ now string-safe

  return replyRepo.update(replyId, { comment: comment.trim() });
};

/**
 * Delete reply (soft delete)
 * - Reply owner OR admin/super OR Post owner (bonus)
 * - If reply inactive => not found
 */
exports.deleteReply = async (replyId, user) => {
  const reply = await replyRepo.findById(replyId);
  if (!reply || reply.isActive === false) throw new NotFoundError("Reply not found");

  await ensureCanDeleteReply(reply, user);

  const updated = await replyRepo.update(replyId, {
    isActive: false,
    deletedAt: new Date(),
  });

  await postRepo.incrementRepliesCount(reply.postId, -1); // ✅ only active -> inactive
  return updated;
};

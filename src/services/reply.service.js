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

  const owner = isOwnerId(replyUserId, user.id);
  if (owner || isAdmin(user)) return;

  throw new ForbiddenError("Forbidden");
}

async function ensureCanDeleteReply(reply, user) {
  if (!user || !user.id) throw new ForbiddenError("Forbidden");

  // reply owner can delete
  if (isOwnerId(reply.userId, user.id)) return;

  // admin/super can delete
  if (isAdmin(user)) return;

  // post owner can delete others' replies (bonus)
  const post = await postRepo.findById(reply.postId);
  if (!post) throw new NotFoundError("Post not found");

  if (isOwnerId(post.userId, user.id)) return;

  throw new ForbiddenError("Forbidden");
}

/**
 * Create reply
 * - Allowed only if post is PUBLISHED and not archived
 * NOTE: userId in Reply model is STRING now.
 */
exports.createReply = async (postId, userId, comment, parentReplyId = null) => {
  // ✅ validate
  if (!comment || typeof comment !== "string" || comment.trim().length === 0) {
    throw new BadRequestError("Comment is required");
  }

  // ✅ force string
  userId = String(userId);

  // ✅ ensure post exists + can reply
  const post = await postRepo.findById(postId);
  if (!post) throw new NotFoundError("Post not found");
  ensureCanCreateReply(post);

  // validate parent if provided
  if (parentReplyId) {
    const parent = await replyRepo.findById(parentReplyId);
    if (!parent || parent.isActive === false) throw new NotFoundError("Parent reply not found");
    if (String(parent.postId) !== String(postId)) {
      throw new BadRequestError("Parent reply does not belong to this post");
    }
  }

  // ✅ create reply first
  const created = await replyRepo.create({
    postId,
    userId,
    comment: comment.trim(),
    parentReplyId: parentReplyId || null,
    isActive: true,
  });

  // ✅ IMPORTANT: update repliesCount in Post
  // increment by +1 for every created reply (nested or not)
  await postRepo.incrementRepliesCount(postId, +1);

  return created;
};

/**
 * List replies for a post
 * - Only if post is PUBLISHED (unless admin)
 */
exports.getReplies = async (postId, user) => {
  const post = await postRepo.findById(postId);
  if (!post) throw new NotFoundError("Post not found");

  const admin = user?.type === "admin" || user?.type === "super";

  if (post.stage !== "PUBLISHED" && !admin) {
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

  ensureReplyOwnerOrAdmin(reply.userId, user);

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

  // ✅ IMPORTANT: prevent repliesCount going negative
  // Make your repo method clamp at 0 (best), but we also guard here.
  await postRepo.incrementRepliesCount(reply.postId, -1);

  return updated;
};

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
  const role = user?.role;
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

function ensureReplyOwnerOrAdmin(replyUserId, user) {
  if (!user || !user.id) throw new ForbiddenError("Forbidden");

  const owner = replyUserId && replyUserId.equals(user.id);
  if (owner || isAdmin(user)) return;

  throw new ForbiddenError("Forbidden");
}

async function ensureCanDeleteReply(reply, user) {
  if (!user || !user.id) throw new ForbiddenError("Forbidden");

  // reply owner can delete
  if (reply.userId && reply.userId.equals(user.id)) return;

  // admin/super admin can delete (bonus)
  if (isAdmin(user)) return;

  // post owner can delete others' replies (bonus)
  const post = await postRepo.findById(reply.postId);
  if (!post) throw new NotFoundError("Post not found");

  if (post.userId && post.userId.equals(user.id)) return;

  throw new ForbiddenError("Forbidden");
}

/**
 * Create reply
 * - Auth handled by middleware
 * - Allowed only if post is PUBLISHED and not archived
 */
exports.createReply = async (postId, user, comment) => {
  if (!comment || typeof comment !== "string" || comment.trim().length === 0) {
    throw new BadRequestError("Comment is required");
  }
  if (!user || !user.id) {
    throw new ForbiddenError("Forbidden");
  }

  const post = await postRepo.findById(postId);
  ensureCanCreateReply(post);

  return replyRepo.create({
    postId,
    userId: user.id,
    comment: comment.trim(),
    isActive: true,
  });
};

/**
 * List replies for a post
 * - Only if post is PUBLISHED
 */
exports.getReplies = async (postId) => {
  const post = await postRepo.findById(postId);
  ensureCanViewReplies(post);

  return replyRepo.findByPost(postId);
};

/**
 * Update reply
 * - Only reply owner (and optionally admin)
 * - If reply inactive => not found
 */
exports.updateReply = async (replyId, user, comment) => {
  if (!comment || typeof comment !== "string" || comment.trim().length === 0) {
    throw new BadRequestError("Comment is required");
  }

  const reply = await replyRepo.findById(replyId);
  if (!reply || reply.isActive === false) throw new NotFoundError("Reply not found");

  // If you want ONLY reply owner (strict), replace this with:
  // if (!reply.userId.equals(user.id)) throw new ForbiddenError("Forbidden");
  ensureReplyOwnerOrAdmin(reply.userId, user);

  return replyRepo.update(replyId, { comment: comment.trim() });
};

/**
 * Delete reply (soft delete)
 * - Reply owner OR ADMIN/SUPER_ADMIN OR Post owner (bonus)
 * - If reply inactive => not found
 */
exports.deleteReply = async (replyId, user) => {
  const reply = await replyRepo.findById(replyId);
  if (!reply || reply.isActive === false) throw new NotFoundError("Reply not found");

  await ensureCanDeleteReply(reply, user);

  return replyRepo.update(replyId, { isActive: false, deletedAt: new Date() });
};

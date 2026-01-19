

const replyRepo = require("../repositories/reply.mongo.repo");
const postRepo = require("../repositories/post.mongo.repo");
const {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} = require("../errors/httpErrors");

function ensureCanViewReplies(post) {
  // Public can only view replies for PUBLISHED posts
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

function ensureOwnerOrAdmin(docUserId, user) {
  if (!user) throw new ForbiddenError("Forbidden");

  const isOwner = docUserId && docUserId.equals(user.id);
  const isAdmin = user.role === "ADMIN";

  if (!isOwner && !isAdmin) throw new ForbiddenError("Forbidden");
}

/**
 * Create reply
 * - Must be authenticated
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

  const reply = await replyRepo.create({
    postId,
    userId: user.id,
    comment: comment.trim(),
  });

  // Optional counters (best-effort)
  // await postRepo.update(postId, {
  //   $inc: { repliesCount: 1 },
  //   lastReplyAt: new Date(),
  // });

  return reply;
};

/**
 * Public: list replies for a post
 * - Only if post is PUBLISHED
 */
exports.getReplies = async (postId) => {
  const post = await postRepo.findById(postId);
  ensureCanViewReplies(post);

  return replyRepo.findByPost(postId);
};

/**
 * Update reply
 * - Only reply owner or ADMIN
 * - If reply is inactive, treat as not found
 */
exports.updateReply = async (replyId, user, comment) => {
  if (!comment || typeof comment !== "string" || comment.trim().length === 0) {
    throw new BadRequestError("Comment is required");
  }

  const reply = await replyRepo.findById(replyId);
  if (!reply || reply.isActive === false) throw new NotFoundError("Reply not found");

  ensureOwnerOrAdmin(reply.userId, user);

  return replyRepo.update(replyId, { comment: comment.trim() });
};

/**
 * Delete reply (soft delete)
 * - Only reply owner or ADMIN
 */
exports.deleteReply = async (replyId, user) => {
  const reply = await replyRepo.findById(replyId);
  if (!reply || reply.isActive === false) throw new NotFoundError("Reply not found");

  ensureOwnerOrAdmin(reply.userId, user);

  return replyRepo.update(replyId, { isActive: false });
};

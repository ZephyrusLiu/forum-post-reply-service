// src/services/post.service.js

const postRepo = require("../repositories/post.mongo.repo");
const {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} = require("../errors/httpErrors");

const STAGES = ["UNPUBLISHED", "PUBLISHED", "HIDDEN", "BANNED", "DELETED"];

function isOwner(post, userId) {
  return post && post.userId && post.userId.equals(userId);
}

function ensureOwner(post, userId) {
  if (!post) throw new NotFoundError("Post not found");
  if (!isOwner(post, userId)) throw new ForbiddenError("Forbidden");
}

function ensureAdmin(user) {
  if (!user || user.role !== "ADMIN") throw new ForbiddenError("Admin only");
}

/**
 * Owner-only: Create draft
 * stage defaults to UNPUBLISHED in model
 */
exports.createDraft = async (userId, data) => {
  if (!data || typeof data !== "object") {
    throw new BadRequestError("Invalid request body");
  }

  const title = typeof data.title === "string" ? data.title.trim() : "";
  const content = typeof data.content === "string" ? data.content.trim() : "";

  if (!title) throw new BadRequestError("title is required");
  if (!content) throw new BadRequestError("content is required");

  const payload = { userId, title, content };
  return postRepo.create(payload);
};

/**
 * Public: Get feed (PUBLISHED only)
 */
exports.getPublicPosts = async () => {
  return postRepo.findPublic();
};

/**
 * Public: Get single post (PUBLISHED only, else null -> controller returns 404)
 */
exports.getPostForPublic = async (postId) => {
  const post = await postRepo.findById(postId);
  if (!post || post.stage !== "PUBLISHED") return null;
  return post;
};

/**
 * Owner: list own posts (all stages, including UNPUBLISHED/HIDDEN/DELETED)
 * Admin should NOT use this (per your rule admins can't view drafts/hidden)
 */
exports.getMyPosts = async (userId) => {
  return postRepo.findByUser(userId);
};

/**
 * Owner: get one of my posts (any stage)
 */
exports.getMyPostById = async (postId, userId) => {
  const post = await postRepo.findById(postId);
  ensureOwner(post, userId);
  return post;
};

/**
 * Owner: Update post content
 * Allowed only if stage in UNPUBLISHED | PUBLISHED | HIDDEN
 * Not allowed if BANNED or DELETED
 */
exports.updateMyPost = async (postId, userId, data) => {
  const post = await postRepo.findById(postId);
  ensureOwner(post, userId);

  if (post.stage === "BANNED" || post.stage === "DELETED") {
    throw new ConflictError("Cannot modify this post in its current stage");
  }

  const update = {};

  if (typeof data?.title === "string") {
    const t = data.title.trim();
    if (!t) throw new BadRequestError("title cannot be empty");
    update.title = t;
  }

  if (typeof data?.content === "string") {
    const c = data.content.trim();
    if (!c) throw new BadRequestError("content cannot be empty");
    update.content = c;
  }

  if (Object.keys(update).length === 0) {
    throw new BadRequestError("No valid fields to update");
  }

  return postRepo.update(postId, update);
};

/**
 * Owner: Publish
 * UNPUBLISHED -> PUBLISHED
 */
exports.publish = async (postId, userId) => {
  const post = await postRepo.findById(postId);
  ensureOwner(post, userId);

  if (post.stage !== "UNPUBLISHED") {
    throw new ConflictError("Invalid stage transition");
  }

  return postRepo.update(postId, { stage: "PUBLISHED" });
};

/**
 * Owner: Hide
 * PUBLISHED -> HIDDEN
 */
exports.hide = async (postId, userId) => {
  const post = await postRepo.findById(postId);
  ensureOwner(post, userId);

  if (post.stage !== "PUBLISHED") {
    throw new ConflictError("Invalid stage transition");
  }

  return postRepo.update(postId, { stage: "HIDDEN" });
};

/**
 * Owner: Unhide
 * HIDDEN -> PUBLISHED
 */
exports.unhide = async (postId, userId) => {
  const post = await postRepo.findById(postId);
  ensureOwner(post, userId);

  if (post.stage !== "HIDDEN") {
    throw new ConflictError("Invalid stage transition");
  }

  return postRepo.update(postId, { stage: "PUBLISHED" });
};

/**
 * Owner: Archive (disable replies)
 * Only meaningful for PUBLISHED
 */
exports.archive = async (postId, userId) => {
  const post = await postRepo.findById(postId);
  ensureOwner(post, userId);

  if (post.stage !== "PUBLISHED") {
    throw new ConflictError("Only published posts can be archived");
  }

  return postRepo.update(postId, { isArchived: true });
};

/**
 * Owner: Unarchive (enable replies)
 * Only meaningful for PUBLISHED
 */
exports.unarchive = async (postId, userId) => {
  const post = await postRepo.findById(postId);
  ensureOwner(post, userId);

  if (post.stage !== "PUBLISHED") {
    throw new ConflictError("Only published posts can be unarchived");
  }

  return postRepo.update(postId, { isArchived: false });
};

/**
 * Owner: Delete (soft delete)
 * Any stage -> DELETED (but owner still can view it)
 * After DELETED: owner cannot modify content
 */
exports.deleteMyPost = async (postId, userId) => {
  const post = await postRepo.findById(postId);
  ensureOwner(post, userId);

  if (post.stage === "DELETED") return post;

  return postRepo.update(postId, { stage: "DELETED" });
};

/**
 * Admin: Ban post
 * PUBLISHED -> BANNED
 * (Admins should not be able to ban drafts/hidden because they can't view them)
 */
exports.banPost = async (postId, adminUser, reason) => {
  ensureAdmin(adminUser);

  const post = await postRepo.findById(postId);
  if (!post) throw new NotFoundError("Post not found");

  if (post.stage !== "PUBLISHED") {
    throw new ConflictError("Only published posts can be banned");
  }

  return postRepo.update(postId, {
    stage: "BANNED",
    bannedAt: new Date(),
    bannedBy: adminUser.id,
    banReason: typeof reason === "string" ? reason : null,
    isArchived: true,
  });
};

/**
 * Admin: Unban post
 * BANNED -> PUBLISHED
 */
exports.unbanPost = async (postId, adminUser) => {
  ensureAdmin(adminUser);

  const post = await postRepo.findById(postId);
  if (!post) throw new NotFoundError("Post not found");

  if (post.stage !== "BANNED") {
    throw new ConflictError("Invalid stage transition");
  }

  return postRepo.update(postId, {
    stage: "PUBLISHED",
    bannedAt: null,
    bannedBy: null,
    banReason: null,
  });
};

/**
 * Admin: Recover deleted post
 * DELETED -> PUBLISHED
 */
exports.recoverPost = async (postId, adminUser) => {
  ensureAdmin(adminUser);

  const post = await postRepo.findById(postId);
  if (!post) throw new NotFoundError("Post not found");

  if (post.stage !== "DELETED") {
    throw new ConflictError("Only deleted posts can be recovered");
  }

  return postRepo.update(postId, { stage: "PUBLISHED" });
};

// Export stages (optional)
exports.POST_STAGES = STAGES;

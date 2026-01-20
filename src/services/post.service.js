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
  return post && post.userId && userId && post.userId.equals(userId);
}

function ensureOwner(post, userId) {
  if (!post) throw new NotFoundError("Post not found");
  if (!isOwner(post, userId)) throw new ForbiddenError("Forbidden");
}

function ensureAdmin(user) {
  const role = user?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    throw new ForbiddenError("Admin only");
  }
}

function toId(user) {
  // support {id} or {_id}
  return user?.id || user?._id;
}

/**
 * Create draft (UNPUBLISHED by default in model)
 * - Verified users can create
 * - Admins can also create using same endpoint (handled at route middleware)
 */
exports.createDraft = async (userId, data) => {
  if (!userId) throw new ForbiddenError("Forbidden");

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
 * Public feed (PUBLISHED only) — keep if you still have public mode somewhere
 */
exports.getPublicPosts = async () => {
  return postRepo.findPublic();
};

/**
 * Public single post (PUBLISHED only)
 */
exports.getPostForPublic = async (postId) => {
  const post = await postRepo.findById(postId);
  if (!post || post.stage !== "PUBLISHED") return null;
  return post;
};

/**
 * Strict mode: logged-in users can view only PUBLISHED posts
 * - Unverified users are allowed to view
 * - Banned is blocked at middleware
 */
exports.getPostsForUser = async () => {
  return postRepo.findPublic();
};

/**
 * Strict mode: logged-in users can view a PUBLISHED post
 */
exports.getPostForUser = async (postId) => {
  const post = await postRepo.findById(postId);
  if (!post || post.stage !== "PUBLISHED") throw new NotFoundError("Post not found");
  return post;
};

/**
 * Owner: list my posts (all stages)
 * (You can keep this for "My Posts" page if needed)
 */
exports.getMyPosts = async (userId) => {
  if (!userId) throw new ForbiddenError("Forbidden");
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
 * Owner: Update post content (title/content)
 * Allowed only if stage in UNPUBLISHED | PUBLISHED | HIDDEN
 * Not allowed if BANNED or DELETED
 * Sets lastEditedAt when title/content changes
 */
exports.updateMyPost = async (postId, userId, data) => {
  const post = await postRepo.findById(postId);
  ensureOwner(post, userId);

  if (post.stage === "BANNED" || post.stage === "DELETED") {
    throw new ConflictError("Cannot modify this post in its current stage");
  }

  const update = {};
  let changed = false;

  if (typeof data?.title === "string") {
    const t = data.title.trim();
    if (!t) throw new BadRequestError("title cannot be empty");
    if (t !== post.title) {
      update.title = t;
      changed = true;
    }
  }

  if (typeof data?.content === "string") {
    const c = data.content.trim();
    if (!c) throw new BadRequestError("content cannot be empty");
    if (c !== post.content) {
      update.content = c;
      changed = true;
    }
  }

  if (!changed) {
    throw new BadRequestError("No valid fields to update");
  }

  // for "Last edited: date" UI
  update.lastEditedAt = new Date();

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

  if (post.isArchived === true) return post;

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

  if (post.isArchived === false) return post;

  return postRepo.update(postId, { isArchived: false });
};

/**
 * Owner: Delete (soft delete)
 * Any stage -> DELETED
 * Owner cannot recover
 */
exports.deleteMyPost = async (postId, userId) => {
  const post = await postRepo.findById(postId);
  ensureOwner(post, userId);

  if (post.stage === "DELETED") return post;

  return postRepo.update(postId, {
    stage: "DELETED",
    deletedAt: new Date(),
  });
};

/**
 * Admin: Ban post
 * PUBLISHED -> BANNED
 */
exports.banPost = async (postId, adminUser, reason) => {
  ensureAdmin(adminUser);

  const post = await postRepo.findById(postId);
  if (!post) throw new NotFoundError("Post not found");

  if (post.stage !== "PUBLISHED") {
    throw new ConflictError("Only published posts can be banned");
  }

  const adminId = toId(adminUser);

  return postRepo.update(postId, {
    stage: "BANNED",
    bannedAt: new Date(),
    bannedBy: adminId || null,
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

  return postRepo.update(postId, {
    stage: "PUBLISHED",
    deletedAt: null,
  });
};

// Export stages (optional)
exports.POST_STAGES = STAGES;

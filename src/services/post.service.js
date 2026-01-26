// src/services/post.service.js

const postRepo = require("../repositories/post.mongo.repo");
const {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} = require("../errors/httpErrors");

const STAGES = ["UNPUBLISHED", "PUBLISHED", "HIDDEN", "BANNED", "DELETED"];

/**
 * Owner check that works whether post.userId is:
 * - mongoose ObjectId (has .equals)
 * - string
 */
function isOwner(post, userId) {
  if (!post?.userId || !userId) return false;

  if (typeof post.userId?.equals === "function") {
    return post.userId.equals(userId);
  }

  return String(post.userId) === String(userId);
}

function ensureOwner(post, userId) {
  if (!post) throw new NotFoundError("Post not found");
  if (!isOwner(post, userId)) throw new ForbiddenError("Forbidden");
}

function ensureAdmin(user) {
  const type = user?.type;
  if (type !== "admin" && type !== "super") {
    throw new ForbiddenError("Admin only");
  }
}

function toId(user) {
  return user?.id;
}

/* =========================
   CREATE / READ
========================= */

exports.createDraft = async (userId, data) => {
  if (!userId) throw new ForbiddenError("Forbidden");
  if (!data || typeof data !== "object") {
    throw new BadRequestError("Invalid request body");
  }

  const title = typeof data.title === "string" ? data.title.trim() : "";
  const content = typeof data.content === "string" ? data.content.trim() : "";

  if (!title) throw new BadRequestError("title is required");
  if (!content) throw new BadRequestError("content is required");

  return postRepo.create({ userId, title, content });
};

exports.createAndPublish = async (userId, data) => {
  if (!userId) throw new ForbiddenError("Forbidden");
  if (!data || typeof data !== "object") {
    throw new BadRequestError("Invalid request body");
  }

  const title = typeof data.title === "string" ? data.title.trim() : "";
  const content = typeof data.content === "string" ? data.content.trim() : "";

  if (!title) throw new BadRequestError("title is required");
  if (!content) throw new BadRequestError("content is required");

  return postRepo.create({
    userId,
    title,
    content,
    stage: "PUBLISHED",
    isArchived: false,
    publishedAt: new Date(),
    attachments: Array.isArray(data.attachments)
      ? data.attachments.filter(Boolean)
      : [],
  });
};

exports.getPublicPosts = async () => postRepo.findPublic();

exports.getPostForPublic = async (postId) => {
  const post = await postRepo.findById(postId);
  if (!post || post.stage !== "PUBLISHED") return null;
  return post;
};

exports.getPostsForUser = async () => postRepo.findPublic();

exports.getPostForUser = async (postId) => {
  const post = await postRepo.findById(postId);
  if (!post || post.stage !== "PUBLISHED") {
    throw new NotFoundError("Post not found");
  }
  return post;
};

exports.getMyPosts = async (userId) => {
  if (!userId) throw new ForbiddenError("Forbidden");
  return postRepo.findByUser(userId);
};

exports.getMyPostById = async (postId, userId) => {
  const post = await postRepo.findById(postId);
  ensureOwner(post, userId);
  return post;
};

/* =========================
   UPDATE
========================= */

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

  if (!changed) throw new BadRequestError("No valid fields to update");

  update.lastEditedAt = new Date();
  return postRepo.update(postId, update);
};

/* =========================
   STAGE TRANSITIONS
========================= */

exports.publish = async (postId, userId) => {
  const post = await postRepo.findById(postId);
  ensureOwner(post, userId);

  if (post.stage !== "UNPUBLISHED") {
    throw new ConflictError("Invalid stage transition");
  }

  return postRepo.update(postId, { stage: "PUBLISHED" });
};

exports.hide = async (postId, userId) => {
  const post = await postRepo.findById(postId);
  ensureOwner(post, userId);

  if (post.stage !== "PUBLISHED") {
    throw new ConflictError("Invalid stage transition");
  }

  return postRepo.update(postId, { stage: "HIDDEN" });
};

exports.unhide = async (postId, userId) => {
  const post = await postRepo.findById(postId);
  ensureOwner(post, userId);

  if (post.stage !== "HIDDEN") {
    throw new ConflictError("Invalid stage transition");
  }

  return postRepo.update(postId, { stage: "PUBLISHED" });
};

exports.deleteMyPost = async (postId, userId) => {
  const post = await postRepo.findById(postId);
  ensureOwner(post, userId);

  if (post.stage === "DELETED") return post;

  return postRepo.update(postId, {
    stage: "DELETED",
    deletedAt: new Date(),
  });
};

/* =========================
   ADMIN ACTIONS
========================= */

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
    banReason: typeof reason === "string" ? reason : null
  });
};

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

/* =========================
   ADMIN LISTS
========================= */

exports.getBannedPosts = async () => {
  return postRepo.findBanned();
};

exports.getMyTopPosts = async (userId, limit = 3) => {
  if (!userId) throw new ForbiddenError("Forbidden");
  const safeLimit = Math.min(Math.max(Number(limit) || 3, 1), 50);
  return postRepo.findTopByRepliesForUser(userId, safeLimit);
};

exports.getMyDrafts = async (userId) => {
  if (!userId) throw new ForbiddenError("Forbidden");
  return postRepo.findDraftsByUser(userId);
};

exports.getDeletedPosts = async () => {
  return postRepo.findDeleted();
};

exports.getDeletedPostById = async (postId) => {
  const post = await postRepo.findDeletedById(postId);
  if (!post) throw new NotFoundError("Deleted post not found");
  return post;
};

// services/post.service.js
exports.getAnyPostById = async (postId) => {
  const post = await postRepo.findById(postId);
  if (!post) throw new NotFoundError("Post not found");
  return post;
};



/* =========================
   ARCHIVE / UNARCHIVE (OWNER ONLY)
========================= */

exports.archive = async (postId, userId) => {
  const post = await postRepo.findById(postId);
  ensureOwner(post, userId);

  if (post.isArchived === true) {
    throw new ConflictError("Post already archived");
  }

  // archive only published (your rule)
  if (post.stage !== "PUBLISHED") {
    throw new ConflictError("Only published posts can be archived");
  }

  return postRepo.update(postId, {
    isArchived: true,
    archivedAt: new Date(),
  });
};

exports.unarchive = async (postId, userId) => {
  const post = await postRepo.findById(postId);
  ensureOwner(post, userId);

  if (post.isArchived !== true) {
    throw new ConflictError("Post is not archived");
  }

  return postRepo.update(postId, {
    isArchived: false,
    archivedAt: null,
  });
};

/* =========================
   HIDE / UNHIDE (OWNER ONLY)
========================= */

exports.hide = async (postId, userId) => {
  const post = await postRepo.findById(postId);
  ensureOwner(post, userId);

  if (post.isArchived === true) {
    throw new ConflictError("Archived post cannot be hidden");
  }

  if (post.stage !== "PUBLISHED") {
    throw new ConflictError("Invalid stage transition");
  }

  return postRepo.update(postId, {
    stage: "HIDDEN",
    hiddenAt: new Date(),
  });
};

exports.unhide = async (postId, userId) => {
  const post = await postRepo.findById(postId);
  ensureOwner(post, userId);

  if (post.isArchived === true) {
    throw new ConflictError("Archived post cannot be unhidden");
  }

  if (post.stage !== "HIDDEN") {
    throw new ConflictError("Invalid stage transition");
  }

  return postRepo.update(postId, {
    stage: "PUBLISHED",
    hiddenAt: null,
  });
};

exports.POST_STAGES = STAGES;

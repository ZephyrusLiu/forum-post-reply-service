// src/controllers/post.controller.js
const postService = require("../services/post.service");

function getUserServiceId(req) {
  const id = req.user?.userId ?? req.user?.id ?? req.user?.sub;
  return id == null ? null : String(id);
}

function requireUser(req, res) {
  const userId = getUserServiceId(req);
  if (!userId) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "Unauthorized" });
    return null;
  }
  return userId;
}

// Create draft
exports.createPost = async (req, res, next) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    const post = await postService.createDraft(userId, req.body);
    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
};

// Strict mode feed: logged-in users can view PUBLISHED posts
exports.getPosts = async (req, res, next) => {
  try {
    const posts = await postService.getPostsForUser();
    res.json(posts);
  } catch (err) {
    next(err);
  }
};

// Strict mode single: logged-in users can view PUBLISHED post
exports.getPost = async (req, res, next) => {
  try {
    const post = await postService.getPostForUser(req.params.postId);
    res.json(post);
  } catch (err) {
    next(err);
  }
};

// Owner update title/content
exports.updatePost = async (req, res, next) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    const updated = await postService.updateMyPost(
      req.params.postId,
      userId,
      req.body
    );
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// Owner soft delete
exports.deletePost = async (req, res, next) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    const deleted = await postService.deleteMyPost(req.params.postId, userId);
    res.json(deleted);
  } catch (err) {
    next(err);
  }
};

// Owner state changes
exports.publishPost = async (req, res, next) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    const post = await postService.publish(req.params.postId, userId);
    res.json(post);
  } catch (err) {
    next(err);
  }
};

exports.hidePost = async (req, res, next) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    const post = await postService.hide(req.params.postId, userId);
    res.json(post);
  } catch (err) {
    next(err);
  }
};

exports.unhidePost = async (req, res, next) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    const post = await postService.unhide(req.params.postId, userId);
    res.json(post);
  } catch (err) {
    next(err);
  }
};

exports.archivePost = async (req, res, next) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    const post = await postService.archive(req.params.postId, userId);
    res.json(post);
  } catch (err) {
    next(err);
  }
};

exports.unarchivePost = async (req, res, next) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    const post = await postService.unarchive(req.params.postId, userId);
    res.json(post);
  } catch (err) {
    next(err);
  }
};

// Admin actions
exports.banPost = async (req, res, next) => {
  try {
    const reason = req.body?.reason;
    const post = await postService.banPost(req.params.postId, req.user, reason);
    res.json(post);
  } catch (err) {
    next(err);
  }
};

exports.unbanPost = async (req, res, next) => {
  try {
    const post = await postService.unbanPost(req.params.postId, req.user);
    res.json(post);
  } catch (err) {
    next(err);
  }
};

exports.recoverPost = async (req, res, next) => {
  try {
    const post = await postService.recoverPost(req.params.postId, req.user);
    res.json(post);
  } catch (err) {
    next(err);
  }
};

// ✅ ADMIN: list banned posts
exports.getBannedPosts = async (req, res, next) => {
  try {
    const posts = await postService.getBannedPosts();
    res.json(posts);
  } catch (err) {
    next(err);
  }
};

exports.getDeletedPosts = async (req, res, next) => {
  try {
    const posts = await postService.getDeletedPosts();
    res.json(posts);
  } catch (err) {
    next(err);
  }
};

exports.getDeletedPostById = async (req, res, next) => {
  try {
    const post = await postService.getDeletedPostById(req.params.postId);
    res.json(post);
  } catch (err) {
    next(err);
  }
};


exports.getMyTopPosts = async (req, res, next) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 3;
    const posts = await postService.getMyTopPosts(userId, limit);
    res.json(posts);
  } catch (err) {
    next(err);
  }
};

exports.getMyDrafts = async (req, res, next) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    const drafts = await postService.getMyDrafts(userId);
    res.json(drafts);
  } catch (err) {
    next(err);
  }
};

exports.getMyPostById = async (req, res, next) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    const post = await postService.getMyPostById(req.params.postId, userId);
    res.json(post);
  } catch (err) {
    next(err);
  }
};

// ✅ Create & Publish (wrapped in try/catch + uses requireUser)
exports.createAndPublishPost = async (req, res, next) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    const post = await postService.createAndPublish(userId, req.body);
    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
};

exports.getAnyPostById = async (req, res, next) => {
  try {
    const post = await postService.getAnyPostById(req.params.postId);
    res.json(post);
  } catch (err) {
    next(err);
  }
};

exports.getMyPosts = async (req, res, next) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;

    const posts = await postService.getMyPosts(userId);
    res.json(posts);
  } catch (err) {
    next(err);
  }
};
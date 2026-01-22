// src/controllers/post.controller.js
const postService = require("../services/post.service");

// Create draft
exports.createPost = async (req, res, next) => {
  try {
    const post = await postService.createDraft(req.user.id, req.body);
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
    const updated = await postService.updateMyPost(
      req.params.postId,
      req.user.id,
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
    const deleted = await postService.deleteMyPost(req.params.postId, req.user.id);
    res.json(deleted);
  } catch (err) {
    next(err);
  }
};

// Owner state changes
exports.publishPost = async (req, res, next) => {
  try {
    const post = await postService.publish(req.params.postId, req.user.id);
    res.json(post);
  } catch (err) {
    next(err);
  }
};

exports.hidePost = async (req, res, next) => {
  try {
    const post = await postService.hide(req.params.postId, req.user.id);
    res.json(post);
  } catch (err) {
    next(err);
  }
};

exports.unhidePost = async (req, res, next) => {
  try {
    const post = await postService.unhide(req.params.postId, req.user.id);
    res.json(post);
  } catch (err) {
    next(err);
  }
};

exports.archivePost = async (req, res, next) => {
  try {
    const post = await postService.archive(req.params.postId, req.user.id);
    res.json(post);
  } catch (err) {
    next(err);
  }
};

exports.unarchivePost = async (req, res, next) => {
  try {
    const post = await postService.unarchive(req.params.postId, req.user.id);
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

// Not implemented yet (you don't have repo/service functions for these)
exports.getDeletedPosts = async (req, res) => {
  res.status(501).json({ message: "Not implemented: getDeletedPosts" });
};

exports.getDeletedPostById = async (req, res) => {
  res.status(501).json({ message: "Not implemented: getDeletedPostById" });
};

exports.getMyTopPosts = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 3;
    const posts = await postService.getMyTopPosts(req.user.id, limit);
    res.json(posts);
  } catch (err) {
    next(err);
  }
};

exports.getMyDrafts = async (req, res, next) => {
  try {
    const drafts = await postService.getMyDrafts(req.user.id);
    res.json(drafts);
  } catch (err) {
    next(err);
  }
};
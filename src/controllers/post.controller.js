const postService = require("../services/post.service");

exports.createPost = async (req, res) => {
  const post = await postService.createDraft(req.user.id, req.body);
  res.status(201).json(post);
};

exports.getPosts = async (_, res) => {
  const posts = await postService.getPublicPosts();
  res.json(posts);
};

exports.getPost = async (req, res) => {
  const post = await postService.getPostForPublic(req.params.postId);
  if (!post) return res.sendStatus(404);
  res.json(post);
};

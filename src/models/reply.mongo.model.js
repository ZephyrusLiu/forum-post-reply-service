const mongoose = require("mongoose");

const ReplySchema = new mongoose.Schema({
  postId: String,
  userId: String,
  text: String,
  parentReplyId: String
}, { timestamps: true });

module.exports = mongoose.model("Reply", ReplySchema);

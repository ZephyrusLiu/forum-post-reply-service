// src/models/reply.mongo.model.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const ReplySchema = new Schema(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },

    // ✅ allow "7" or any string id
    userId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 5000,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    parentReplyId: {
      type: Schema.Types.ObjectId,
      ref: "Reply",
      default: null,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

ReplySchema.index({ postId: 1, isActive: 1, createdAt: -1 });
ReplySchema.index({ postId: 1, parentReplyId: 1, createdAt: 1 });

ReplySchema.pre("validate", function () {
  if (typeof this.comment === "string") this.comment = this.comment.trim();
  if (!this.comment) this.invalidate("comment", "comment is required");

  if (typeof this.userId === "string") this.userId = this.userId.trim();
  if (!this.userId) this.invalidate("userId", "userId is required");
});

module.exports = mongoose.model("Reply", ReplySchema);

const mongoose = require("mongoose");

const POST_STAGES = [
  "UNPUBLISHED",
  "PUBLISHED",
  "HIDDEN",
  "BANNED",
  "DELETED",
];

const postSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },

    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },

    stage: {
      type: String,
      enum: POST_STAGES,
      default: "UNPUBLISHED",
      index: true,
    },

    isArchived: { type: Boolean, default: false },

    bannedAt: Date,
    bannedBy: mongoose.Schema.Types.ObjectId,
    banReason: String,

    repliesCount: { type: Number, default: 0 },
    lastReplyAt: Date,
  },
  { timestamps: true }
);

postSchema.statics.POST_STAGES = POST_STAGES;

module.exports = mongoose.model("Post", postSchema);

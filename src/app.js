const express = require("express");
const postRoutes = require("./routes/post.routes");
const replyRoutes = require("./routes/reply.routes");

const app = express();
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    service: "post-reply-service",
    timestamp: new Date().toISOString()
  });
});

app.use(postRoutes);
app.use(replyRoutes);

module.exports = app;

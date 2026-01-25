const express = require("express");

const postRoutes = require("./routes/post.routes");
const replyRoutes = require("./routes/reply.routes");
const errorHandler = require("./middleware/error.middleware");

const app = express();

app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    service: "post-reply-service",
    timestamp: new Date().toISOString(),
  });
});

// =====================
// API Routes
// =====================
app.use("/api", postRoutes);
app.use("/api", replyRoutes);

// =====================
// 404 handler
// =====================
app.use((req, res) => {
  res.status(404).json({
    error: "NOT_FOUND",
    message: "Route not found",
  });
});

// =====================
// Global error handler (MUST be last)
// =====================
app.use(errorHandler);

module.exports = app;

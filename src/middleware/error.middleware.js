const AppError = require("../errors/AppError");

module.exports = function errorHandler(err, req, res, next) {
  // Custom operational errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
    });
  }

  // Mongoose invalid ObjectId (CastError)
  if (err?.name === "CastError") {
    return res.status(400).json({
      error: "BAD_REQUEST",
      message: "Invalid id format",
    });
  }

  // unexpected / programming errors
  console.error(err);

  return res.status(500).json({
    error: "INTERNAL_SERVER_ERROR",
    message: "Something went wrong",
  });
};

const errorHandler = (err, req, res, next) => {
  console.error("API Gateway error:", err.message);

  res.status(500).json({
    message: "API Gateway internal server error",
  });
};

module.exports = errorHandler;
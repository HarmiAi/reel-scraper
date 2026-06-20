// Centralized Error Handling Middleware for Express API
export const errorHandler = (err, req, res, next) => {
  console.error(`[API Error Log] ${err.stack || err.message}`);

  const statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      error: 'Validation Failed',
      messages
    });
  }

  // Handle Mongoose Cast Error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: `Resource not found with id of ${err.value}`
    });
  }

  // Handle MongoDB Duplicate Key Error (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      error: `Duplicate value entered for ${field}`
    });
  }

  res.status(statusCode).json({
    success: false,
    error: message
  });
};

// Route Not Found (404) Handler
export const notFound = (req, res, next) => {
  const error = new Error(`Route Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

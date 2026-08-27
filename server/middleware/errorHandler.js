const env = require('../config/env');

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Catches any error passed via next(err) or thrown inside an async handler wrapped by asyncHandler
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Server error';

  res.status(statusCode).json({
    message,
    ...(!env.IS_PRODUCTION && { stack: err.stack })
  });
};

// Wraps async route handlers so thrown errors are passed to errorHandler
// instead of needing try/catch in every single controller function
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { AppError, errorHandler, asyncHandler };
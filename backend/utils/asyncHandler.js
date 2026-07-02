/**
 * Wraps an async Express route handler so that any rejected promise is
 * forwarded to the next() error middleware automatically.
 *
 * @param {Function} fn - Async (req, res, next) route handler
 * @returns {Function} Express-compatible middleware
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;

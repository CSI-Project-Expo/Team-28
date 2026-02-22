/**
 * Centralized error-handling middleware.
 * Must be registered AFTER all routes in Express.
 */
function errorHandler(err, _req, res, _next) {
    console.error('❌ Unhandled error:', err.message || err);

    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
}

module.exports = errorHandler;

const express = require('express');
const router = express.Router();

/**
 * GET /api/health
 * Simple health check endpoint.
 */
router.get('/health', (_req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
    });
});

module.exports = router;

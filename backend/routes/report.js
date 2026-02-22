const express = require('express');
const router = express.Router();
const { handleReport } = require('../controllers/reportController');

/**
 * POST /api/report
 *
 * Accepts an issue report and delegates to the report controller.
 *
 * Body:
 *   - issueTitle        (string, required)
 *   - issueDescription  (string, required)
 *   - stepsToReproduce  (string, optional)
 *   - severity          (string, required) — e.g. "low", "medium", "high", "critical"
 */
router.post('/report', handleReport);

module.exports = router;

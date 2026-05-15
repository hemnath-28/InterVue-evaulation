const express = require("express");
const router = express.Router();
const { 
    generateInterview, 
    saveAnswer, 
    evaluateSession, 
    getSessionResults 
} = require("../controllers/interviewController");

// POST /api/interviews/generate
// Removed protect middleware temporarily for testing
router.post("/generate", generateInterview);

// POST /api/interviews/:id/answer
router.post("/:id/answer", saveAnswer);

// POST /api/interviews/:id/evaluate
router.post("/:id/evaluate", evaluateSession);

// GET /api/interviews/:id/results
router.get("/:id/results", getSessionResults);

module.exports = router;

const express = require("express");
const router = express.Router();
const { 
    generateInterview, 
    saveAnswer,
    saveCodingResult,
    evaluateSession, 
    getSessionResults 
} = require("../controllers/interviewController");
const { jwtAuth } = require("../middleware/Authmiddleware");

// POST /api/interviews/generate
router.post("/generate", jwtAuth, generateInterview);

// POST /api/interviews/:id/answer
router.post("/:id/answer", jwtAuth, saveAnswer);

// POST /api/interviews/:id/coding-result
// Saves coding round result and computes finalScore
router.post("/:id/coding-result", jwtAuth, saveCodingResult);

// POST /api/interviews/:id/evaluate
router.post("/:id/evaluate", jwtAuth, evaluateSession);

// GET /api/interviews/:id/results
router.get("/:id/results", jwtAuth, getSessionResults);

module.exports = router;

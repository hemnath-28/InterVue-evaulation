const express = require("express");
const router = express.Router();
const { generateInterview } = require("../controllers/interviewController");

// POST /api/interviews/generate
// Removed protect middleware temporarily for testing
router.post("/generate", generateInterview);

module.exports = router;

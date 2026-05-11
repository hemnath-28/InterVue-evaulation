const express = require("express");
const router = express.Router();
const protect = require("../middleware/Authmiddleware");
const { evaluateInterviewAnswer } = require("../controllers/evaluationController");

// POST /api/interviews/evaluate
// Use protect if you want to require authentication, but for testing we can leave it open or optional.
// I will keep it consistent with the generation route.
router.post("/evaluate", evaluateInterviewAnswer);

module.exports = router;

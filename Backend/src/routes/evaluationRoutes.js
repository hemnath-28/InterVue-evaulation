const express = require("express");
const router = express.Router();
const { jwtAuth: protect } = require("../middleware/Authmiddleware");
const { evaluateInterviewAnswer } = require("../controllers/evaluationController");

// POST /api/eval/evaluate (Secured with protect middleware)
router.post("/evaluate", protect, evaluateInterviewAnswer);

module.exports = router;

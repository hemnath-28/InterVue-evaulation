const express = require("express")
const multer  = require("multer")
const { analyzeATS } = require("../controllers/atsController")
const { jwtAuth } = require("../middleware/Authmiddleware")

const router = express.Router()

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
})

// POST /api/ats/analyze
// Body: multipart/form-data — resume (file) + targetRole (string)
router.post("/analyze", jwtAuth, upload.single("resume"), analyzeATS)

module.exports = router

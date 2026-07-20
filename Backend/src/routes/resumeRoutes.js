const express = require("express")
const multer  = require("multer")

const router = express.Router()

// Store file in memory as Buffer (Gemini reads it directly — no disk writes needed)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB max
})

const {
    uploadResume,
    getMyResumes,
    getResumeById,
    deleteResume
} = require("../controllers/resumeControleer")

const { jwtAuth } = require("../middleware/Authmiddleware")

// POST /api/resume/upload
// Upload a PDF → Gemini parses it → saved to MongoDB
router.post("/upload", jwtAuth, upload.single("resume"), uploadResume)

// GET /api/resume/my
// Get all resumes for the logged-in user
router.get("/my", jwtAuth, getMyResumes)

// GET /api/resume/:id
// Get a specific resume by ID
router.get("/:id", jwtAuth, getResumeById)

// DELETE /api/resume/:id
// Delete a resume by ID
router.delete("/:id", jwtAuth, deleteResume)

module.exports = router

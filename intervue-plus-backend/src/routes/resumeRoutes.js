const express = require("express")
const multer  = require("multer")

const router = express.Router()

const upload = multer({ storage: multer.memoryStorage() })

const {
    uploadResume,
    affindaWebhook,
    checkAffindaDocument,
    processDocument
} = require("../controllers/resumeControleer")

// POST /api/resume/upload
// Submits PDF to Affinda (async). Returns 202 with Affinda document identifier.
router.post("/upload", upload.single("resume"), uploadResume)

// POST /api/resume/webhook
// Affinda calls this when resume parsing is complete.
// Receives full parsed data → Gemini Flash → MongoDB
router.post("/webhook", affindaWebhook)

// GET /api/resume/check/:identifier
// Fetch what Affinda parsed for a given document (debug / verification)
router.get("/check/:identifier", checkAffindaDocument)

// POST /api/resume/process/:identifier
// Manual trigger: Fetch Affinda doc → Gemini → MongoDB (for local dev when webhook can't reach localhost)
router.post("/process/:identifier", processDocument)

module.exports = router


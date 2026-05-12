const axios    = require("axios")
const crypto   = require("crypto")
const FormData = require("form-data")

const Resume              = require("../models/Resume")
const { restructureResume } = require("../services/geminiService")

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Upload endpoint
// Submits the PDF to Affinda without waiting.
// Affinda processes asynchronously and calls our webhook when done.
// ─────────────────────────────────────────────────────────────────────────────
const uploadResume = async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({ message: "No resume uploaded" })
        }

        if (!process.env.AFFINDA_API_KEY || !process.env.AFFINDA_WORKSPACE) {
            return res.status(500).json({ message: "Affinda environment variables missing" })
        }

        console.log("[Resume Upload] File received:", req.file.originalname, "| Size:", req.file.size, "bytes")

        // Build form data
        const formData = new FormData()

        formData.append("file", req.file.buffer, {
            filename:    req.file.originalname,
            contentType: req.file.mimetype || "application/octet-stream"
        })

        // Only send workspace if the ID is configured (skip to use Affinda default)
        if (process.env.AFFINDA_WORKSPACE) {
            formData.append("workspace", process.env.AFFINDA_WORKSPACE)
        }



        console.log("[Resume Upload] Submitting to Affinda (async)...")

        // Add wait=true so Affinda returns the fully parsed document immediately
        // instead of requiring a webhook callback (which can't reach localhost)
        formData.append("wait", "true")

        const affindaRes = await axios.post(
            "https://api.affinda.com/v3/documents",
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    Authorization: `Bearer ${process.env.AFFINDA_API_KEY}`
                },
                timeout: 120000 // 2 min timeout for synchronous parsing
            }
        )

        // ── DEBUG: Log the full Affinda response to see what we got ──────
        console.log("[Resume Upload] ── Full Affinda response ──")
        console.log(JSON.stringify(affindaRes.data, null, 2))
        console.log("[Resume Upload] ── End Affinda response ──")

        const identifier = affindaRes.data?.meta?.identifier || affindaRes.data?.identifier || "unknown"
        const rawData    = affindaRes.data?.data || {}
        const isReady    = affindaRes.data?.meta?.ready || false

        console.log("[Resume Upload] Affinda accepted document. Identifier:", identifier)
        console.log("[Resume Upload] Ready:", isReady)
        console.log("[Resume Upload] Parsed data keys:", Object.keys(rawData))

        // If Affinda returned parsed data (wait=true worked), process immediately
        if (isReady && Object.keys(rawData).length > 0) {

            console.log("[Resume Upload] ── Affinda returned parsed data, processing now ──")
            console.log("[Resume Upload] Sending to Gemini Flash for restructuring...")

            const structured = await restructureResume(rawData)

            console.log("[Resume Upload] ── Structured data from Gemini ──")
            console.log(JSON.stringify(structured, null, 2))

            // Save to MongoDB
            console.log("[Resume Upload] Saving to MongoDB...")

            const resumeUrl =
                affindaRes.data?.meta?.file ||
                affindaRes.data?.meta?.pdf  ||
                ""

            const resume = await Resume.create({
                name:           structured.name           || "",
                email:          structured.email          || "",
                skills:         structured.skills         || [],
                experience:     structured.experience     || [],
                education:      structured.education      || [],
                projects:       structured.projects       || [],
                certifications: structured.certifications || [],
                achievements:   structured.achievements   || [],
                resumeUrl
            })

            console.log("[Resume Upload] ── DONE ── Saved resume with id:", resume._id)

            return res.status(201).json({
                message: "Resume uploaded, parsed, and saved successfully",
                resumeId: resume._id,
                resume
            })
        }

        // If Affinda didn't return data yet, return identifier for manual processing
        res.status(202).json({
            message:    "Resume submitted. Use /api/resume/process/" + identifier + " to trigger processing.",
            identifier
        })

    } catch (err) {

        console.error("[Resume Upload] ERROR:", err.message)

        if (err.response) {
            console.error("[Resume Upload] Affinda error status:", err.response.status)
            console.error("[Resume Upload] Affinda error data:", JSON.stringify(err.response.data, null, 2))
        }

        res.status(500).json({
            message: "Resume upload failed",
            error:   err.response?.data || err.message
        })
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — Webhook endpoint
// Affinda POSTs the fully parsed resume here when processing is complete.
// We verify the signature, send data to Gemini, then save to MongoDB.
// ─────────────────────────────────────────────────────────────────────────────
const affindaWebhook = async (req, res) => {

    try {

        console.log("[Webhook] ── Affinda webhook received ──")

        // ── Verify webhook signature ─────────────────────────────────────────
        const secret    = process.env.AFFINDA_WEBHOOK_SECRET
        const signature = req.headers["x-signature"] || req.headers["x-affinda-signature"] || ""
        const body      = JSON.stringify(req.body)

        if (secret) {
            const expected = crypto
                .createHmac("sha256", secret)
                .update(body)
                .digest("hex")

            if (signature && signature !== expected) {
                console.warn("[Webhook] Signature mismatch — rejecting request")
                return res.status(401).json({ message: "Invalid webhook signature" })
            }
        }

        // ── Extract parsed data from Affinda payload ─────────────────────────
        const payload    = req.body
        const rawData    = payload?.document?.data || payload?.data || {}
        const meta       = payload?.document?.meta || payload?.meta || {}
        const identifier = meta?.identifier || "unknown"

        console.log("[Webhook] Document identifier:", identifier)
        console.log("[Webhook] Available Affinda keys:", Object.keys(rawData))

        if (Object.keys(rawData).length === 0) {
            console.warn("[Webhook] Empty data from Affinda — skipping")
            return res.status(200).json({ message: "Received but no data to process" })
        }

        // ── Send to Gemini Flash ─────────────────────────────────────────────
        console.log("[Webhook] Sending to Gemini Flash for restructuring...")

        const structured = await restructureResume(rawData)

        // ── Save to MongoDB ──────────────────────────────────────────────────
        console.log("[Webhook] Saving to MongoDB...")

        const resumeUrl =
            meta?.file ||
            meta?.pdf  ||
            meta?.sourceDocuments?.[0]?.url ||
            ""

        const resume = await Resume.create({
            name:           structured.name           || "",
            email:          structured.email          || "",
            skills:         structured.skills         || [],
            experience:     structured.experience     || [],
            education:      structured.education      || [],
            projects:       structured.projects       || [],
            certifications: structured.certifications || [],
            achievements:   structured.achievements   || [],
            resumeUrl
        })

        console.log("[Webhook] ── DONE ── Saved resume with id:", resume._id)

        // Affinda expects a 200 OK to confirm receipt
        res.status(200).json({ message: "Webhook processed successfully", resumeId: resume._id })

    } catch (err) {

        console.error("[Webhook] ERROR:", err.message)

        // Still return 200 so Affinda doesn't keep retrying
        res.status(200).json({ message: "Webhook received but processing failed", error: err.message })
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY — Check what Affinda parsed for a given document identifier
// GET /api/resume/check/:identifier
// ─────────────────────────────────────────────────────────────────────────────
const checkAffindaDocument = async (req, res) => {

    try {

        const { identifier } = req.params

        if (!identifier) {
            return res.status(400).json({ message: "Identifier is required" })
        }

        console.log("[Check] Fetching Affinda document:", identifier)

        const response = await axios.get(
            `https://api.affinda.com/v3/documents/${identifier}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.AFFINDA_API_KEY}`
                }
            }
        )

        const rawData = response.data?.data || {}
        const meta   = response.data?.meta  || {}

        console.log("[Check] Document status:", meta?.ready ? "ready" : "processing")
        console.log("[Check] Available keys:", Object.keys(rawData))
        console.log("[Check] Full parsed data:")
        console.log(JSON.stringify(rawData, null, 2))

        res.status(200).json({
            identifier,
            ready:    meta?.ready || false,
            dataKeys: Object.keys(rawData),
            rawData,
            meta
        })

    } catch (err) {

        console.error("[Check] ERROR:", err.message)

        if (err.response) {
            console.error("[Check] Affinda error:", JSON.stringify(err.response.data, null, 2))
        }

        res.status(500).json({
            message: "Failed to fetch document from Affinda",
            error:   err.response?.data || err.message
        })
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MANUAL TRIGGER — Fetch Affinda doc by identifier → Gemini → MongoDB
// POST /api/resume/process/:identifier
// Use this when webhook can't reach localhost (local dev)
// ─────────────────────────────────────────────────────────────────────────────
const processDocument = async (req, res) => {

    try {

        const { identifier } = req.params

        if (!identifier) {
            return res.status(400).json({ message: "Identifier is required" })
        }

        console.log("[Process] ── STEP 1: Fetching from Affinda ── Identifier:", identifier)

        // ── Fetch from Affinda ────────────────────────────────────────────
        const affindaRes = await axios.get(
            `https://api.affinda.com/v3/documents/${identifier}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.AFFINDA_API_KEY}`
                }
            }
        )

        const rawData = affindaRes.data?.data || {}
        const meta   = affindaRes.data?.meta  || {}

        console.log("[Process] Affinda ready:", meta?.ready)
        console.log("[Process] Available keys:", Object.keys(rawData))
        console.log("[Process] Full Affinda data:")
        console.log(JSON.stringify(rawData, null, 2))

        if (Object.keys(rawData).length === 0) {
            return res.status(422).json({
                message: "Affinda has not parsed any data yet. Wait a moment and try again.",
                ready: meta?.ready,
                identifier
            })
        }

        // ── Send to Gemini Flash ───────────────────────────────────────
        console.log("[Process] ── STEP 2: Sending to Gemini Flash ──")

        const structured = await restructureResume(rawData)

        // ── Save to MongoDB ───────────────────────────────────────────
        console.log("[Process] ── STEP 3: Saving to MongoDB ──")

        const resumeUrl =
            meta?.file ||
            meta?.pdf  ||
            meta?.sourceDocuments?.[0]?.url ||
            ""

        const resume = await Resume.create({
            name:           structured.name           || "",
            email:          structured.email          || "",
            skills:         structured.skills         || [],
            experience:     structured.experience     || [],
            education:      structured.education      || [],
            projects:       structured.projects       || [],
            certifications: structured.certifications || [],
            achievements:   structured.achievements   || [],
            resumeUrl
        })

        console.log("[Process] ── DONE ── Saved resume id:", resume._id)

        res.status(201).json({
            message: "Resume processed and saved successfully",
            resume
        })

    } catch (err) {

        console.error("[Process] ERROR:", err.message)

        if (err.response) {
            console.error("[Process] Affinda error:", JSON.stringify(err.response.data, null, 2))
        }

        res.status(500).json({
            message: "Processing failed",
            error:   err.response?.data || err.message
        })
    }
}

module.exports = { uploadResume, affindaWebhook, checkAffindaDocument, processDocument }

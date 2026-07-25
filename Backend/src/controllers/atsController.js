const pdfParseLib = require("pdf-parse")
const pdfParse    = pdfParseLib.default || pdfParseLib
const mammoth     = require("mammoth")
const { GoogleGenAI } = require("@google/genai")

const ai = new GoogleGenAI({})

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL — extract plain text from buffer
// ─────────────────────────────────────────────────────────────────────────────
const extractText = async (buffer, mimetype, originalname) => {
    if (mimetype === "application/pdf") {
        const data = await pdfParse(buffer)
        return data.text
    }
    if (
        mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        (originalname && originalname.endsWith(".docx"))
    ) {
        const result = await mammoth.extractRawText({ buffer })
        return result.value
    }
    throw new Error("Unsupported file type. Please upload a PDF or DOCX file.")
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ats/analyze
// Accepts: multipart/form-data with `resume` (file) + `targetRole` (string)
// Returns: ATS analysis JSON
// ─────────────────────────────────────────────────────────────────────────────
const analyzeATS = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No resume file uploaded." })
        }

        const targetRole = req.body.targetRole 

        console.log("[ATS] File received:", req.file.originalname, "| Role:", targetRole)

        // ── Extract text ──────────────────────────────────────────────────────
        const rawText = await extractText(req.file.buffer, req.file.mimetype, req.file.originalname)

        if (!rawText || rawText.trim().length === 0) {
            return res.status(400).json({ message: "Could not extract readable text from the document." })
        }

        console.log("[ATS] Text extracted (", rawText.length, "chars). Sending to Gemini 3 for ATS analysis...")

        // ── Gemini ATS prompt ─────────────────────────────────────────────────
        const prompt = `
You are an expert ATS (Applicant Tracking System) evaluator and career coach.

Analyze the following resume text for the target job role: "${targetRole}".

Evaluate the resume from an ATS perspective and return ONLY a valid JSON object with this exact structure.
No markdown, no explanation, no code fences — just raw JSON.

{
  "atsScore": <number 0-100 — overall ATS compatibility score>,
  "keywordMatch": <number 0-100 — how well resume keywords match the target role>,
  "skillsMatch": <number 0-100 — relevant technical skills coverage>,
  "experienceMatch": <number 0-100 — relevance and depth of work experience>,
  "educationMatch": <number 0-100 — education relevance to role>,
  "formattingScore": <number 0-100 — resume formatting ATS-friendliness>,
  "missingKeywords": ["list of important keywords/skills missing for this role"],
  "strengths": ["list of strong points found in this resume for this role"],
  "suggestions": ["list of specific actionable improvements to boost ATS score"]
}

Rules:
- Be realistic and honest with scores. Do not inflate them.
- missingKeywords: list 3–8 key terms/technologies typically required for "${targetRole}" that are absent from the resume.
- strengths: list 3–5 genuine strong points visible in the resume.
- suggestions: list 4–6 specific, actionable improvements (e.g. "Add measurable metrics to your experience bullets").
- All scores must be integers between 0 and 100.

Resume Text:
${rawText}
`

        const result = await ai.models.generateContent({
            model: "gemini-3.1-flash",
            contents: prompt
        })
        const rawResp = result.text.trim()

        console.log("[ATS] Gemini response received.")

        // Strip accidental markdown fences
        const cleaned = rawResp
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/```\s*$/i, "")
            .trim()

        let analysis
        try {
            analysis = JSON.parse(cleaned)
        } catch (e) {
            console.error("[ATS] JSON parse failed:", cleaned)
            return res.status(500).json({ message: "Gemini returned invalid JSON.", raw: cleaned })
        }

        console.log("[ATS] Analysis complete. ATS Score:", analysis.atsScore)

        return res.status(200).json({ targetRole, analysis })

    } catch (err) {
        console.error("[ATS] ERROR:", err.message)
        return res.status(500).json({ message: "ATS analysis failed.", error: err.message })
    }
}

module.exports = { analyzeATS }

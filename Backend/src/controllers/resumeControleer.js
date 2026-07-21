const Resume = require("../models/Resume")
const User   = require("../models/User")
const pdfParse = require("pdf-parse")
const mammoth = require("mammoth")
const { GoogleGenAI } = require("@google/genai")

const ai = new GoogleGenAI({})

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL — Extract text from PDF buffer
// ─────────────────────────────────────────────────────────────────────────────
const extractTextFromPDF = async (buffer) => {
    try {
        const data = await pdfParse(buffer)
        return data.text
    } catch (err) {
        console.error("[PDF Parse Error]:", err.message)
        throw new Error("Failed to extract text from PDF: " + err.message)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL — Extract text from DOCX buffer
// ─────────────────────────────────────────────────────────────────────────────
const extractTextFromDOCX = async (buffer) => {
    try {
        const result = await mammoth.extractRawText({ buffer })
        return result.value
    } catch (err) {
        console.error("[Mammoth DOCX Parse Error]:", err.message)
        throw new Error("Failed to extract text from DOCX: " + err.message)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL — Use Gemini to structure raw text
// ─────────────────────────────────────────────────────────────────────────────
const structureResumeText = async (rawText) => {
    const prompt = `
You are a resume data extraction expert. Below is the raw text extracted from a candidate's resume (PDF/DOCX).
Analyze the text and extract all relevant information to restructure it into a clean JSON object with EXACTLY these 8 fields.

Return ONLY a valid JSON object. Do not include markdown code blocks, do not include any other text or explanations — just return the raw JSON.

Required JSON structure:
{
  "name": "string — candidate's full name",
  "email": "string — primary email address",
  "phone": "string — phone number if present, else empty string",
  "skills": ["array of technical skills: programming languages, frameworks, databases, cloud, tools, AI/ML, DevOps etc. Remove duplicates."],
  "experience": [
    {
      "company": "string",
      "role": "string",
      "duration": "string — e.g. Jan 2022 - Mar 2023",
      "description": "string — responsibilities and achievements"
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "year": "string — graduation year or date range"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["array of tech used"]
    }
  ],
  "certifications": ["array of certification name strings"],
  "achievements": ["array of awards, honors, rankings, hackathon wins, publications etc."]
}

Rules:
- If a field has no data in the text, use an empty string "" or empty array [] as appropriate.
- Do NOT invent data that isn't in the provided text.
- Extract ALL technical skills mentioned anywhere in the resume.
- Achievements can include open-source contributions, competitive programming accomplishments, etc.

Raw Resume Text:
${rawText}
`

    const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt
    })
    const responseText = result.text.trim()

    console.log("[Gemini Parser] ── Raw Gemini response ──")
    console.log(responseText)
    console.log("[Gemini Parser] ── End of response ──")

    // Strip accidental markdown fences
    const cleanedText = responseText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim()

    let structured
    try {
        structured = JSON.parse(cleanedText)
    } catch (parseErr) {
        console.error("[Gemini Parser] JSON parse failed. Cleaned text:")
        console.error(cleanedText)
        throw new Error(`Gemini returned invalid JSON: ${parseErr.message}`)
    }

    return structured
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/resume/upload
// Accepts a PDF/DOCX upload, parses it locally, structures it using Gemini, saves to MongoDB.
// ─────────────────────────────────────────────────────────────────────────────
const uploadResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No resume uploaded" })
        }

        console.log("[Resume Upload] File received:", req.file.originalname, "| Size:", req.file.size, "bytes | Mimetype:", req.file.mimetype)

        let extractedText = ""

        if (req.file.mimetype === "application/pdf") {
            console.log("[Resume Upload] Parsing PDF file locally using pdf-parse...")
            extractedText = await extractTextFromPDF(req.file.buffer)
        } else if (
            req.file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
            req.file.originalname.endsWith(".docx")
        ) {
            console.log("[Resume Upload] Parsing DOCX file locally using mammoth...")
            extractedText = await extractTextFromDOCX(req.file.buffer)
        } else {
            return res.status(400).json({ message: "Unsupported file type. Please upload a PDF or DOCX file." })
        }

        if (!extractedText || extractedText.trim().length === 0) {
            return res.status(400).json({ message: "Failed to extract readable text from the uploaded document." })
        }

        console.log("[Resume Upload] Text extracted successfully (length:", extractedText.length, "chars). Structuring with Gemini...")
        const structured = await structureResumeText(extractedText)

        console.log("[Resume Upload] Saving to MongoDB...")
        const resume = await Resume.create({
            user:           req.user._id,
            name:           structured.name           || "",
            email:          structured.email          || "",
            phone:          structured.phone          || "",
            skills:         structured.skills         || [],
            experience:     structured.experience     || [],
            education:      structured.education      || [],
            projects:       structured.projects       || [],
            certifications: structured.certifications || [],
            achievements:   structured.achievements   || [],
            resumeUrl:      ""  // You can set this if you upload the document to Cloudinary / storage
        })

        // Link resume to user
        await User.findByIdAndUpdate(req.user._id, {
            $push: { resumes: resume._id }
        })

        console.log("[Resume Upload] ── DONE ── Saved resume id:", resume._id)

        return res.status(201).json({
            message:  "Resume uploaded, parsed, and saved successfully",
            resumeId: resume._id,
            resume
        })

    } catch (err) {
        console.error("[Resume Upload] ERROR:", err.message)
        return res.status(500).json({
            message: "Resume upload and parsing failed",
            error:   err.message
        })
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/resume/my
// Returns all resumes for the currently authenticated user.
// ─────────────────────────────────────────────────────────────────────────────
const getMyResumes = async (req, res) => {
    try {
        const resumes = await Resume.find({ user: req.user._id }).sort({ createdAt: -1 })
        return res.status(200).json({
            count: resumes.length,
            resumes
        })
    } catch (err) {
        console.error("[Get Resumes] ERROR:", err.message)
        return res.status(500).json({
            message: "Failed to fetch resumes",
            error:   err.message
        })
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/resume/:id
// Returns a single resume by its MongoDB _id (must belong to the logged-in user).
// ─────────────────────────────────────────────────────────────────────────────
const getResumeById = async (req, res) => {
    try {
        const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id })
        if (!resume) {
            return res.status(404).json({ message: "Resume not found" })
        }
        return res.status(200).json({ resume })
    } catch (err) {
        console.error("[Get Resume] ERROR:", err.message)
        return res.status(500).json({
            message: "Failed to fetch resume",
            error:   err.message
        })
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/resume/:id
// Deletes a resume by its MongoDB _id (must belong to the logged-in user).
// ─────────────────────────────────────────────────────────────────────────────
const deleteResume = async (req, res) => {
    try {
        const resume = await Resume.findOneAndDelete({ _id: req.params.id, user: req.user._id })
        if (!resume) {
            return res.status(404).json({ message: "Resume not found or not authorized" })
        }

        // Remove reference from User document
        await User.findByIdAndUpdate(req.user._id, {
            $pull: { resumes: resume._id }
        })

        return res.status(200).json({ message: "Resume deleted successfully" })
    } catch (err) {
        console.error("[Delete Resume] ERROR:", err.message)
        return res.status(500).json({
            message: "Failed to delete resume",
            error:   err.message
        })
    }
}

module.exports = { uploadResume, getMyResumes, getResumeById, deleteResume }

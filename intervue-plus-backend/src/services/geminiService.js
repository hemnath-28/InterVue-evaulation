const { GoogleGenerativeAI } = require("@google/generative-ai")

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

/**
 * Sends raw Affinda resume data to Gemini Flash and gets back
 * a clean, structured 8-column resume object.
 *
 * @param {Object} affindaData - The raw `data` object from Affinda response
 * @returns {Object} Structured resume with 8 columns
 */
const restructureResume = async (affindaData) => {

    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" })

    // ── DEBUG: Log the full Affinda data being sent to Gemini ────────────────
    console.log("[Gemini] ── Affinda data being sent to Gemini ──")
    console.log(JSON.stringify(affindaData, null, 2))
    console.log("[Gemini] ── End of Affinda data ──")

    const affindaString = JSON.stringify(affindaData, null, 2)

    if (!affindaString || affindaString === "{}") {
        console.error("[Gemini] ERROR: affindaData is empty! Cannot restructure.")
        throw new Error("Affinda returned no parseable data to send to Gemini")
    }

    const prompt = `
You are a resume data extraction expert. Below is raw resume data extracted by an OCR/AI parser (Affinda).
Your task is to restructure this into a clean JSON object with EXACTLY these 8 fields.

Return ONLY valid JSON. No markdown, no explanation, no code fences. Just the raw JSON object.

Required output format:
{
  "name": "string — candidate's full name",
  "email": "string — primary email address",
  "skills": ["array of skill strings"],
  "experience": [
    {
      "company": "string",
      "role": "string",
      "duration": "string",
      "description": "string"
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "year": "string"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["array of strings"]
    }
  ],
  "certifications": ["array of certification name strings"],
  "achievements": ["array of achievement or award strings"]
}

Rules:
- If a field has no data, use an empty string "" or empty array [] as appropriate
- Do NOT invent data that isn't present in the raw input
- Extract ALL skills mentioned anywhere in the resume
- For experience duration, use the raw text dates if available (e.g. "Jan 2022 - Mar 2023")
- For education year, use graduation year or date range
- Achievements can include awards, honors, rankings, hackathon wins, publications, etc.

Raw Affinda Data:
${affindaString}
`

    console.log("[Gemini] Sending to Gemini Flash (gemini-3.1-flash-lite)...")

    const result = await model.generateContent(prompt)
    const responseText = result.response.text().trim()

    // ── DEBUG: Log the exact raw response from Gemini ────────────────────────
    console.log("[Gemini] ── Raw Gemini response text ──")
    console.log(responseText)
    console.log("[Gemini] ── End of Gemini response ──")

    // Strip any accidental markdown code fences if Gemini adds them
    const cleanedText = responseText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim()

    let structured
    try {
        structured = JSON.parse(cleanedText)
    } catch (parseErr) {
        console.error("[Gemini] JSON parse failed! Cleaned text was:")
        console.error(cleanedText)
        throw new Error(`Gemini returned invalid JSON: ${parseErr.message}`)
    }

    console.log("[Gemini] ── Parsed structured resume ──")
    console.log("[Gemini] Name:", structured.name)
    console.log("[Gemini] Email:", structured.email)
    console.log("[Gemini] Skills count:", structured.skills?.length || 0)
    console.log("[Gemini] Experience count:", structured.experience?.length || 0)
    console.log("[Gemini] Education count:", structured.education?.length || 0)
    console.log("[Gemini] Projects count:", structured.projects?.length || 0)
    console.log("[Gemini] Certifications count:", structured.certifications?.length || 0)
    console.log("[Gemini] Achievements count:", structured.achievements?.length || 0)

    return structured
}

module.exports = { restructureResume }

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({});

/**
 * Generates interview questions based on candidate's resume, target role, and experience level.
 * @param {Object} resumeData - The structured resume data from MongoDB
 * @param {String} targetRole - The target job role
 * @param {String} experienceLevel - The candidate's experience level
 * @returns {Object} Structured JSON containing generated interview questions
 */
const generateQuestions = async (resumeData, targetRole, experienceLevel) => {

    const prompt = `
You are an expert technical interviewer. Generate interview questions for a candidate applying for the role of ${targetRole} with an experience level of ${experienceLevel}.

Here is the candidate's resume data:
${JSON.stringify(resumeData, null, 2)}

Based on their resume projects, skills, target role, and experience level, generate the following number of questions:
- Introduction: 1 question
- Resume: 2 questions (specific to their listed projects or experience)
- Technical: 2 questions (specific to the skills and target role)
- Behavioral: 1 questions
- Situational: 1 questions

Return ONLY a structured JSON object in the exact format below, with no markdown formatting, no code blocks, and no extra text. The arrays should contain string values representing the questions:
{
  "Introduction": [],
  "Resume": [],
  "Technical": [],
  "Behavioral": [],
  "Situational": []
}
`;

    console.log("[InterviewService] Sending prompt to Gemini to generate questions...");
    const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json"
        }
    });
    const responseText = result.text.trim();

    // Strip any accidental markdown code fences
    const cleanedText = responseText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();

    let questions;
    try {
        questions = JSON.parse(cleanedText);
    } catch (parseErr) {
        console.error("[InterviewService] JSON parse failed! Cleaned text was:", cleanedText);
        throw new Error("Failed to parse AI response into valid JSON");
    }

    return questions;
};

module.exports = {
    generateQuestions
};

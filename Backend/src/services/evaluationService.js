const axios = require("axios");

/**
 * Evaluates an interview answer using Groq's LLM API
 * @param {String} question - The interview question asked
 * @param {String} answer - The candidate's answer
 * @param {String} targetRole - The target job role
 * @param {String} experienceLevel - The candidate's experience level
 * @param {String} roundType - The interview round type (e.g., Technical, Behavioral)
 * @returns {Object} Structured JSON containing evaluation score, feedback, strengths, weaknesses, and follow-up question
 */
const evaluateAnswer = async (question, answer, targetRole, experienceLevel, roundType) => {
    const prompt = `
You are an expert technical interviewer evaluating a candidate for a ${targetRole} position at the ${experienceLevel} level. 
This is a ${roundType} round.

Evaluate the candidate's answer based on:
1. Correctness
2. Technical Depth
3. Communication Clarity
4. Confidence (inferred from phrasing)
5. Completeness

Question asked:
"${question}"

Candidate's Answer:
"${answer}"

Return ONLY a valid JSON object with the exact following structure. Do not include markdown code blocks, do not include any other text:
{
   "score": <number from 1 to 10>,
   "feedback": "<string: concise overall feedback>",
   "strengths": ["<string>", "<string>"],
   "weaknesses": ["<string>", "<string>"],
   "followUpQuestion": "<string: a relevant follow-up question based on their answer>"
}
`;

    console.log("[EvaluationService] Sending evaluation prompt to Groq...");
    
    const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: "You are an expert technical interviewer. Always respond with strict JSON."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3
        },
        {
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            }
        }
    );

    const responseText = response.data.choices[0].message.content.trim();

    let evaluation;
    try {
        evaluation = JSON.parse(responseText);
    } catch (parseErr) {
        console.error("[EvaluationService] JSON parse failed! Raw text was:", responseText);
        throw new Error("Failed to parse AI response into valid JSON");
    }

    return evaluation;
};

const evaluateFullSession = async (sessionData) => {
    const { targetRole, experienceLevel, rounds } = sessionData;

    // Format all Q&A pairs for the prompt
    let qaText = "";
    rounds.forEach((round, roundIndex) => {
        qaText += `\n--- Round ${roundIndex + 1}: ${round.roundType} ---\n`;
        round.questions.forEach((q, qIndex) => {
            qaText += `Q${qIndex + 1}: ${q.questionText}\n`;
            qaText += `Answer: ${q.userAnswer || "[No Answer Provided]"}\n\n`;
        });
    });

    const prompt = `
You are an expert technical interviewer evaluating a candidate for a ${targetRole} position at the ${experienceLevel} level. 
The candidate has just completed their interview. Below is the full transcript of questions asked and the candidate's answers.

Evaluate the candidate's overall performance.
Return ONLY a valid JSON object with the exact following structure. Do not include markdown code blocks or any other text.
{
   "overallScore": <number from 1 to 10, representing the overall interview score>,
   "overallFeedback": "<string: a detailed, comprehensive summary of their overall performance. You MUST write at least 3 to 4 full sentences discussing their technical alignment with the target role, key strengths, communication clarity, and major areas of improvement. Do not make this a single line.>",
   "questionEvaluations": [
       {
           "questionText": "<string: the exact question text>",
           "score": <number 1 to 10 for this specific answer>,
           "feedback": "<string: feedback for this specific answer>"
       }
   ]
}

Interview Transcript:
${qaText}
`;

    console.log("[EvaluationService] Sending full session evaluation prompt to Groq...");
    
    const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: "You are an expert technical interviewer. Always respond with strict JSON."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3
        },
        {
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            }
        }
    );

    const responseText = response.data.choices[0].message.content.trim();

    let evaluation;
    try {
        evaluation = JSON.parse(responseText);
    } catch (parseErr) {
        console.error("[EvaluationService] JSON parse failed! Raw text was:", responseText);
        throw new Error("Failed to parse AI response into valid JSON");
    }

    return evaluation;
};

module.exports = {
    evaluateAnswer,
    evaluateFullSession
};

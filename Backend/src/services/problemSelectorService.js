const { GoogleGenAI } = require("@google/genai");
const Problem = require("../models/Problem");

const ai = new GoogleGenAI({});

// ─────────────────────────────────────────────────────────────────────────────
// Role → DSA Topic mapping (fast fallback — no AI call needed)
// ─────────────────────────────────────────────────────────────────────────────
const ROLE_TOPIC_MAP = {
    "Frontend Developer":        ["Arrays", "Strings", "Recursion", "Sorting"],
    "Backend Developer":         ["Graphs", "Trees", "Hashing", "Sorting", "Greedy"],
    "Full Stack Developer":      ["Arrays", "Strings", "Trees", "Hashing"],
    "Software Engineer":         ["Dynamic Programming", "Graphs", "Trees", "Sorting"],
    "Node.js Developer":         ["Graphs", "Hashing", "Strings", "Queues"],
    "React Developer":           ["Arrays", "Strings", "Recursion"],
    "Mobile App Developer":      ["Arrays", "Trees", "Graphs"],
    "iOS Developer":             ["Arrays", "Strings", "Trees"],
    "Android Developer":         ["Arrays", "Graphs", "Dynamic Programming"],
    "AI Engineer":               ["Dynamic Programming", "Math", "Graphs"],
    "Machine Learning Engineer": ["Math", "Arrays", "Dynamic Programming"],
    "Data Engineer":             ["SQL", "Graphs", "Sorting", "Hashing"],
    "Data Scientist":            ["Math", "Dynamic Programming", "Sorting"],
    "DevOps Engineer":           ["Graphs", "Trees", "Strings"],
    "Cloud Engineer":            ["Graphs", "Greedy", "Sorting"],
    "Security Engineer":         ["Bit Manipulation", "Strings", "Hashing"],
    "Cybersecurity Analyst":     ["Strings", "Hashing", "Bit Manipulation"],
    "QA Automation Engineer":    ["Arrays", "Strings", "Recursion"],
    "QA/Test Automation Engineer":["Arrays", "Strings", "Recursion"],
    "Embedded Systems Engineer": ["Bit Manipulation", "Arrays", "Math"],
    "UI/UX Designer":            ["Arrays", "Strings"]
};

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL — Ask Gemini to recommend the best DSA topic for a role
// Used as a smarter fallback when the role isn't in the static map
// ─────────────────────────────────────────────────────────────────────────────
const getTopicFromGemini = async (targetRole) => {
    const prompt = `
You are a technical interview expert. Given the job role "${targetRole}", 
return the single most relevant DSA (Data Structures & Algorithms) topic for a coding interview.

Return ONLY the topic name as plain text. No explanation, no punctuation.
Examples of valid topics: Arrays, Strings, Trees, Graphs, Dynamic Programming, Hashing, Sorting, Recursion, Greedy, Math, Bit Manipulation
`;

    try {
        const result = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt
        });
        return result.text.trim();
    } catch (err) {
        console.error("[ProblemSelector] Gemini topic selection failed:", err.message);
        return "Arrays"; // Safe fallback
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT — Select a random problem from DB based on target role
// ─────────────────────────────────────────────────────────────────────────────
const selectProblemForRole = async (targetRole) => {
    console.log(`[ProblemSelector] Selecting problem for role: "${targetRole}"`);

    // Step 1: Get topics for this role (static map first, then Gemini)
    let topics = ROLE_TOPIC_MAP[targetRole];

    if (!topics) {
        console.log("[ProblemSelector] Role not in static map — asking Gemini...");
        const geminiTopic = await getTopicFromGemini(targetRole);
        topics = [geminiTopic];
    }

    console.log(`[ProblemSelector] Trying topics: ${topics.join(", ")}`);

    // Step 2: Try to find a problem with matching tag
    for (const topic of topics) {
        const count = await Problem.countDocuments({ tags: topic });
        if (count > 0) {
            // Pick a random one from this tag
            const skip = Math.floor(Math.random() * count);
            const problem = await Problem.findOne({ tags: topic }).skip(skip);
            if (problem) {
                console.log(`[ProblemSelector] Found problem: "${problem.title}" (tag: ${topic})`);
                return problem;
            }
        }
    }

    // Step 3: Fallback — return any random problem from DB
    console.warn("[ProblemSelector] No tag-matched problem found. Falling back to random problem.");
    const totalCount = await Problem.countDocuments();
    if (totalCount === 0) return null;

    const skip = Math.floor(Math.random() * totalCount);
    return await Problem.findOne().skip(skip);
};

module.exports = { selectProblemForRole };

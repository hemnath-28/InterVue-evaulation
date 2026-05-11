const Resume = require("../models/Resume");
const InterviewSession = require("../models/InterviewSession");
const { generateQuestions } = require("../services/interviewService");

const generateInterview = async (req, res) => {
    try {
        const { resumeId, targetRole, experienceLevel } = req.body;

        if (!resumeId || !targetRole || !experienceLevel) {
            return res.status(400).json({
                message: "resumeId, targetRole, and experienceLevel are required fields."
            });
        }

        // We assume the user is authenticated via protect middleware
        // TEMPORARY: For testing without auth, provide a dummy MongoDB ObjectId
        const mongoose = require("mongoose");
        const userId = req.user ? req.user._id : new mongoose.Types.ObjectId();

        console.log(`[InterviewController] Fetching resume ${resumeId}...`);
        const resume = await Resume.findById(resumeId);

        if (!resume) {
            return res.status(404).json({ message: "Resume not found." });
        }

        console.log(`[InterviewController] Generating questions for ${targetRole} (${experienceLevel})...`);
        const aiQuestions = await generateQuestions(resume, targetRole, experienceLevel);

        // Map the generated questions to the InterviewSession schema's rounds structure
        const rounds = [];
        
        const mapQuestionsToSchema = (questionsArray, roundType, topic) => {
            if (!questionsArray || !Array.isArray(questionsArray)) return null;
            
            return {
                roundType: roundType,
                status: "Pending",
                questions: questionsArray.map(q => ({
                    questionText: q,
                    topic: topic,
                    difficulty: "Medium" // Defaulting to medium as AI doesn't specify
                }))
            };
        };

        const introRound = mapQuestionsToSchema(aiQuestions.Introduction, "Introduction", "Behavioral");
        if (introRound) rounds.push(introRound);

        const resumeRound = mapQuestionsToSchema(aiQuestions.Resume, "Resume", "Behavioral");
        if (resumeRound) rounds.push(resumeRound);

        const technicalRound = mapQuestionsToSchema(aiQuestions.Technical, "Technical", "System Design"); // or Backend/Frontend
        if (technicalRound) rounds.push(technicalRound);

        const behavioralRound = mapQuestionsToSchema(aiQuestions.Behavioral, "Behavioral", "Behavioral");
        if (behavioralRound) rounds.push(behavioralRound);

        const situationalRound = mapQuestionsToSchema(aiQuestions.Situational, "Situational", "Behavioral");
        if (situationalRound) rounds.push(situationalRound);

        console.log("[InterviewController] Creating InterviewSession in database...");
        
        const interviewSession = await InterviewSession.create({
            user: userId,
            targetRole: targetRole,
            experienceLevel: experienceLevel,
            status: "Started",
            rounds: rounds
        });

        console.log("[InterviewController] InterviewSession created successfully.");

        return res.status(201).json({
            message: "Interview questions generated successfully.",
            interviewSessionId: interviewSession._id,
            generatedQuestions: aiQuestions,
            interviewSession: interviewSession
        });

    } catch (error) {
        console.error("[InterviewController] ERROR:", error.message);
        return res.status(500).json({
            message: "Failed to generate interview questions",
            error: error.message
        });
    }
};

module.exports = {
    generateInterview
};

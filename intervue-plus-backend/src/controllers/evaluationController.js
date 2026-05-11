const InterviewSession = require("../models/InterviewSession");
const { evaluateAnswer } = require("../services/evaluationService");

const evaluateInterviewAnswer = async (req, res) => {
    try {
        const { interviewSessionId, question, answer, targetRole, experienceLevel, roundType } = req.body;

        if (!question || !answer || !targetRole || !experienceLevel || !roundType) {
            return res.status(400).json({
                message: "question, answer, targetRole, experienceLevel, and roundType are required fields."
            });
        }

        console.log("[EvaluationController] Evaluating answer...");
        
        // Evaluate the answer using the AI service
        const evaluation = await evaluateAnswer(question, answer, targetRole, experienceLevel, roundType);

        // Store in DB if interviewSessionId is provided
        if (interviewSessionId) {
            console.log(`[EvaluationController] Storing evaluation in InterviewSession ${interviewSessionId}...`);
            
            const session = await InterviewSession.findById(interviewSessionId);
            
            if (session) {
                // Find the appropriate round
                let roundIndex = session.rounds.findIndex(r => r.roundType === roundType);
                
                // If round doesn't exist, create it
                if (roundIndex === -1) {
                    session.rounds.push({
                        roundType: roundType,
                        status: "Started",
                        messages: []
                    });
                    roundIndex = session.rounds.length - 1;
                }
                
                // Append the conversation and evaluation to messages
                session.rounds[roundIndex].messages.push({
                    sender: "AI",
                    text: question
                });
                
                session.rounds[roundIndex].messages.push({
                    sender: "User",
                    text: answer
                });
                
                // Store the evaluation summary as an AI message
                const evaluationText = JSON.stringify({
                    score: evaluation.score,
                    feedback: evaluation.feedback,
                    strengths: evaluation.strengths,
                    weaknesses: evaluation.weaknesses,
                    followUpQuestion: evaluation.followUpQuestion
                });
                
                session.rounds[roundIndex].messages.push({
                    sender: "AI",
                    text: evaluationText
                });
                
                // If it's a follow-up, ask the follow-up
                if (evaluation.followUpQuestion) {
                    session.rounds[roundIndex].messages.push({
                        sender: "AI",
                        text: evaluation.followUpQuestion
                    });
                }
                
                await session.save();
                console.log("[EvaluationController] Session updated successfully.");
            } else {
                console.warn(`[EvaluationController] InterviewSession ${interviewSessionId} not found. Skipping DB storage.`);
            }
        }

        return res.status(200).json({
            message: "Answer evaluated successfully.",
            evaluation: evaluation
        });

    } catch (error) {
        console.error("[EvaluationController] ERROR:", error.message);
        return res.status(500).json({
            message: "Failed to evaluate answer",
            error: error.message
        });
    }
};

module.exports = {
    evaluateInterviewAnswer
};

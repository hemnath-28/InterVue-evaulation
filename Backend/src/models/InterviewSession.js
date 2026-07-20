const mongoose = require("mongoose")

const InterviewSessionSchema = new mongoose.Schema({

    // USER ATTENDING INTERVIEW

    user: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "User",

        required: true
    },

    // TARGET JOB ROLE

    targetRole: {

        type: String,

        enum: [

        "Frontend Developer",
        "Backend Developer",
        "Full Stack Developer",
        "Software Engineer",
        "Node.js Developer",
        "React Developer",
        "Mobile App Developer", 
        "iOS Developer",        
        "Android Developer",   
        "AI Engineer",
        "Machine Learning Engineer",
        "Data Engineer",
        "Data Scientist",
        "DevOps Engineer",
        "Cloud Engineer",
        "Security Engineer",
        "Cybersecurity Analyst",
        "QA Automation Engineer",
        "QA/Test Automation Engineer",
        "Embedded Systems Engineer",
        "UI/UX Designer"

        ],

        required: true
    },

    // EXPERIENCE LEVEL

    experienceLevel: {

        type: String,

        enum: [

            "Fresher",

            "Junior",

            "Mid",

            "Senior"

        ],

        required: true
    },

    // INTERVIEW MODE — what the user chose at setup
    // 'coding'  → only coding round
    // 'voice'   → only voice interview
    // 'both'    → coding first, then voice interview

    mode: {

        type: String,

        enum: ["coding", "voice", "both"],

        default: "voice"
    },

    // OVERALL STATUS

    status: {

        type: String,

        enum: [

            "Started",

            "In Progress",

            "Completed",

            "Cancelled"

        ],

        default: "Started"
    },

    // OVERALL INTERVIEW SCORE

    overallScore: {

        type: Number,

        default: 0
    },

    // AI FINAL FEEDBACK (voice round feedback from Groq)

    overallFeedback: {

        type: String
    },

    // ─── CODING ROUND ────────────────────────────────────────────────────────
    // Populated when the user completes a DSA challenge in CodingRoom.html

    codingRound: {

        // Reference to the Problem document
        problemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Problem"
        },

        problemTitle: {
            type: String
        },

        // The code the user submitted
        submittedCode: {
            type: String
        },

        // Language used (javascript, python, cpp)
        language: {
            type: String
        },

        // Judge results
        testCasesPassed: {
            type: Number,
            default: 0
        },

        totalTestCases: {
            type: Number,
            default: 0
        },

        // Normalized score 0–10: (testCasesPassed / totalTestCases) × 10
        rawScore: {
            type: Number,
            default: 0
        },

        status: {
            type: String,
            enum: ["Pending", "Completed"],
            default: "Pending"
        }
    },

    // ─── FINAL COMBINED SCORE ────────────────────────────────────────────────
    // mode = 'coding' → finalScore = codingRound.rawScore
    // mode = 'voice'  → finalScore = overallScore
    // mode = 'both'   → finalScore = (codingRound.rawScore × 0.4) + (overallScore × 0.6)

    finalScore: {
        type: Number,
        default: 0
    },

    // Combined AI summary shown on Dashboard for 'both' mode
    finalFeedback: {
        type: String
    },

    // INTERVIEW ROUNDS

    rounds: [{

        // ROUND TYPE

        roundType: {

            type: String,

            enum: [

                "Introduction",

                "Resume",

                "Technical",

                "Coding",

                "Behavioral",

                "Situational"

            ],

            required: true
        },

        // ROUND DIFFICULTY

        difficulty: {

            type: String,

            enum: [

                "Easy",

                "Medium",

                "Hard"

            ]
        },

        questions: [{

            questionText: {
                type: String
            },

            topic: {

                type: String,

                enum: [

                    "DSA",

                    "Backend",

                    "Frontend",

                    "Database",

                    "Operating System",

                    "Networking",

                    "JavaScript",

                    "React",

                    "Node.js",

                    "System Design",

                    "Behavioral"

                ]
            },

            difficulty: {

                type: String,

                enum: [

                    "Easy",

                    "Medium",

                    "Hard"

                ]
            },

            // The transcribed answer from the candidate
            userAnswer: {
                type: String
            },

            // Individual question score (optional, we use overallScore primarily)
            score: {
                type: Number
            },

            // Individual AI feedback for this answer
            feedback: {
                type: String
            }

        }],

        // CODING PROBLEMS

        problems: [{

            type: mongoose.Schema.Types.ObjectId,

            ref: "Problem"
        }],

        // CHAT / CONVERSATION

        messages: [{

            sender: {

                type: String,

                enum: [

                    "AI",

                    "User"

                ]
            },

            text: {
                type: String
            },

            timestamp: {

                type: Date,

                default: Date.now
            }

        }],

        // ROUND SCORE

        score: {

            type: Number,

            default: 0
        },

        // AI FEEDBACK

        feedback: {

            type: String
        },

        // ROUND STATUS

        status: {

            type: String,

            enum: [

                "Pending",

                "Started",

                "Completed"

            ],

            default: "Pending"
        },

        // ROUND TIMINGS

        startedAt: {

            type: Date
        },

        endedAt: {

            type: Date
        }

    }],

    // FINAL RESULT

    result: {

        type: String,

        enum: [

            "Pass",

            "Fail",

            "Pending"

        ],

        default: "Pending"
    }

}, {
    timestamps: true
})

const InterviewSession = mongoose.model(

    "InterviewSession",

    InterviewSessionSchema
)

module.exports = InterviewSession
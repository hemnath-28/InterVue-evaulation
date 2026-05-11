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
        "QA Automation Engineer",
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

    // AI FINAL FEEDBACK

    overallFeedback: {

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

        // QUESTIONS ASKED

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
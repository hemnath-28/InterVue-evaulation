const mongoose = require("mongoose")

const InterviewSessionSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    overallScore: {
        type: Number,
        default: 0
    },

    status: {
        type: String,
        enum: ["Started", "Completed"],
        default: "Started"
    },

    rounds: [{

        roundType: {
            type: String,
            enum: [
                "Technical",
                "Behavioral",
                "Coding",
                "Resume",
                "Situational",
                "HR"
            ]
        },

        score: {
            type: Number,
            default: 0
        },

        feedback: {
            type: String
        },

        startedAt: {
            type: Date,
            default: Date.now
        },

        endedAt: {
            type: Date
        },

        messages: [{

            sender: {
                type: String,
                enum: ["AI", "User"]
            },

            text: {
                type: String
            },

            timestamp: {
                type: Date,
                default: Date.now
            }

        }]

    }]

}, {
    timestamps: true
})

const InterviewSession = mongoose.model(
    "InterviewSession",
    InterviewSessionSchema
)

module.exports = InterviewSession
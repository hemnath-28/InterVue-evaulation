const mongoose = require("mongoose")

const SubmissionSchema = new mongoose.Schema({

    // USER WHO SUBMITTED

    user: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "User",

        required: true
    },

    // CODING PROBLEM

    problem: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "Problem",

        required: true
    },

    // INTERVIEW SESSION

    interviewSession: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "InterviewSession",

        required: true
    },

    // ROUND TYPE

    roundType: {

        type: String,

        enum: [

            "Coding"

        ],

        default: "Coding"
    },

    // PROGRAMMING LANGUAGE

    language: {

        type: String,

        enum: [

            "JavaScript",

            "Python",

            "Java",

            "C++"

        ],

        required: true
    },

    // USER CODE

    code: {

        type: String,

        required: true
    },

    // EXECUTION STATUS

    status: {

        type: String,

        enum: [

            "Accepted",

            "Wrong Answer",

            "Runtime Error",

            "Compilation Error",

            "Time Limit Exceeded",

            "Pending"

        ],

        default: "Pending"
    },

    // OUTPUT

    output: {

        type: String
    },

    // EXECUTION TIME

    executionTime: {

        type: Number
    },

    // MEMORY USAGE

    memoryUsed: {

        type: Number
    },

    // PASSED TEST CASES

    passedTestCases: {

        type: Number,

        default: 0
    },

    // TOTAL TEST CASES

    totalTestCases: {

        type: Number,

        default: 0
    },

    // AI FEEDBACK

    feedback: {

        type: String
    },

    // ROUND SCORE

    score: {

        type: Number,

        default: 0
    }

}, {
    timestamps: true
})

const Submission = mongoose.model(
    "Submission",
    SubmissionSchema
)

module.exports = Submission
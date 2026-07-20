const mongoose = require("mongoose")

const ProblemSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        required: true
    },

    difficulty: {
        type: String,
        enum: ["Easy", "Medium", "Hard"],
        required: true
    },

    tags: [{
        type: String
    }],

    constraints: [{
        type: String
    }],

    examples: [{

        input: String,

        output: String,

        explanation: String
    }],

    starterCode: {

        python: String,

        javascript: String,

        cpp: String
    },

    supportedLanguages: [{
        type: String
    }],

    timeLimit: {
        type: Number,
        default: 2
    },

    visibleTestCases: [{

        input: String,

        expectedOutput: String
    }],

    hiddenTestCases: [{

        input: String,

        expectedOutput: String
    }]

}, {
    timestamps: true
})

module.exports= mongoose.model("Problem", ProblemSchema)
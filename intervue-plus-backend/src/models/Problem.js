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

    examples: [{
        input: String,
        output: String,
        explanation: String
    }],

    constraints: [{
        type: String
    }],

    visibleTestCases: [{
        input: String,
        expectedOutput: String
    }],

    hiddenTestCases: [{
        input: String,
        expectedOutput: String
    }],

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }

}, {
    timestamps: true
})

const Problem = mongoose.model("Problem", ProblemSchema)

module.exports = Problem
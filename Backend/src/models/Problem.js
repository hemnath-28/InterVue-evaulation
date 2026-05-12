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

    // DSA / Backend / Frontend

    topic: {

        type: String,

        enum: [

            "DSA",

            "Backend",

            "Frontend",

            "Database",

            "System Design",

            "Operating System",

            "Networking",

            "JavaScript",

            "React",

            "Node.js"

        ],

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

const Problem = mongoose.model("Problem", ProblemSchema)

module.exports = Problem
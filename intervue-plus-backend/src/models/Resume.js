const mongoose = require("mongoose")

const resumeSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    name: {
        type: String
    },

    email: {
        type: String
    },

    skills: [
        {
            type: String
        }
    ],

    projects: [
        {
            name: String,
            description: String,
            technologies: [String]
        }
    ],

    experience: [
        {
            company: String,
            role: String,
            duration: String,
            description: String
        }
    ],

    certifications: [
        {
            type: String
        }
    ],

    achievements: [
        {
            type: String
        }
    ],

    resumeUrl: {
        type: String
    }

}, { timestamps: true })

module.exports = mongoose.model("Resume", resumeSchema)
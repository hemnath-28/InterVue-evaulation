const mongoose = require("mongoose")

const resumeSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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

    experience: [
        {
            company: String,
            role: String,
            duration: String,
            description: String
        }
    ],

    education: [
        {
            institution: String,
            degree: String,
            field: String,
            year: String
        }
    ],

    projects: [
        {
            name: String,
            description: String,
            technologies: [String]
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
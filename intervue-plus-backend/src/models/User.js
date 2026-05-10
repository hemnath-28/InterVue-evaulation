const mongoose = require("mongoose")

const UserSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ["Admin", "User"],
        default: "User"
    },
    profilePic: {
    type: String
},

cloudinary_id: {
    type: String
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

            "AI Engineer",

            "DevOps Engineer",

            "Data Engineer",

            "Mobile App Developer"

        ]
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

        default: "Fresher"
    }

}, {
    timestamps: true
})

const User = mongoose.model("User", UserSchema)

module.exports = User
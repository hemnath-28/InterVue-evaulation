const mongoose = require("mongoose")

// User Schema [provider,googleid,githubid,resume,role,profile]
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
        type: String
    },

    provider: {
        type: String,
        enum: ["local", "google", "github"],
        default: "local"
    },

    googleId: {
        type: String
    },

    githubId: {
        type: String
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

    resumes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Resume'
        }
    ]
}, {
    timestamps: true
})

const User = mongoose.model("User", UserSchema)

module.exports = User
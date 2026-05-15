const User = require("../models/User");
const bcrypt = require("bcryptjs");
const InterviewSession = require("../models/InterviewSession");

// Register User
const registerUser = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields required" });
        }

        const existinguser = await User.findOne({ email });
        if (existinguser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedpassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedpassword,
            provider: 'local'
        });

        // Log the user in after registration and redirect to Profile page
        req.login(user, (err) => {
            if (err) return next(err);
            res.redirect("/Profile.html");
        });

    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
}

// Profile Route (Protected)
const getProfile = async (req, res) => {
    // Populate resumes before sending
    if (req.user && typeof req.user.populate === 'function') {
        await req.user.populate('resumes');
    }

    // Fetch the user's past interview sessions
    const sessions = await InterviewSession.find({ user: req.user._id })
        .select('targetRole experienceLevel status overallScore createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

    // Convert Mongoose document to plain object if needed, then exclude password
    const userObj = req.user && req.user.toObject ? req.user.toObject() : req.user;
    const { password, ...sanitizedUser } = userObj || {};

    res.status(200).json({
        message: "Welcome to your profile",
        user: sanitizedUser,
        sessions
    });
}

module.exports = {
    registerUser,
    getProfile
}

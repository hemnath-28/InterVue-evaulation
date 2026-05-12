const User = require("../models/User");
const bcrypt = require("bcryptjs");

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

        // Log the user in after registration to create a session
        req.login(user, (err) => {
            if (err) return next(err);
            res.redirect("/api/auth/profile");
        });

    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
}

// Profile Route (Protected)
const getProfile = async (req, res) => {
    res.status(200).json({
        message: "Welcome to your profile",
        user: req.user
    });
}

module.exports = {
    registerUser,
    getProfile
}

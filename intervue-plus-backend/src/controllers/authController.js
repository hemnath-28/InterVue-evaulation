const User = require("./models/User")
const bcrypt = require("bcrypt")
const gentoken = require("./utils/generateToken")


// Register User
const registerUser = async (req, res) => {

    try {

        const { name, email, password } = req.body

        // Check Empty Fields
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields required"
            })
        }

        // Check Existing User
        const existinguser = await User.findOne({ email })

        if (existinguser) {
            return res.status(400).json({
                message: "User already exists"
            })
        }

        // Generate Salt
        const salt = await bcrypt.genSalt(10)

        // Hash Password
        const hashedpassword = await bcrypt.hash(password, salt)

        // Create User
        const user = await User.create({
            name,
            email,
            password: hashedpassword
        })

        // Generate Token
        const token = gentoken(user._id, user.name)

        res.status(201).json({

            message: "User registered successfully",

            token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        })

    } catch (err) {

        res.status(500).json({
            message: "Server Error"
        })
    }
}


// Login User
const loginUser = async (req, res) => {

    try {

        const { email, password } = req.body

        // Find User
        const loguser = await User.findOne({ email })

        if (!loguser) {
            return res.status(400).json({
                message: "Invalid credentials"
            })
        }

        // Compare Password
        const checkpassmatch = await bcrypt.compare(
            password,
            loguser.password
        )

        if (!checkpassmatch) {
            return res.status(400).json({
                message: "Invalid credentials"
            })
        }

        // Generate Token
        const token = gentoken(loguser._id, loguser.name)

        res.status(200).json({

            message: "Login successful",

            token,

            user: {
                id: loguser._id,
                name: loguser.name,
                email: loguser.email,
                role: loguser.role
            }
        })

    } catch (err) {

        res.status(500).json({
            message: "Server Error"
        })
    }
}
const getProfile = async (req, res) => {

    res.status(200).json({

        message: "Profile fetched",

        user: req.user

    })
}

module.exports = {
    registerUser,
    loginUser,getProfile
}
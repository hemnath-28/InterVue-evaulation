const Submission = require("../models/Submission")

// ======================================
// CREATE SUBMISSION
// ======================================

const createSubmission = async (req, res) => {

    try {

        const {

            problem,

            interviewSession,

            language,

            code

        } = req.body

        // CREATE SUBMISSION

        const submission = await Submission.create({

            user: req.user._id,

            problem,

            interviewSession,

            language,

            code,

            // TEMPORARY FAKE RESULT

            status: "Accepted",

            output: "All test cases passed",

            score: 80

        })

        res.status(201).json({

            message: "Submission successful",

            submission

        })

    } catch (error) {

        res.status(500).json({
            message: "Server Error"
        })
    }
}

// ======================================
// GET SINGLE SUBMISSION
// ======================================

const getSubmissionById = async (req, res) => {

    try {

        const submission = await Submission.findById(
            req.params.id
        )

        .populate("user", "name email")

        .populate("problem", "title difficulty")

        .populate("interviewSession")

        if (!submission) {

            return res.status(404).json({
                message: "Submission not found"
            })
        }

        res.status(200).json(submission)

    } catch (error) {

        res.status(500).json({
            message: "Server Error"
        })
    }
}

// ======================================
// GET USER SUBMISSIONS
// ======================================

const getUserSubmissions = async (req, res) => {

    try {

        const submissions = await Submission.find({

            user: req.params.id

        })

        .populate("problem", "title difficulty")

        .sort({ createdAt: -1 })

        res.status(200).json(submissions)

    } catch (error) {

        res.status(500).json({
            message: "Server Error"
        })
    }
}

module.exports = {

    createSubmission,

    getSubmissionById,

    getUserSubmissions
}
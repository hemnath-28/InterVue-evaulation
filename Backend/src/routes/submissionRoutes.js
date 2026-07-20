const express = require("express")

const router = express.Router()

const { jwtAuth: protect } = require("../middleware/Authmiddleware")

const {

    createSubmission,

    getSubmissionById,

    getUserSubmissions

} = require("../controllers/submissionController")

// CREATE SUBMISSION

router.post(
    "/",
    protect,
    createSubmission
)

// GET SINGLE SUBMISSION

router.get(
    "/:id",
    protect,
    getSubmissionById
)

// GET USER SUBMISSIONS

router.get(
    "/user/:id",
    protect,
    getUserSubmissions
)

module.exports = router
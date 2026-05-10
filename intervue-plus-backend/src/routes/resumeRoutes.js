const express = require("express")

const router = express.Router()

const upload = require("../middleware/upload")

const {
    uploadResume
} = require("../controllers/resumeController")

const protect = require("../middleware/authMiddleware")

router.post(

    "/upload",

    protect,

    upload.single("resume"),

    uploadResume
)

module.exports = router
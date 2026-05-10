const express = require("express")
const multer = require("multer")

const router = express.Router()

const upload = multer({ storage: multer.memoryStorage() })

const {
    uploadResume
} = require("../controllers/resumeControleer")

router.post(

    "/upload",

    upload.single("resume"),

    uploadResume
)

module.exports = router

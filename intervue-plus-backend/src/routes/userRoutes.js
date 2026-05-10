const express = require("express")
const router = express.Router()

const upload = require("../middleware/upload")

router.post(
    "/upload",
    upload.single("image"),
    async (req, res) => {

        try {

            res.status(200).json({

                message: "Image uploaded",

                image: req.file.path,

                public_id: req.file.filename
            })

        } catch (err) {

            res.status(500).json({
                message: "Upload failed"
            })
        }
    }
)

module.exports = router
const axios = require("axios")
const FormData = require("form-data")

const Resume = require("../models/Resume")

const uploadResume = async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                message: "No resume uploaded"
            })
        }

        // CREATE FORM DATA

        const formData = new FormData()

        formData.append(
            "file",
            req.file.buffer,
            req.file.originalname
        )

        // SEND TO AFFINDA

        const response = await axios.post(

            "https://api.affinda.com/v3/documents",

            formData,

            {
                headers: {

                    ...formData.getHeaders(),

                    Authorization:
                        `Bearer ${process.env.AFFINDA_API_KEY}`
                }
            }
        )

        // AFFINDA DATA

        const data = response.data.data

        // EXTRACT SKILLS

        const skills = data.skills
            ? data.skills.map(skill => skill.name)
            : []

        // EXTRACT PROJECTS

        const projects = data.projects
            ? data.projects.map(project => ({
                name: project.name,
                description: project.description
            }))
            : []

        // EXTRACT EXPERIENCE

        const experience = data.work_experience
            ? data.work_experience.map(exp => ({
                company: exp.organization,
                role: exp.job_title,
                duration: exp.dates,
                description: exp.description
            }))
            : []

        // SAVE TO DATABASE

        const resume = await Resume.create({

            user: req.user._id,

            name: data.name?.raw || "",

            email: data.emails?.[0] || "",

            skills,

            projects,

            experience,

            certifications: [],

            achievements: []
        })

        res.status(201).json({

            message: "Resume uploaded successfully",

            resume
        })

    } catch (err) {

        console.log(err.response?.data || err.message)

        res.status(500).json({
            message: "Resume upload failed"
        })
    }
}

module.exports = {
    uploadResume
}
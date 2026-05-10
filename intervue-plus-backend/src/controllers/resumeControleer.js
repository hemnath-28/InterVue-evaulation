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

        if (!process.env.AFFINDA_WORKSPACE) {
            return res.status(500).json({
                message: "AFFINDA_WORKSPACE is missing"
            })
        }

        if (!process.env.AFFINDA_DOCUMENT_TYPE) {
            return res.status(500).json({
                message: "AFFINDA_DOCUMENT_TYPE is missing"
            })
        }

        // CREATE FORM DATA

        const formData = new FormData()

        formData.append(
            "file",
            req.file.buffer,
            req.file.originalname
        )

        formData.append(
            "workspace",
            process.env.AFFINDA_WORKSPACE
        )

        formData.append(
            "documentType",
            process.env.AFFINDA_DOCUMENT_TYPE
        )

        formData.append("wait", "true")

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
// LOG full response
        console.log(
            JSON.stringify(response.data, null, 2)
        )

        // AFFINDA DATA

        const data = response.data.data || {}
        const meta = response.data.meta || {}

        if (Object.keys(data).length === 0) {
            return res.status(422).json({
                message: "Affinda uploaded the file but returned no parsed resume data",
                document: {
                    identifier: meta.identifier,
                    reviewUrl: meta.reviewUrl,
                    workspace: meta.workspace,
                    documentType: meta.documentType,
                    extractor: response.data.extractor
                }
            })
        }

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

            name: data.name?.raw || "",

            email: data.emails?.[0] || "",

            skills,

            projects,

            experience,

            certifications: [],

            achievements: [],

            resumeUrl: meta.file || meta.pdf || ""
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

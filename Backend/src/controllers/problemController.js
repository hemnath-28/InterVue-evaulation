const Problem = require("../models/Problem")
const { selectProblemForRole } = require("../services/problemSelectorService")

// ======================================
// CREATE PROBLEM
// ======================================

const createProblem = async (req, res) => {

    try {

        const problem = await Problem.create(req.body)

        res.status(201).json({

            message: "Problem created successfully",

            problem

        })

    } catch (error) {

        res.status(500).json({
            message: "Server Error"
        })
    }
}

// ======================================
// GET ALL PROBLEMS
// ======================================

const getAllProblems = async (req, res) => {

    try {

        const problems = await Problem.find()

        res.status(200).json(problems)

    } catch (error) {

        res.status(500).json({
            message: "Server Error"
        })
    }
}

// ======================================
// GET SINGLE PROBLEM
// ======================================

const getProblemById = async (req, res) => {

    try {

        const problem = await Problem.findById(req.params.id)

        if (!problem) {

            return res.status(404).json({
                message: "Problem not found"
            })
        }

        res.status(200).json(problem)

    } catch (error) {

        res.status(500).json({
            message: "Server Error"
        })
    }
}

// ======================================
// UPDATE PROBLEM
// ======================================

const updateProblem = async (req, res) => {

    try {

        const updatedProblem = await Problem.findByIdAndUpdate(

            req.params.id,

            req.body,

            {
                new: true
            }

        )

        if (!updatedProblem) {

            return res.status(404).json({
                message: "Problem not found"
            })
        }

        res.status(200).json({

            message: "Problem updated",

            updatedProblem

        })

    } catch (error) {

        res.status(500).json({
            message: "Server Error"
        })
    }
}

// ======================================
// DELETE PROBLEM
// ======================================

const deleteProblem = async (req, res) => {

    try {

        const deletedProblem = await Problem.findByIdAndDelete(
            req.params.id
        )

        if (!deletedProblem) {

            return res.status(404).json({
                message: "Problem not found"
            })
        }

        res.status(200).json({
            message: "Problem deleted"
        })

    } catch (error) {

        res.status(500).json({
            message: "Server Error"
        })
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/problems/random
// Query params:
//   ?role=Frontend Developer  → AI selects best DSA topic for the role
//   ?tag=Arrays&difficulty=Easy → manual filter (fallback / admin use)
// ─────────────────────────────────────────────────────────────────────────────
const getRandomProblem = async (req, res) => {

    try {
        const { role, difficulty, tag } = req.query

        // ── Role-based AI selection (primary path for CodingRoom) ─────────────
        if (role) {
            console.log(`[ProblemController] Role-based selection for: "${role}"`)
            const problem = await selectProblemForRole(role)

            if (!problem) {
                return res.status(404).json({
                    message: "No problems found in the database. Please seed problems first."
                })
            }

            return res.status(200).json({ problem })
        }

        // ── Manual tag/difficulty filter (fallback) ───────────────────────────
        let matchStage = {}
        if (difficulty) matchStage.difficulty = difficulty
        if (tag)        matchStage.tags = tag

        const problems = await Problem.aggregate([
            { $match: matchStage },
            { $sample: { size: 1 } }
        ])

        if (problems.length === 0) {
            return res.status(404).json({ message: "No problem found" })
        }

        return res.status(200).json({ problem: problems[0] })

    } catch (error) {
        console.error("[ProblemController] getRandomProblem ERROR:", error.message)
        res.status(500).json({ message: "Server Error", error: error.message })
    }
}

module.exports = {

    createProblem,

    getAllProblems,

    getProblemById,

    updateProblem,

    deleteProblem,
    getRandomProblem
}
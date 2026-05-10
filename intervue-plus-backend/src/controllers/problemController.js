const Problem = require("../models/Problem")

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

// Randome problem question for their Roles
const getRandomProblem = async (req, res) => {

    try {

        const { difficulty, tag } = req.query

        let matchStage = {}

        // FILTER BY DIFFICULTY

        if (difficulty) {

            matchStage.difficulty = difficulty
        }

        // FILTER BY TAG

        if (tag) {

            matchStage.tags = tag
        }

        // RANDOM PROBLEM

        const problems = await Problem.aggregate([

            {
                $match: matchStage
            },

            {
                $sample: { size: 1 }
            }

        ])

        if (problems.length === 0) {

            return res.status(404).json({
                message: "No problem found"
            })
        }

        res.status(200).json(problems[0])

    } catch (error) {

        res.status(500).json({
            message: "Server Error"
        })
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
const express=require('express')
const problemroute=express.problemroute()
const {

    createProblem,

    getAllProblems,

    getProblemById,

    updateProblem,

    deleteProblem,
    getRandomProblem

} = require("../controllers/problemController")

problemroute.post("/", createProblem)
problemroute.put("/:id", updateProblem)
problemroute.delete("/:id", deleteProblem)


problemroute.get("/", getAllProblems)

problemroute.get("/random", getRandomProblem)

problemroute.get("/:id", getProblemById)


module.exports = problemroute
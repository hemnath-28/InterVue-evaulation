const express = require('express');
const env = require('dotenv').config();

const path=require('path')
const app = express();
app.use(express.json());


const fullpath=path.join(__dirname,"..","..","frontend","index.html")
// Serve static files from the root directory
const directoryName = path.dirname(fullpath);
app.use(express.static(directoryName));
app.get("/", (req, res) => {
    res.sendFile("index.html", { root: fullpath });
});


// Auth Routes 
const authRoutes=require("./routes/authRoutes")
app.use("/api/auth",authRoutes)

//ProblemRoutes

const problemRoutes=require("./routes/problemRoutes")
app.use("/api/problems",problemRoutes)

// Submission Routes
const submissionRoutes = require(
    "./routes/submissionRoutes"
)

// Profile Routes Cloudinary upload
const userRoutes = require("./routes/userRoutes")
app.use("/api/users", userRoutes)


app.use(
    "/api/submissions",
    submissionRoutes
)


// Resume Routes
const resumeRoutes = require("./routes/resumeRoutes")
app.use("/api/resume", resumeRoutes)




module.exports = app;

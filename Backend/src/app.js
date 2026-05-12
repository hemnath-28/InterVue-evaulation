const express = require('express');
require('dotenv').config();
const path = require('path');
const app = express();
const passport = require('passport');
const session = require('express-session');

// Parse URL-encoded bodies for form submissions
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configure Passport
require('./config/passport')(passport);

app.use(session({
    secret: process.env.secretkey || 'secret',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Serve static frontend files (disable default index.html serving for root)
const frontendPath = path.join(__dirname, "..", "..", "frontend");

// Route to serve our custom login page
app.get("/", (req, res) => {
    res.sendFile(path.join(frontendPath, "login.html"));
});

app.use(express.static(frontendPath, { index: false }));

// Failure route
app.get("/failed", (req, res) => {
    res.send("<h1>Authentication Failed</h1><p>Invalid credentials or error occurred.</p><a href='/'>Try again</a>");
});

// Original Home route
app.get("/home", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

// Auth Routes 
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// Other Routes
const problemRoutes = require("./routes/problemRoutes");
app.use("/api/problems", problemRoutes);

const submissionRoutes = require("./routes/submissionRoutes");
app.use("/api/submissions", submissionRoutes);

const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

const resumeRoutes = require("./routes/resumeRoutes");
app.use("/api/resume", resumeRoutes);

const interviewRoutes = require("./routes/interviewRoutes");
app.use("/api/interviews", interviewRoutes);

const evaluationRoutes = require("./routes/evaluationRoutes");
app.use("/api/interviews", evaluationRoutes);

module.exports = app;

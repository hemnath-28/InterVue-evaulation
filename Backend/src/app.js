const express = require('express');
require('dotenv').config();
const path = require('path');
const cookieParser = require('cookie-parser');
const app = express();
const passport = require('passport');
const session = require('express-session');
const { createProxyMiddleware } = require('http-proxy-middleware');

// ─── PROXY: Forward /api/code/* → Code-Judger microservice (port 4000) ───────
// Must be BEFORE express.json() so the proxy can read the untouched body stream
const CODE_JUDGER_URL = process.env.CODE_JUDGER_URL || 'http://localhost:4000';
app.use(
    '/api/code',
    createProxyMiddleware({
        target: CODE_JUDGER_URL,
        changeOrigin: true,
        on: {
            error: (err, req, res) => {
                console.error('[Proxy] Code-Judger unreachable:', err.message);
                res.status(502).json({
                    message: 'Code-Judger service is unavailable. Please ensure it is running on port 4000.'
                });
            }
        }
    })
);

// Parse URL-encoded bodies for form submissions
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Configure Passport
require('./config/passport')(passport);

app.use(session({
    // ─── FIX: env var is 'secretKey' (capital K) — fall back to a safe default
    secret: process.env.secretKey || process.env.secretkey || 'intervue_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 } // 1 day
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


// ─── FIX: Redirect to login.html with an error flag instead of raw HTML ───
app.get("/failed", (req, res) => {
    res.redirect('/?auth_error=1');
});

// Original Home route
app.get("/home", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

// Auth Routes 
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// Other Routes


const submissionRoutes = require("./routes/submissionRoutes");
app.use("/api/submissions", submissionRoutes);

const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

const resumeRoutes = require("./routes/resumeRoutes");
app.use("/api/resume", resumeRoutes);

const atsRoutes = require("./routes/atsRoutes");
app.use("/api/ats", atsRoutes);

const interviewRoutes = require("./routes/interviewRoutes");
app.use("/api/interviews", interviewRoutes);

// NOTE: evaluationRoutes (old single-answer evaluator) kept on a separate path
// to avoid conflicting with the new interviewRoutes endpoints.
const evaluationRoutes = require("./routes/evaluationRoutes");
app.use("/api/eval", evaluationRoutes);

module.exports = app;

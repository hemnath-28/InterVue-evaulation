const express = require('express');
const passport = require('passport');
const UserRoute = express.Router();
const { registerUser, loginUser, getProfile } = require("../controllers/authController");
const { jwtAuth } = require("../middleware/Authmiddleware");

// =======================
// LOCAL AUTH ROUTES
// =======================

// Register
UserRoute.post("/register", registerUser);

// Login — handles credential checks and cookies redirect
UserRoute.post("/login", loginUser);

// =======================
// OAUTH ROUTES
// =======================

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://intervue-lime.vercel.app';

// Google
UserRoute.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
UserRoute.get("/google/callback", passport.authenticate("google", {
    failureRedirect: `${FRONTEND_URL}/login.html?auth_error=1`
}), (req, res) => {
    const { generateTokens, setAuthCookies } = require("../utils/jwtHelper");
    const tokens = generateTokens(req.user);
    setAuthCookies(res, tokens);
    res.redirect(`${FRONTEND_URL}/Profile.html`);
});

// Github
UserRoute.get("/github", passport.authenticate("github", { scope: ["user:email"] }));
UserRoute.get("/github/callback", passport.authenticate("github", {
    failureRedirect: `${FRONTEND_URL}/login.html?auth_error=1`
}), (req, res) => {
    const { generateTokens, setAuthCookies } = require("../utils/jwtHelper");
    const tokens = generateTokens(req.user);
    setAuthCookies(res, tokens);
    res.redirect(`${FRONTEND_URL}/Profile.html`);
});

// =======================
// USER ROUTES
// =======================

// Profile (Protected)
UserRoute.get("/profile", jwtAuth, getProfile);

// Logout
UserRoute.get("/logout", (req, res, next) => {
    const { clearAuthCookies } = require("../utils/jwtHelper");
    clearAuthCookies(res);
    req.logout((err) => {
        res.redirect(`${FRONTEND_URL}/login.html`);
    });
});

module.exports = UserRoute;

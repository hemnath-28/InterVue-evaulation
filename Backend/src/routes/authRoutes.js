const express = require('express');
const passport = require('passport');
const UserRoute = express.Router();
const { registerUser, getProfile } = require("../controllers/authController");

// Middleware to protect routes
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
};

// =======================
// LOCAL AUTH ROUTES
// =======================

// Register
UserRoute.post("/register", registerUser);

// Login
UserRoute.post("/login", passport.authenticate('local', {
    successRedirect: '/api/auth/profile',
    failureRedirect: '/failed'
}));

// =======================
// OAUTH ROUTES
// =======================

// Google
UserRoute.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
UserRoute.get("/google/callback", passport.authenticate("google", {
    failureRedirect: "/failed"
}), (req, res) => {
    res.redirect("/api/auth/profile");
});

// Github
UserRoute.get("/github", passport.authenticate("github", { scope: ["user:email"] }));
UserRoute.get("/github/callback", passport.authenticate("github", {
    failureRedirect: "/failed"
}), (req, res) => {
    res.redirect("/api/auth/profile");
});

// =======================
// USER ROUTES
// =======================

// Profile (Protected)
UserRoute.get("/profile", ensureAuthenticated, getProfile);

// Logout
UserRoute.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

module.exports = UserRoute;

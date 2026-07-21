const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { generateTokens, setAuthCookies, JWT_SECRET, JWT_REFRESH_SECRET } = require("../utils/jwtHelper");

const jwtAuth = async (req, res, next) => {
    const accessToken = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;

    // Helper to clear cookies and handle failure
    const handleFailure = () => {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        if (req.originalUrl.startsWith("/api") || req.path.startsWith("/api") || req.headers.accept?.includes("application/json")) {
            return res.status(401).json({ message: "Unauthorized. Please log in first." });
        }
        return res.redirect("/?auth_error=1");
    };

    if (accessToken) {
        try {
            const decoded = jwt.verify(accessToken, JWT_SECRET);
            const user = await User.findById(decoded.id);
            if (user) {
                req.user = user;
                // Add req.isAuthenticated helper for compatibility with Passport-based endpoints
                req.isAuthenticated = () => true;
                return next();
            }
        } catch (err) {
            console.log("[JWT Middleware] Access token verification failed, trying refresh token...");
        }
    }

    // Attempt to use refresh token if access token is invalid or missing
    if (refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
            const user = await User.findById(decoded.id);
            if (user) {
                console.log("[JWT Middleware] Rotating tokens using refresh token...");
                const tokens = generateTokens(user);
                setAuthCookies(res, tokens);
                req.user = user;
                req.isAuthenticated = () => true;
                return next();
            }
        } catch (err) {
            console.error("[JWT Middleware] Refresh token verification failed:", err.message);
        }
    }

    // Passport compatibility: if Passport session exists (e.g. during transition or OAuth)
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }

    return handleFailure();
};

module.exports = { jwtAuth };

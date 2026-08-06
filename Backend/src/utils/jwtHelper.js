const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "jwtsecretintervue";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refreshsecret";

const generateTokens = (user) => {
    const payload = { id: user._id, email: user.email };
    
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });
    
    return { accessToken, refreshToken };
};

const setAuthCookies = (res, tokens) => {
    const isProd = process.env.NODE_ENV === "production";
    
    // Access Token Cookie (15 mins)
    res.cookie("accessToken", tokens.accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        maxAge: 15 * 60 * 1000 // 15 minutes
    });

    // Refresh Token Cookie (7 days)
    res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
};

const clearAuthCookies = (res) => {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
};

module.exports = {
    generateTokens,
    setAuthCookies,
    clearAuthCookies,
    JWT_SECRET,
    JWT_REFRESH_SECRET
};

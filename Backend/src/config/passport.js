const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GithubStrategy = require('passport-github2').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');

module.exports = function(passport) {
    // 1. Local Strategy
    passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
        try {
            // Find user by email
            const user = await User.findOne({ email });
            if (!user) {
                return done(null, false, { message: 'Invalid credentials' });
            }
            
            // Ensure they are a local user with a password
            if (user.provider !== 'local' || !user.password) {
                return done(null, false, { message: 'Please login using your OAuth provider.' });
            }
            
            // Compare passwords with bcrypt hashing
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return done(null, false, { message: 'Invalid credentials' });
            }
            
            // Success returning user Profile
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }));

    //  Google OAuth Strategy
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL    
    }, async function(accessToken, refreshToken, profile, done) {
        try {
            // Check if user exists by already exists by that email
            let user = await User.findOne({ email: profile.emails[0].value });
            if (user) {
                // If the user exists,log them in 
                return done(null, user);
            } else {
                // Create a new user if it doesnt exist
                user = await User.create({
                    name: profile.displayName || "Google User",
                    email: profile.emails[0].value,
                    provider: 'google',
                    googleId: profile.id,
                    profilePic: profile.photos ? profile.photos[0].value : ""
                });
                return done(null, user);
            }
        } catch (error) {
            return done(error, null);
        }
    }));

    // 3. GitHub OAuth Strategy
    passport.use(new GithubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL    
    }, async function(accessToken, refreshToken, profile, done) {
        try {
            // GitHub might not return email if private, but 'user:email' scope tries.
            // Provide a fallback email if it doesn't exist.
            const githubId = profile.id;

            console.log("passport Github return json",profile)
            // Check if user exists by githubId
            let user = await User.findOne({ githubId: githubId });
            if (user) {
                return done(null, user);
            } else {
                // Create a new user
                user = await User.create({
                    name: profile.displayName || profile.username,
                    email: email,
                    provider: 'github',
                    githubId: profile.id,
                    profilePic: (profile.photos && profile.photos.length > 0) ? profile.photos[0].value : ""
                });
                return done(null, user);
            }
        } catch (error) {
            return done(error, null);
        }
    }));

    // 4. Session Serialization
    passport.serializeUser((user, done) => done(null, user._id));

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });
};

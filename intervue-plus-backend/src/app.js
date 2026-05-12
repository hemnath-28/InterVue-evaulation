const express = require('express');
require('dotenv').config();
const path=require('path')
const app = express();
app.use(express.json());
const passport=require('passport')
const session=require('express-session')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GithubStrategy = require('passport-github2').Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL    
}, function(accessToken, refreshToken, profile, done) {
    console.log(profile)
    return done(null, profile);
}));

passport.use(new GithubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL    
}, function(accessToken, refreshToken, profile, done) {
    console.log(profile)
    return done(null, profile);
}));

app.use(session({
    secret: process.env.secretkey || 'secret',
    resave: false,
    saveUninitialized: false
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

app.use(passport.initialize());
app.use(passport.session());


app.get("/",(req,res)=>{
    res.send(`<h1>Login with Google</h1>
        <a href="/api/auth/google">
        <button>Login with Google</button>
        <h1>Login with Github
        </a><a href="/api/auth/github">
        <button>Login with Github</button>
    </a>`)
})

app.get("/api/auth/google",passport.authenticate("google",{
    scope:["profile","email"]
}))

app.get("/api/auth/github",passport.authenticate("github",{
    scope:["user:email"]
}))

app.get("/api/auth/github/callback", passport.authenticate("github", {
    failureRedirect: "/"
}), async (req, res) => {
    res.redirect("/home");
});

app.get("/api/auth/google/callback", passport.authenticate("google", {
    failureRedirect: "/"
}), async (req, res) => {
    res.redirect("/home");
});

app.get("/logout",(req,res)=>{
    req.logout(()=>{
 req.redirect("/")
    });
   
});





const fullpath=path.join(__dirname,"..","..","frontend","index.html")
// Serve static files from the root directory
const directoryName = path.dirname(fullpath);
app.use(express.static(directoryName));
app.get("/home", (req, res) => {
    res.sendFile(fullpath);
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

// Interview Routes
const interviewRoutes = require("./routes/interviewRoutes")
app.use("/api/interviews", interviewRoutes)

// Evaluation Routes
const evaluationRoutes = require("./routes/evaluationRoutes")
app.use("/api/interviews", evaluationRoutes)




module.exports = app;

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

const proRoutes=require("./routes/problemRoutes")
app.use("/api/problems",problemRoutes)







module.exports = app;
const express = require('express');
const env = require('dotenv').config();
const fs=require('fs')
const path=require('path')

const app = express();

// Auth Routes 
const authRoutes=require("./routes/authRoutes")
app.use("/api/auth",authRoutes)

app.use(express.json());
const fullpath=path.join(__dirname,"..","..","frontend","index.html")
// Serve static files from the root directory
const directoryName = path.dirname(fullpath);
app.use(express.static(directoryName));
app.get("/", (req, res) => {
    res.sendFile("index.html", { root: fullpath });
});

module.exports = app;
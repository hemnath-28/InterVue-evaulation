const path = require("path")

require("dotenv").config({ path: path.join(__dirname, "..", ".env") })

const app = require("./app")
const connectDB = require("./db/connectdb")

const PORT = process.env.PORT || 3000

const http = require("http")
const { initSocket } = require("./config/socket")

connectDB()

// Create HTTP server wrapping the Express app
const server = http.createServer(app)

// Initialize Socket.IO
initSocket(server)

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})

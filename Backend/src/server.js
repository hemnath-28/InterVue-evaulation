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

// Handle port-in-use error gracefully
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} is already in use.`)
        console.error(`   Run this to free it: Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force`)
        process.exit(1)
    } else {
        throw err
    }
})

const mongoose = require('mongoose')
const path = require('path')

require('dotenv').config({ path: "../.env" })

// Connection to Database and exporting it
const connection = async () => {
    try {
        const mongoUrl = process.env.MONGO_URI

        if (!mongoUrl) {
            throw new Error('MONGO_URI is not defined')
        }

        const dbconn = await mongoose.connect(mongoUrl)
        console.log(`MongoDB Connected: ${dbconn.connection.host}`)
    }
    catch (err) {
        console.error('Database error unable to connect:', err.message)
        process.exit(1)
    }
}

module.exports = connection

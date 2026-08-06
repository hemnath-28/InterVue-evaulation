const { Server } = require("socket.io");
const interviewSocket = require("../sockets/interviewSocket");

let io;

const initSocket = (httpServer) => {
    const FRONTEND_URL = process.env.FRONTEND_URL || 'https://intervue-lime.vercel.app';

    io = new Server(httpServer, {
        cors: {
            origin: [
                FRONTEND_URL,
                'http://localhost:3000',
                'http://localhost:5173',
                'http://127.0.0.1:3000'
            ],
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    console.log("[Socket.io] Initialized.");

    // Define namespaces or just use the root
    const interviewNamespace = io.of('/interview');

    interviewNamespace.on("connection", (socket) => {
        console.log(`[Socket.io] Client connected: ${socket.id}`);
        
        // Pass the socket to our dedicated handler
        interviewSocket(socket);

        socket.on("disconnect", () => {
            console.log(`[Socket.io] Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIo = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

module.exports = {
    initSocket,
    getIo
};

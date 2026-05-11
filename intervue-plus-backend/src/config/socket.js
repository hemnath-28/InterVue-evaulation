const { Server } = require("socket.io");
const interviewSocket = require("../sockets/interviewSocket");

let io;

const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: "*", // Adjust this to match your frontend URL in production
            methods: ["GET", "POST"]
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

const WebSocket = require("ws");
const { setupAudioStream } = require("../services/audioStreamService");
const { textToSpeech } = require("../services/deepgramService");

/**
 * Handles all websocket events for an interview session.
 * Uses raw WebSocket to Deepgram — no SDK dependency.
 * @param {Object} socket - The active Socket.IO client
 */
const interviewSocket = (socket) => {
    let deepgramWs = null; // raw WebSocket to Deepgram
    let isActive = false;

    // CLIENT → interview:start
    // Opens the Deepgram STT WebSocket and starts listening
    socket.on("interview:start", (data) => {
        console.log(`[InterviewSocket] Interview started for socket ${socket.id}`, data);
        isActive = true;

        // Open Deepgram STT stream (synchronous setup, async connection)
        deepgramWs = setupAudioStream(socket);

        if (!deepgramWs) {
            socket.emit("interview:error", { message: "Failed to initialize Speech-to-Text. Check API key." });
        }
    });

    // CLIENT → candidate:audio
    // Receives raw audio binary chunks from the frontend microphone
    socket.on("candidate:audio", (audioChunk) => {
        if (!isActive || !deepgramWs) return;

        // Only send when WebSocket is fully open (readyState 1 = OPEN)
        if (deepgramWs.readyState === WebSocket.OPEN) {
            deepgramWs.send(audioChunk);
        }
    });

    // CLIENT → question:request
    // Converts question text to speech using Deepgram Aura TTS
    socket.on("question:request", async (data) => {
        const { text } = data;

        if (!text) {
            return socket.emit("interview:error", { message: "Text is required for question:request." });
        }

        try {
            console.log(`[InterviewSocket] TTS request: "${text}"`);
            const audioBuffer = await textToSpeech(text);
            socket.emit("question:audio", { audio: audioBuffer, text });
        } catch (error) {
            console.error("[InterviewSocket] TTS Error:", error.message);
            socket.emit("interview:error", { message: "Failed to generate AI voice." });
        }
    });

    // CLIENT → disconnect
    // Clean up Deepgram WebSocket when the client leaves
    socket.on("disconnect", () => {
        isActive = false;

        if (deepgramWs) {
            console.log(`[InterviewSocket] Closing Deepgram stream for ${socket.id}`);
            try {
                deepgramWs.close();
            } catch (e) {
                // Ignore cleanup errors
            }
            deepgramWs = null;
        }
    });
};

module.exports = interviewSocket;

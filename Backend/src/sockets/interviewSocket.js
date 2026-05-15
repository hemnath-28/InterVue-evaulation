const WebSocket = require("ws");
const { setupAudioStream } = require("../services/audioStreamService");
const { textToSpeech } = require("../services/deepgramService");

/**
 * Handles all websocket events for an interview session.
 * Uses raw WebSocket to Deepgram — no SDK dependency.
 * @param {Object} socket - The active Socket.IO client
 */
const interviewSocket = (socket) => {
    let deepgramWs = null;
    let isActive = false;

    /**
     * Safely close the existing Deepgram WebSocket connection.
     */
    function closeDeepgramStream() {
        if (deepgramWs) {
            try {
                if (deepgramWs.readyState === WebSocket.OPEN || deepgramWs.readyState === WebSocket.CONNECTING) {
                    deepgramWs.close();
                }
            } catch (e) {
                // Ignore cleanup errors
            }
            deepgramWs = null;
        }
    }

    /**
     * Open a fresh Deepgram STT connection for the current question.
     */
    function openDeepgramStream() {
        closeDeepgramStream(); // always close any stale one first
        deepgramWs = setupAudioStream(socket);
        if (!deepgramWs) {
            socket.emit("interview:error", { message: "Failed to initialize Speech-to-Text. Check API key." });
        }
        return deepgramWs;
    }

    // CLIENT → interview:start
    // Called once at the very beginning of the session
    socket.on("interview:start", (data) => {
        console.log(`[InterviewSocket] Session started for socket ${socket.id}`);
        isActive = true;
        // Open the first Deepgram stream immediately so it's ready
        openDeepgramStream();
    });

    // CLIENT → recording:start
    // Called each time the user presses "Start Speaking" for a new question.
    // We reopen a fresh Deepgram connection to ensure a clean stream.
    socket.on("recording:start", () => {
        if (!isActive) return;
        console.log(`[InterviewSocket] New recording started — reopening Deepgram stream for ${socket.id}`);
        openDeepgramStream();
        socket.emit("recording:ready"); // tell client the stream is ready
    });

    // CLIENT → recording:stop
    // Called when the user stops speaking. We finalize the stream.
    socket.on("recording:stop", () => {
        if (!deepgramWs) return;
        console.log(`[InterviewSocket] Recording stopped — finalizing Deepgram stream for ${socket.id}`);
        try {
            if (deepgramWs.readyState === WebSocket.OPEN) {
                // Send CloseStream to flush any remaining audio
                deepgramWs.send(JSON.stringify({ type: "CloseStream" }));
            }
        } catch (e) {
            // Ignore
        }
    });

    // CLIENT → candidate:audio
    // Receives raw audio binary chunks from the frontend microphone
    socket.on("candidate:audio", (audioChunk) => {
        if (!isActive || !deepgramWs) return;

        // Only send when WebSocket is fully open (readyState 1 = OPEN)
        if (deepgramWs.readyState === WebSocket.OPEN) {
            deepgramWs.send(audioChunk);
        } else {
            console.warn(`[InterviewSocket] Audio chunk dropped — Deepgram not OPEN (state: ${deepgramWs.readyState})`);
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
            console.log(`[InterviewSocket] TTS request: "${text.substring(0, 60)}..."`);
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
        console.log(`[InterviewSocket] Cleaning up for disconnected socket ${socket.id}`);
        closeDeepgramStream();
    });
};

module.exports = interviewSocket;

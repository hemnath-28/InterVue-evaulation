const WebSocket = require("ws");

// Deepgram STT WebSocket URL with query params
const DEEPGRAM_STT_URL =
    "wss://api.deepgram.com/v1/listen" +
    "?model=nova-2" +
    "&language=en-US" +
    "&smart_format=true" +
    "&interim_results=true" +
    "&endpointing=300";

/**
 * Opens a raw WebSocket to Deepgram STT and wires transcripts to the Socket.IO client.
 * Bypasses the SDK entirely — works regardless of SDK version.
 * @param {Object} socket - The active Socket.IO client
 * @returns {WebSocket} The raw Deepgram WebSocket connection
 */
const setupAudioStream = (socket) => {
    if (!process.env.DEEPGRAM_API_KEY) {
        console.error("[AudioStream] DEEPGRAM_API_KEY not set.");
        return null;
    }

    const ws = new WebSocket(DEEPGRAM_STT_URL, {
        headers: {
            Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`
        }
    });

    ws.on("open", () => {
        console.log(`[AudioStream] Deepgram STT WebSocket OPEN for socket ${socket.id}`);
    });

    ws.on("message", (data) => {
        try {
            const msg = JSON.parse(data.toString());

            // Only handle transcript results
            if (msg.type !== "Results") return;

            const transcript = msg?.channel?.alternatives?.[0]?.transcript;
            if (!transcript) return;

            if (msg.is_final) {
                console.log(`[AudioStream] FINAL: ${transcript}`);
                socket.emit("transcript:final", { text: transcript });
            } else {
                socket.emit("transcript:partial", { text: transcript });
            }
        } catch (e) {
            // Ignore non-JSON messages (keep-alive pings etc.)
        }
    });

    ws.on("error", (err) => {
        console.error(`[AudioStream] Deepgram WS Error for ${socket.id}:`, err.message);
        socket.emit("interview:error", { message: "Speech-to-Text connection error." });
    });

    ws.on("close", (code, reason) => {
        console.log(`[AudioStream] Deepgram STT closed for ${socket.id} — code ${code}`);
    });

    return ws;
};

module.exports = { setupAudioStream };

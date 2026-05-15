const WebSocket = require("ws");

// Deepgram STT WebSocket URL
// encoding=webm-opus MUST match what MediaRecorder sends (browser default is webm/opus)
// sample_rate=48000 is the standard for browser microphone audio
const DEEPGRAM_STT_URL =
    "wss://api.deepgram.com/v1/listen" +
    "?model=nova-2" +
    "&language=en-US" +
    "&encoding=webm-opus" +
    "&sample_rate=48000" +
    "&smart_format=true" +
    "&interim_results=true" +
    "&endpointing=400" +
    "&utterance_end_ms=1500";

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

    // Send keepalive every 8 seconds to prevent Deepgram from timing out on silence
    let keepAliveInterval = null;

    ws.on("open", () => {
        console.log(`[AudioStream] Deepgram STT WebSocket OPEN for socket ${socket.id}`);

        // Keepalive: send a KeepAlive message every 8s
        keepAliveInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "KeepAlive" }));
            }
        }, 8000);
    });

    ws.on("message", (data) => {
        try {
            const msg = JSON.parse(data.toString());

            // Only handle transcript results
            if (msg.type !== "Results") return;

            const transcript = msg?.channel?.alternatives?.[0]?.transcript;
            if (!transcript || transcript.trim() === "") return;

            if (msg.is_final) {
                console.log(`[AudioStream] FINAL transcript: "${transcript}"`);
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
        socket.emit("interview:error", { message: "Speech-to-Text connection error. Please try speaking again." });
    });

    ws.on("close", (code, reason) => {
        clearInterval(keepAliveInterval);
        const reasonStr = reason ? reason.toString() : "no reason given";
        console.log(`[AudioStream] Deepgram STT closed for ${socket.id} — code ${code} (${reasonStr})`);
        // code 1011 = internal server error from Deepgram — usually audio format mismatch
        if (code === 1011) {
            console.error("[AudioStream] Code 1011 = Deepgram internal error. Check audio encoding/format.");
            socket.emit("interview:error", { message: "Speech recognition connection dropped. Please stop and re-record." });
        }
    });

    return ws;
};

module.exports = { setupAudioStream };

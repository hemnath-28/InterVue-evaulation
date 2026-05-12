const axios = require("axios");

/**
 * Converts text to speech using Deepgram Aura TTS via REST API.
 * Bypasses the SDK entirely — works regardless of SDK version.
 * @param {String} text - The text to convert to speech
 * @returns {Buffer} WAV audio buffer
 */
const textToSpeech = async (text) => {
    try {
        if (!process.env.DEEPGRAM_API_KEY) {
            throw new Error("DEEPGRAM_API_KEY is not set in environment.");
        }

        console.log(`[DeepgramService] TTS → "${text.substring(0, 60)}"`);

        const response = await axios.post(
            "https://api.deepgram.com/v1/speak?model=aura-asteria-en&encoding=mp3",
            { text },
            {
                headers: {
                    Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
                    "Content-Type": "application/json"
                },
                responseType: "arraybuffer"
            }
        );

        const buffer = Buffer.from(response.data);
        console.log(`[DeepgramService] TTS success — ${buffer.length} bytes (mp3)`);
        return buffer;

    } catch (error) {
        const msg = error.response
            ? `HTTP ${error.response.status}: ${Buffer.from(error.response.data).toString()}`
            : error.message;
        console.error("[DeepgramService] TTS Error:", msg);
        throw new Error(msg);
    }
};

module.exports = { textToSpeech };

# AI Interview Platform - Phase 1 Implementation Details

This document outlines all the features and systems we have successfully built and integrated into the `intervue-plus-backend` so far.

## 1. AI Interview Question Generation
We built a system to dynamically generate tailored interview questions based on the candidate's resume and target role.
*   **Service**: `src/services/interviewService.js` uses Google's **Gemini 3.1 Flash** API.
*   **Controller**: `src/controllers/interviewController.js` handles requests, fetches structured resume data from MongoDB, and parses the AI response.
*   **Route**: `POST /api/interviews/generate` (`src/routes/interviewRoutes.js`).
*   **Features**: Generates a structured JSON with 5 categories (Introduction, Resume, Technical, Behavioral, Situational) based on experience level and skills.

## 2. AI Interview Answer Evaluation
We built an evaluation system that grades candidate answers in real-time.
*   **Service**: `src/services/evaluationService.js` uses **Groq API (llama-3.3-70b-versatile)** for lightning-fast inference.
*   **Controller**: `src/controllers/evaluationController.js` grades the answer and optionally saves the interaction (question, answer, evaluation, and follow-up question) to the `InterviewSession` MongoDB collection.
*   **Route**: `POST /api/interviews/evaluate` (`src/routes/evaluationRoutes.js`).
*   **Features**: Returns a strict JSON containing `score`, `feedback`, `strengths`, `weaknesses`, and `followUpQuestion`. Updated MongoDB Schema (`InterviewSession.js`) to support broader `targetRole` enums.

## 3. Realtime Speech Pipeline (STT & TTS)
We built a high-performance, bidirectional WebSocket pipeline to handle real-time audio.
*   **Architecture Update**: Wrapped the Express app with Node's native HTTP server in `src/server.js` and initialized **Socket.IO**.
*   **Socket Hub**: `src/config/socket.js` configures the `/interview` namespace.
*   **Event Controller**: `src/sockets/interviewSocket.js` routes incoming microphone chunks and TTS requests.
*   **Speech-To-Text (STT)**: `src/services/audioStreamService.js` opens a raw WebSocket directly to **Deepgram's Live API**, piping audio chunks to receive `transcript:partial` and `transcript:final` events.
*   **Text-To-Speech (TTS)**: `src/services/deepgramService.js` hits Deepgram's **Aura REST API** via Axios to synthesize human-like MP3 audio buffers from text.
*   **Testing Tool**: Created `test-socket.html` to instantly test STT and TTS directly in the browser.

## 4. Environment & Version Control
*   Updated `.gitignore` to correctly ignore `node_modules` and API test files.

# Current Configuration Issues & Workarounds

During development, certain configurations were bypassed or hardcoded to allow for rapid testing without a full frontend integration. Before deploying to production, these files **must** be reconfigured properly.

## 1. Authentication Middleware Bypassed
*   **Files Affected:** `src/routes/interviewRoutes.js`, `src/routes/evaluationRoutes.js`, `src/controllers/interviewController.js`
*   **The Issue:** The `protect` middleware (JWT validation) was temporarily removed from the new routes. Additionally, in `interviewController.js`, we generate a dummy MongoDB `ObjectId` for `userId` so the database doesn't reject the save.
*   **The Fix:** You must put `protect` back into the route definitions, and inside the controllers, replace the dummy ID generation with `req.user._id` (which comes from the JWT payload).

## 2. Insecure CORS Configuration
*   **Files Affected:** `src/config/socket.js`
*   **The Issue:** Socket.IO is currently configured with `cors: { origin: "*" }`, which means any website on the internet can connect to your WebSockets and consume your API credits.
*   **The Fix:** Replace `"*"` with your actual frontend domain (e.g., `["https://intervue-plus.vercel.app", "http://localhost:3000"]`).

## 3. Hardcoded Interview Session ID
*   **Files Affected:** `test-socket.html`, `src/sockets/interviewSocket.js`
*   **The Issue:** The HTML test file sends a hardcoded `interviewId: 'test-123'`. The Socket currently accepts this blindly.
*   **The Fix:** The frontend should pass the real MongoDB `_id` of the `InterviewSession`, and the socket connection should ideally validate it against the database upon connection.

## 4. API Keys Missing Validation
*   **Files Affected:** `.env` (Environment variables)
*   **The Issue:** The platform relies heavily on `GEMINI_API_KEY`, `GROQ_API_KEY`, and `DEEPGRAM_API_KEY`. If any of these are missing from `.env` in production, specific routes will crash.
*   **The Fix:** Ensure all these keys are added to your production environment variables (e.g., Vercel/Render secrets). You may also want to add a startup check in `server.js` that throws an error immediately if these keys are undefined.

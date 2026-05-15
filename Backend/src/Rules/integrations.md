# Pending Integrations & Tasks

This document outlines the remaining work for the Intervue platform.

## 1. Backend: Interview Session & Resume Linkage
- **Model Update**: Add `resume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' }` to the `InterviewSession` schema in `Backend/src/models/InterviewSession.js`.
- **Controller Update**: Modify the session creation logic to accept `resumeId` and fetch the parsed resume data.
- **AI Context**: Update the AI prompting service to include the parsed resume details (skills, projects, experience) in the initial system prompt for the interviewer.

## 2. Frontend: Interview Room Initiation
- **Start Button**: Implement the "Start Interview" button on `Interview.html`.
- **Session Handover**: When starting, the frontend should send the selected `resumeId` to the backend and redirect the user to the actual interview room page.
- **Interview UI**: Build the real-time interview room UI using Tailwind CSS (replacing any remaining "vibe coded" elements).

## 3. Real-time Speech Pipeline
- **Deepgram Integration**: Ensure the Socket.IO + Deepgram pipeline is fully bidirectional (Speech-to-Text and Text-to-Speech).
- **Latency Optimization**: Fine-tune the audio streaming to minimize latency between user response and AI follow-up.

## 4. Evaluation & Reporting
- **Scoring Logic**: Implement the backend logic to calculate scores for Technical Quality, Behavioral Signals, and Speech Heuristics based on the interview transcript.
- **Report Generation**: Create a final report page that displays these metrics and provides specific improvement notes.

## 5. Security & Authentication
- **Route Protection**: Ensure all interview and resume endpoints are protected by the `ensureAuthenticated` middleware.
- **Data Privacy**: Ensure users can only access their own resumes and session history.

---
*Created on 2026-05-13*

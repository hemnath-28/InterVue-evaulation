# Intervue+

A real-time interview preparation and live coding platform built with Node.js, Express, MongoDB, Socket.IO, and Docker.

---

# 🚀 Overview

Intervue+ is a backend-focused full-stack project designed to simulate real technical interview environments.

The platform allows:

- Candidates to solve coding problems
- Interviewers to conduct live coding interviews
- Real-time collaborative coding
- AI-powered interview feedback
- Secure authentication and role-based access

This project focuses heavily on:
- backend architecture
- scalability
- real-time systems
- authentication
- security
- code execution systems

---

# ✨ Features

## 🔐 Authentication & Security

- JWT Authentication
- Refresh Tokens
- Secure Cookies
- Role-Based Access Control
- Password Hashing
- Rate Limiting
- Helmet.js Security
- Environment Variables

---

## 💻 Coding Platform

- Coding Problems CRUD
- Difficulty Levels
- Tags & Categories
- Hidden Test Cases
- Code Submissions
- Execution Results

---

## ⚡ Real-Time Features

- Live Coding Rooms
- Real-Time Collaborative Editor
- Live Chat
- Presence Detection
- Socket.IO Integration

---

## 🤖 AI Features

- AI Interview Feedback
- Resume Analysis
- Interview Question Suggestions

---

## 📊 Recruiter Features

- Candidate Tracking
- Interview Scheduling
- Reports & Analytics

---

# 🛠️ Tech Stack

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- Socket.IO
- Redis
- Docker

---

## Frontend

- React
- Next.js

---

## Tools

- Postman
- GitHub
- Docker Desktop

---

# 📁 Project Structure

```plaintext
src/
│
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── sockets/
├── utils/
├── validators/
├── jobs/
├── db/
│
├── app.js
└── server.js
```

---

# 🔥 Main Modules

| Module | Description |
|---|---|
| Auth | Login/Register/JWT |
| Problems | Coding problems management |
| Submissions | Code execution & results |
| Rooms | Live interview rooms |
| Chat | Real-time messaging |
| AI | AI-based feedback |
| Notifications | Alerts & reminders |

---

# 🧠 Learning Goals

This project is built to learn:

- Backend Architecture
- Authentication Systems
- Real-Time Communication
- Secure API Design
- Docker Sandboxing
- Redis Caching
- WebSocket Systems
- Database Design
- System Design Basics

---

# 🔒 Security Features

- Helmet.js
- Rate Limiting
- Secure Cookies
- Input Validation
- Protected Routes
- Password Hashing
- Environment Variables

---

# ⚙️ Installation

## Clone Repository

```bash
git clone <repo-url>
```

---

## Install Dependencies

```bash
npm install
```

---

## Create Environment Variables

Create a `.env` file:

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

---

## Start Development Server

```bash
npm run dev
```

---

# 📌 Future Improvements

- Dockerized Code Execution
- Video Calling
- Screen Sharing
- Multi-language Code Runner
- Plagiarism Detection
- Advanced Analytics
- Kubernetes Deployment

---

# 📖 API Documentation

API documentation will be added using Swagger/OpenAPI.

---

# 👨‍💻 Author

Built for learning advanced backend engineering concepts.

---

# 📜 License

This project is for educational purposes.


Beyond the specific tools you mentioned, there are several competitive alternatives for both transcription (STT) and text-to-speech (TTS) in 2026. These range from established cloud APIs with recurring free tiers to fully open-source models for unlimited use.

1. Transcription (Speech-to-Text) Alternatives
If you need high-speed transcription similar to Deepgram Nova-2, these platforms offer diverse free options:

OpenAI Whisper: Considered the industry standard for multilingual accuracy.

Free Option: You can run the Whisper model locally for free if you have a GPU, giving you unlimited transcription without any API costs.

Paid API: For those who prefer the API, it costs approximately $0.006 per minute.

Deepgram Nova-3: The successor to the model you listed, optimized for even lower latency and higher scalability.

Free Tier: Offers 200 minutes per month for testing and small projects.

AssemblyAI: A feature-rich alternative that provides more than just text, including summarization and sentiment analysis.

Pricing: Competitive at roughly $0.65 per audio hour.

Otter.ai: Best for live meetings; it includes a free basic version with limited monthly minutes for transcribing Zoom, Teams, or Google Meet calls.

YouTube: A "hidden" free alternative. If you upload a video, YouTube generates automatic captions for free, which can be downloaded as a rough transcript.

2. Text-to-Speech (TTS) Alternatives
While edge-tts is excellent for free, simple narration, these alternatives offer higher emotional range or different free structures:

AnySpeech: Notable in 2026 for its "no strings attached" free tier.

Benefit: Provides unlimited access to basic voices across 100+ languages without requiring a signup or credit card.

ElevenLabs: Remains the leader for high-fidelity, expressive voices.

Free Tier: Includes 10,000 characters per month.

Amazon Polly: Ideal for high-volume users in their first year.

Free Tier: Offers 5 million characters per month for standard voices and 100k characters per month for neural/generative voices during the first 12 months.

TTSMaker: A popular "completely free" web tool for basic voiceovers without any recurring costs.

Fish Audio (S2 Pro): Currently ranked #1 on some quality leaderboards (like TTS-Arena2) for its ultra-realistic performance across 80+ languages.
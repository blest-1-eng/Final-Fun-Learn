# Fun Learn — Powered by NEXORA LABS

An interactive visual learning and math adventure web application for students from **Nursery to 5th Class**, rewritten in **React + TypeScript + Vite + Tailwind CSS** and enhanced with **NYRA AI** adaptive learning features.

## Features

- **Preserved Fun Learn Core (Nursery to 5th Class)**:
  - **Learning Zone**: ABC Adventure, Counting (1–20, 1–50, 1–100), Phonics & Word Building, Easy English Sentences, Visual Addition, Subtraction, Multiplication, Division, Greater & Less (`> <`), Multiplication Tables (2–5 & 2–20), and Hindi Varnamala, Matras, Word Reading & Sentences.
  - **Test & Practice Zone**: Count Stars, Find Number, Visual Fruit Math, Match Game, Missing Letter Game, Hindi Quizzes, Table Quizzes, Division Quiz, Math Story, 2-Digit Addition, Subtraction, Sentence Fill-in-the-Blanks, and Greater & Less Quiz.
  - **Progress & Parent Dashboard**: Per-class test counters (`Tests: X/10`), automatic class level-up eligibility, celebratory Web Audio sound effects & confetti, and saved test history.
- **NEXORA LABS Branding & NYRA AI Companion**:
  - **Student Profiles**: Separate learning history, weak topics, and saved levels per student.
  - **NYRA Adaptive Levels**: Generates personalized learning levels with objectives, simple explanations, guided activities, and practice checks.
  - **NYRA Smart Tests**: Mixed-format adaptive tests (MCQ, True/False, Fill-in-the-blank, Short Answer) with explanations and weak-topic tracking.
  - **Supportive Low-Score Chatbot**: Automatically offers friendly, encouraging help after low scores or repeated mistakes (with configurable thresholds in Parent Dashboard), plus offline saved-practice support.

## Run Locally

```bash
npm install
npm run dev
```

The development server listens on `http://0.0.0.0:3000`.

## Build & Test

```bash
npm run lint
npm run build
npm test
```

## Backend Configuration Notes

- `VITE_NYRA_BACKEND_URL` defaults to `https://backend-render-5u80.onrender.com`.
- Verified live endpoints: `GET /health`, `GET /v1/nyra/quota`, `POST /v1/nyra/chat`, and `POST /v1/nyra/generate` (`NEXORALABS — NYRA Groq Production Proxy`).
- Endpoint paths can optionally be overridden via `.env` (see `.env.example`). No API keys are ever stored in client code.

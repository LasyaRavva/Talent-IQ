<h1 align="center">✨ Full-Stack Interview Platform ✨</h1>

![Demo App](/frontend/public/screenshot-for-readme.png)

✨ Highlights:

- 🧑‍💻 VSCode-Powered Code Editor
- 🔐 Authentication via Clerk
- 🎥 1-on-1 Video Interview Rooms
- 🧭 Dashboard with Live Stats
- 🔊 Mic & Camera Toggle, Screen Sharing & Recording
- 💬 Real-time Chat Messaging
- ⚙️ Secure Code Execution in Isolated Environment
- 🎯 Auto Feedback — Success / Fail based on test cases
- 🎉 Confetti on Success + Notifications on Fail
- 🧩 Practice Problems Page (solo coding mode)
- 🔒 Room Locking — allows only 2 participants
- 🧠 Background Jobs with Inngest (async tasks)
- 🧰 REST API with Node.js & Express
- ⚡ Data Fetching & Caching via TanStack Query
- 🤖 CodeRabbit for PR Analysis & Code Optimization
- 🧑‍💻 Git & GitHub Workflow (branches, PRs, merges)
- 🚀 Deployment on Sevalla (free-tier friendly)

---

## 🧪 .env Setup

### Backend (`/backend`)

```bash
PORT=3000
NODE_ENV=development

DB_URL=your_mongodb_connection_url

INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key

STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret

CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

CLIENT_URL=http://localhost:5173

AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.1:8b
```

### Frontend (`/frontend`)

```bash
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

VITE_API_URL=http://localhost:3000/api

VITE_STREAM_API_KEY=your_stream_api_key
```

## Single-Site Deployment

This repo can be deployed as one website:

- the Express backend serves the built Vite frontend
- the React app loads from the same domain
- API routes stay under `/api/*`

### Production env

Set these values for your host:

```bash
NODE_ENV=production
PORT=3000
CLIENT_URL=https://your-domain.com
DB_URL=your_mongodb_connection_url

CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret

INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key
```

For same-domain deployment, `VITE_API_URL` is optional. If it is omitted during the frontend build, the browser will call the backend on the current site origin automatically.

### Build and start

Run from the repository root:

```bash
npm run build
npm start
```

`npm run build` installs both `backend` and `frontend` dependencies, then builds the frontend into `frontend/dist`. In production, the backend serves that folder directly.

### Deploy target setup

On platforms such as Render, Railway, or a VPS:

- set the project root to this repository root
- use `npm run build` as the build command
- use `npm start` as the start command
- expose the backend port from `PORT`
- configure your domain in Clerk allowed origins and redirect URLs

---

## 🔧 Run the Backend

```bash

cd backend
npm install
npm run dev
```

### Local AI With Ollama

Install Ollama, pull a model, and keep the Ollama server running:

```bash
ollama pull llama3.1:8b
ollama serve
```

With `AI_PROVIDER=ollama`, the AI coach and interview features stream from your local model instead of OpenAI or Gemini.

For voice input in an Ollama-only setup, use Chrome or Edge so browser speech recognition can fill the text box directly. OpenAI is optional and only needed if you want server-side recorded audio transcription.

### AI Video Avatar With Simli

To add a real AI video avatar without changing the human Stream call, configure these backend variables:

```bash
SIMLI_API_KEY=your_simli_api_key
SIMLI_FACE_ID=your_simli_face_id
SIMLI_MAX_SESSION_LENGTH=1800
SIMLI_MAX_IDLE_TIME=300
```

Then install the frontend client dependency:

```bash
cd frontend
npm install
```

The live session AI panel will request a backend-created Simli session token and render the avatar as a separate AI participant tile.

---

## 🔧 Run the Frontend

```
bash
cd frontend
npm install
npm run dev
```

# CampusBot Chatbot

A bilingual campus support chatbot built with a React frontend and a Node/Express backend. This project supports English and Hindi, department-based FAQs, chat logging, fallback query submission, user authentication, and an admin panel.

## Project Structure

- `client/` - React user interface
  - `src/App.js` - Main chat experience, language support, FAQ search, department FAQs, fallback query modal, and chat review UI
  - `src/AuthPage.js` - Login/signup flow
  - `src/WelcomeScreen.js` - Landing screen shown after authentication
  - `src/AdminPortal.js` - Admin dashboard for managing logs, fallback queries, and user roles
- `Server/` - Express backend API and MongoDB integration
  - `Server/index.js` - API server entry point, route registration, MongoDB connection, TTS proxy endpoint
  - `Server/routes/` - API route handlers
    - `authRoutes.js` - authentication, JWT, admin protection
    - `faqRoutes.js` - FAQ search, department question lists, seeding data
    - `feedbackRoutes.js` - chat logs, feedback storage, CSV export
    - `fallbackRoutes.js` - unresolved query submission and admin replies
  - `Server/models/` - Mongoose data models
    - `Faq.js` - FAQ items
    - `User.js` - user accounts and password hashing
    - `ChatLog.js` - stored user/bot conversation logs
    - `FallbackQuery.js` - fallback user support requests
  - `Server/faqs.json` - FAQ content used by the backend
  - `Server/seed.js` - helper to populate FAQs from `faqs.json`

## Features

- Bilingual support: English and Hindi
- FAQ search with keyword matching and translation fallback
- Department-based FAQ quick access
- User login/signup with JWT authentication
- Admin-only endpoints for user management and query handling
- Chat logging and feedback capture
- User fallback query submission for unanswered requests
- Text-to-speech support using a server-side TTS proxy

## Requirements

- Node.js 18+ / npm
- MongoDB running locally or reachable by the backend

## Installation

Install dependencies separately for the frontend and backend.

```bash
cd /workspaces/campus-chatbot/Server
npm install

cd /workspaces/campus-chatbot/client
npm install
```

## Running the Project

### Start MongoDB

Start your MongoDB daemon locally. The backend expects:

- `mongodb://127.0.0.1:27017/campusbot`

### Start the backend

```bash
cd /workspaces/campus-chatbot/Server
npm start
```

This runs the Express server on:

- `http://localhost:5000`

### Start the frontend

```bash
cd /workspaces/campus-chatbot/client
npm start
```

This runs the React app on:

- `http://localhost:3000`

## Seed FAQ Data

Load the FAQ dataset into MongoDB once before using the app.

```bash
cd /workspaces/campus-chatbot/Server
node seed.js
```

Alternatively, the backend exposes a seed endpoint:

```http
GET http://localhost:5000/api/faqs/seed
```

## Environment / Configuration Notes

Currently the project uses hard-coded defaults in `Server/index.js` and `Server/routes/authRoutes.js`:

- MongoDB URL: `mongodb://127.0.0.1:27017/campusbot`
- JWT secret: `campusbot_secret_2026`

If you want environment variable support, add `.env` and modify the server code accordingly.

## Backend API Summary

### Authentication

- `POST /api/auth/signup`
  - Body: `{ name, email, password }`
- `POST /api/auth/login`
  - Body: `{ email, password }`
- `GET /api/auth/me`
  - Requires `Authorization: Bearer <token>`
- `GET /api/auth/users`
  - Admin only
- `PATCH /api/auth/users/:id/role`
  - Admin only, body: `{ role: "user" | "admin" }`

### FAQ Search

- `GET /api/faqs/search?q=...&lang=en|hi`
  - Returns the best matching answer and quick suggestion chips
- `GET /api/faqs/by-department?dept=...&lang=en|hi`
  - Returns department-specific FAQ questions
- `GET /api/faqs/seed`
  - Rebuilds FAQ data from `Server/faqs.json`

### Feedback & Chat Logs

- `POST /api/feedback/log`
  - Body: `{ sessionId, userMsg, botReply, lang, department }`
- `PATCH /api/feedback/:id`
  - Body: `{ feedback, comment }`
- `GET /api/feedback/all`
  - Admin chat log listing
- `GET /api/feedback/csv`
  - Download CSV export of chat logs

### Fallback Query Support

- `POST /api/fallback`
  - Body: `{ userEmail, userName, preferredTime, query, lang, userId }`
- `GET /api/fallback`
  - Admin only, optional query string `status=pending|replied`
- `PATCH /api/fallback/:id/reply`
  - Admin only, body: `{ reply }`
- `GET /api/fallback/my`
  - User-only, returns user-specific fallback queries

### TTS Proxy

- `GET /api/tts?text=...&lang=hi|en`
  - Proxies text-to-speech audio from Google Translate

## Frontend Usage

1. Open the browser at `http://localhost:3000`
2. Sign up or log in
3. Select English or Hindi on the welcome screen
4. Ask questions via chat or choose department FAQ chips
5. If the bot cannot answer, submit a fallback query using the modal
6. Users can view their query responses in `My Submitted Queries`

## Admin Usage

1. Create a user account
2. Promote that user to admin using the admin-only role endpoint or by modifying the DB
3. Log in as admin to access the admin portal
4. Review fallback queries, reply to them, and manage user roles
5. Export chat logs from the admin panel

## Notes

- The frontend stores authentication state in `localStorage` under `campusbot_token`, `campusbot_user`, and `campusbot_sessions`.
- The app currently uses a local development backend at `http://localhost:5000`.
- The chat search engine uses an English FAQ dataset and translates Hindi user queries before matching.

## Helpful Commands

```bash
# Backend
cd /workspaces/campus-chatbot/Server
npm install
npm start
node seed.js

# Frontend
cd /workspaces/campus-chatbot/client
npm install
npm start
```
# CampusBot Chatbot

A bilingual campus support chatbot built with a React frontend and a Node/Express backend. This project supports English and Hindi, department-based FAQs, chat logging, fallback query submission, user authentication, and an admin panel.

## Features

- Bilingual support: English and Hindi
- FAQ search with keyword matching and translation fallback
- Department-based FAQ quick access
- User login/signup with JWT authentication
- Admin-only endpoints for user management and query handling
- Chat logging and feedback capture
- User fallback query submission for unanswered requests
- Text-to-speech support using a server-side TTS proxy

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

## Prerequisites

- Node.js 18 or newer
- npm (Node package manager)
- MongoDB running locally or available remotely
- Modern web browser for the frontend UI

## Installation

### Install backend dependencies

```bash
cd /workspaces/campus-chatbot/Server
npm install
```

### Install frontend dependencies

```bash
cd /workspaces/campus-chatbot/client
npm install
```

## Initialize the Knowledgebase

This application uses a seeded FAQ knowledgebase stored in MongoDB.

### Seed data from the server script

```bash
cd /workspaces/campus-chatbot/Server
node seed.js
```

### Or seed via API endpoint

```http
GET http://localhost:5000/api/faqs/seed
```

Use one of these methods after installing dependencies and before starting the app.

## Running the Project

### Start MongoDB

Start your MongoDB daemon locally or connect to a remote MongoDB instance.

Default expected URI:

- `mongodb://127.0.0.1:27017/campusbot`

### Start the backend

```bash
cd /workspaces/campus-chatbot/Server
npm start
```

The backend runs on:

- `http://localhost:5000`

### Start the frontend

```bash
cd /workspaces/campus-chatbot/client
npm start
```

The frontend runs on:

- `http://localhost:3000`

## Usage Guide

### User Guide

1. Open `http://localhost:3000`.
2. Sign up with name, email, and password or log in if you already have an account.
3. Select Hindi or English as needed.
4. Ask your question in the chat box or choose a department FAQ chip.
5. If the bot cannot answer, submit a fallback query using the modal.
6. View your submitted queries under `My Submitted Queries`.

### Admin Guide

1. Log in with an admin account.
2. Open the admin portal to review fallback queries and chat logs.
3. Reply to fallback requests and update query statuses.
4. Promote users to admin by calling the role update endpoint or editing the DB.
5. Export chat logs to CSV from the admin dashboard.

## Login Flow

1. Navigate to `http://localhost:3000`.
2. Sign up with name, email, and password or log in with existing credentials.
3. The frontend sends credentials to `POST /api/auth/login`.
4. On success, the backend returns a JWT token.
5. The React app stores the token in `localStorage` and shows the authenticated chat interface.
6. Authenticated requests include `Authorization: Bearer <token>` for protected routes.

## Embedding Models

This project does not currently use embedding models or vector search. FAQ matching is powered by keyword matching plus translation fallback for Hindi queries, keeping the app lightweight and easy to run locally.

## Database

The backend uses MongoDB with the following main collections:

- `users` - stores user accounts, hashed passwords, roles, and profile metadata
- `faqs` - stores FAQ questions and answers seeded from `Server/faqs.json`
- `chatlogs` - stores chat history, bot replies, and user feedback
- `fallbackqueries` - stores unresolved user queries and admin responses

Default connection:

- `mongodb://127.0.0.1:27017/campusbot`

## Troubleshooting

### User Troubleshooting

- Login fails: verify email/password and ensure the backend is running.
- Blank page or UI errors: open browser console and check network requests to `http://localhost:5000`.
- FAQs not loading: make sure MongoDB is running and the seed data has been loaded.
- Fallback query submission fails: check that the token is present in `localStorage` and the backend is accepting POST requests.

### Administrator Troubleshooting

- Admin portal access denied: confirm the user role is `admin` in the database or via `/api/auth/users`.
- Cannot reply to fallback queries: ensure the auth token is valid and the request reaches `PATCH /api/fallback/:id/reply`.
- Export CSV issues: confirm the backend is running and the admin user is authenticated.
- User management errors: check server logs for JWT errors and MongoDB connection issues.

## Performance Optimization

- Run the backend and frontend locally on the same machine to reduce latency.
- Use a production frontend build for deployment: `npm run build` in `client/`.
- Keep the FAQ dataset concise to maintain quick search response times.
- Prefer a local MongoDB instance for best performance.

## Development Notes

- The server currently uses hard-coded default values in `Server/index.js` and `Server/routes/authRoutes.js`.
- Recommended improvement: add `.env` configuration for MongoDB URI and JWT secret.
- The frontend stores auth state in `localStorage` keys like `campusbot_token`, `campusbot_user`, and `campusbot_sessions`.
- Admin-only routes are protected by JWT checks and role verification.
- The app uses a proxy TTS endpoint at `GET /api/tts?text=...&lang=hi|en`.

## Dependencies Breakdown

| Package | Version | Purpose |
|---|---|---|
| `bcryptjs` | `^3.0.3` | Secure password hashing for user accounts |
| `cors` | `^2.8.6` | Enables cross-origin requests from the React frontend |
| `express` | `^5.2.1` | HTTP server framework for REST APIs |
| `jsonwebtoken` | `^9.0.3` | JWT token generation and verification |
| `mongoose` | `^9.5.0` | MongoDB object modeling and schema validation |
| `nodemon` | `^3.1.14` | Development dependency for automatic server reload |
| `react` | `^19.2.6` | UI library for building the chat interface |
| `react-dom` | `^19.2.6` | React rendering for browser DOM |
| `react-scripts` | `5.0.1` | Create React App tooling and dev server |
| `web-vitals` | `^2.1.4` | Performance monitoring utilities |
| `@testing-library/dom` | `^10.4.1` | DOM testing utilities |
| `@testing-library/jest-dom` | `^6.9.1` | Jest matchers for DOM assertions |
| `@testing-library/react` | `^16.3.2` | React component testing utilities |
| `@testing-library/user-event` | `^13.5.0` | Simulates user interactions in tests |

## Environment / Configuration Notes

Currently the project uses hard-coded defaults in `Server/index.js` and `Server/routes/authRoutes.js`:

- MongoDB URL: `mongodb://127.0.0.1:27017/campusbot`
- JWT secret: `campusbot_secret_2026`

If you want environment variable support, add a `.env` file and modify the server code accordingly.

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

## Helpful Commands

```bash
# Backend dependency install
cd /workspaces/campus-chatbot/Server
npm install

# Frontend dependency install
cd /workspaces/campus-chatbot/client
npm install

# Seed knowledgebase
cd /workspaces/campus-chatbot/Server
node seed.js

# Start backend
cd /workspaces/campus-chatbot/Server
npm start

# Start frontend
cd /workspaces/campus-chatbot/client
npm start
```

## License

This project is developed for BITS Pilani students.

## Support & Feedback

For feedback or issues, open a GitHub issue in this repository or contact the project maintainer. Ensure the backend is running and tokens are valid before reporting login or admin access problems.

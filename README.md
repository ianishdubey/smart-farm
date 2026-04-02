# Smart Farming Platform

Smart Farming Platform is a full-stack agriculture management app built for local development and deployment. It combines a React dashboard with an Express API and SQLite database to help farmers manage farms, track finances, get crop guidance, and use chatbot-assisted workflows.

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: Node.js, Express
- Database: SQLite
- Auth: JWT-based authentication

## Core Features

- User sign up and sign in
- Farm profile setup and management
- Dashboard modules for:
- Weather insights
- Crop recommendations
- Yield prediction
- Financial analytics (expenses and revenue)
- Market prices
- Disease detection workflow
- Admin panel routes and management APIs
- Integrated farming chatbot

## Project Structure

```text
project/
  src/                # Frontend app (React + TypeScript)
  server/             # Backend API (Express + SQLite)
  supabase/migrations # Initial schema history from earlier setup
```

## Prerequisites

- Node.js 18 or newer
- npm 9 or newer
- VS Code

## Install and Run in VS Code

1. Clone the repository

```bash
git clone https://github.com/arun-19-n/smart-farming-platform.git
```

2. Open the project in VS Code

- Start VS Code
- Go to `File > Open Folder...`
- Select the `project` folder

3. Create environment files

```powershell
Copy-Item .env.example .env
Copy-Item server/.env.example server/.env
```

4. Install frontend dependencies (from `project`)

```bash
npm install
```

5. Install backend dependencies

```bash
cd server
npm install
cd ..
```

6. Run the app in two terminals inside VS Code

Terminal 1 (frontend):

```bash
npm run dev
```

Terminal 2 (backend):

```bash
npm run server:dev
```

7. Open the app

- Frontend: `http://localhost:5173`
- Backend API health: `http://localhost:3001/api/health`

## Useful Scripts

From the root `project` folder:

- `npm run dev` - start Vite frontend
- `npm run build` - build frontend for production
- `npm run preview` - preview production build
- `npm run lint` - run ESLint
- `npm run typecheck` - run TypeScript type checks
- `npm run server` - run backend server
- `npm run server:dev` - run backend with nodemon

From the `project/server` folder:

- `npm start` - start Express server
- `npm run dev` - start Express server with nodemon

## Notes

- The backend creates `server/farm.db` automatically when needed.
- Keep `.env` and `server/.env` private and do not commit them.
- If port 3001 or 5173 is in use, stop the conflicting process or update your env values.
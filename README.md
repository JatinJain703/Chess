# ♟️ Chess CLI (Full Stack Multiplayer Chess)

A real-time multiplayer chess system built with:

* 🧠 Backend (Express + Prisma + PostgreSQL)
* 🔌 WebSocket Server (real-time gameplay)
* 🖥️ CLI Frontend (Ink + React)
* 📦 Published CLI (`chess-cli-jatin`)

---

## 🚀 Features

* ♟️ Real-time multiplayer chess
* 🤖 Play against bot (Stockfish)
* 👥 Create / Join game rooms
* 🔐 Authentication (JWT-based login/signup)
* ⚡ Terminal-based UI (Ink + React)
* 🌐 WebSocket-based communication

---

## 📦 Project Structure (Monorepo)

```
root/
│── backend/        # REST API + Prisma
│── ws/             # WebSocket server
│── Chess-cli/      # CLI frontend (published)
│── package.json
```

---

## ⚙️ Setup (Local Development)

### 1️⃣ Install all dependencies (from root)

```bash
npm install
```

---

## 🧠 Backend Setup

Go to backend:

```bash
cd backend
```

### Create `.env`

```env
DATABASE_URL=your_database_url
JWT_SECRET=your_secret
```

### Run backend

```bash
npm run dev
```

👉 This will:

* generate Prisma client
* start Express server

---

## 🔌 WebSocket Server Setup

Go to ws folder:

```bash
cd ws
```

### Create `.env` (IMPORTANT)

👉 Must match backend:

```env
DATABASE_URL=your_database_url
JWT_SECRET=your_secret
```

### Generate Prisma

```bash
npm run generate
```

### Start WS server

```bash
npm run dev
```

---

## 🖥️ CLI Frontend Setup

Go to CLI:

```bash
cd Chess-cli
```

### ⚠️ Update URLs (IMPORTANT)

#### In `App.tsx`:

```js
const WS_URL = "ws://localhost:PORT";
```

#### In `services/api.ts`:

```js
const BASE_URL = "http://localhost:PORT";
```

---

### Run CLI locally

```bash
npm run dev
```

---

## 🚀 Run via Published CLI (No Setup)

You can also run directly:

```bash
npx chess-cli-jatin
```

OR install globally:

```bash
npm install -g chess-cli-jatin
chess-cli
```

---

## 🎮 How to Use

1. Start CLI
2. Signup / Login
3. Choose:

   * Play Game
   * Play vs Bot
   * Create Game
   * Join Game
4. Enter moves (e.g., `e2 e4`)
5. Play in real-time

---

## 🔐 Environment Variables

| Variable     | Description               |
| ------------ | ------------------------- |
| DATABASE_URL | PostgreSQL connection     |
| JWT_SECRET   | Secret for authentication |

👉 Must be SAME in:

* backend
* ws server

---

## 🧠 Important Notes

* WebSocket URL must match backend environment
* Backend and WS server must run simultaneously
* Prisma must be generated before starting WS server
* CLI requires correct local URLs when running locally

---

## 🏗️ Tech Stack

* Node.js
* Express.js
* Prisma ORM
* PostgreSQL
* WebSockets (`ws`)
* React (Ink CLI)
* Stockfish (bot)

---

## 🚀 Future Improvements

* ♟️ Better board rendering
* 🏆 Leaderboard system
* 💾 Game history
* 🌍 Deployment with low-latency WS (Fly.io)

---

## 👨‍💻 Author

**Jatin Jain**

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!

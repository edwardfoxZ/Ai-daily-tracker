<div align="center">

# ⚡ Chainpace

**A modern, on-chain habit tracker that connects you to people who hold you accountable.**

Build routines, log verified proof of your work, and let AI cross-check your consistency against real clinical and behavioral research — all backed by your own wallet.

[![TypeScript](https://img.shields.io/badge/TypeScript-89.8%25-3178C6?logo=typescript&logoColor=white)](.)
[![Go](https://img.shields.io/badge/Go-9.9%25-00ADD8?logo=go&logoColor=white)](.)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.24-363636?logo=solidity&logoColor=white)](.)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)](.)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](./LICENSE)

</div>

---

## ✨ What is Chainpace?

Chainpace is a habit-tracking web app built around one idea: **habits are easier to keep when someone else can verify them.**

- 🔗 **Wallet-based identity** — sign up with a crypto wallet, or email/phone with an optional wallet link
- 🧠 **AI-backed proof scoring** — your consistency is checked against published clinical & psychology research, not just a checkbox
- 📊 **Real tracking** — daily, weekly, and monthly completion charts, streaks, and a proof score out of 100
- 🏆 **Social accountability** — friends, mentors, leaderboards, and head-to-head competitions
- ⛓️ **On-chain verifiable habits** — habit creation, completions, streaks, and rewards are tracked in a smart contract, not just a database

---

## 🖥️ Preview

| Login & Wallet Connect | Dashboard | Messages / Mentor |
|:---:|:---:|:---:|
| _Wallet, email, or phone sign-in_ | _Streaks, charts, competitions, leaderboard_ | _Chat with friends & research-backed mentor tips_ |

*(Add screenshots or a demo GIF here once you have them — drop them in a `/docs` or `/assets` folder and reference them above.)*

---

## 🏗️ Project structure

This is a monorepo with three independent projects, each deployed separately:

```
Ai-daily-tracker/
├── chainpace-app/         # Frontend — Next.js 14 + TypeScript + Tailwind CSS
├── chainpace-backend/     # Backend — Go + SQLite (auth, sessions, users)
└── chainpace-contracts/   # Smart contracts — Solidity + Hardhat
```

| Layer | Handles |
|---|---|
| **`chainpace-app`** | UI, wallet connection (`useWeb3`), all pages, talks to both the backend and the smart contract |
| **`chainpace-backend`** | Email/phone signup & login, session cookies (JWT), username lookups — deliberately **not** on-chain |
| **`chainpace-contracts`** | Habits, streaks, proof scores, friends, competitions, rewards — all trustlessly verifiable on-chain |

---

## 🧰 Tech stack

**Frontend**
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS with a custom dark/light design system (violet + glow accents)
- `ethers.js` for wallet & contract interaction

**Backend**
- Go (`net/http`, no framework)
- SQLite (`modernc.org/sqlite`, pure Go, no CGO)
- `bcrypt` for password hashing, JWT for sessions

**Smart contracts**
- Solidity `^0.8.24`
- Hardhat (TypeScript project) for compiling, testing, and deploying
- Designed for any EVM chain (tested locally on Ganache/Hardhat network)

---

## 🚀 Getting started

### Prerequisites

- Node.js 18+
- Go 1.22+
- [Ganache](https://trufflesuite.com/ganache/) or Hardhat's built-in local network (for contract testing)
- MetaMask (or another EVM wallet extension)

### 1. Clone the repo

```bash
git clone https://github.com/edwardfoxZ/Ai-daily-tracker.git
cd Ai-daily-tracker
```

### 2. Smart contracts

```bash
cd chainpace-contracts
npm install
npx hardhat test               # run the full test suite
npx hardhat run scripts/deploy.ts --network ganache
```

Copy the deployed contract address — you'll need it in step 4.

### 3. Backend (Go + SQLite)

```bash
cd ../chainpace-backend
go mod tidy
go run .
```

Runs at `http://localhost:8080`. No external database setup required — SQLite creates `chainpace.db` automatically on first run.

Set a real JWT secret before doing anything beyond local testing:
```bash
export JWT_SECRET="a-long-random-string"
```

### 4. Frontend (Next.js)

```bash
cd ../chainpace-app
npm install
cp .env.local.example .env.local
```

Fill in `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to `/login`.

---

## 🔑 Core features

### Authentication
- Wallet-only signup (connect → choose username)
- Email or phone signup (username + password), with an optional wallet link afterward
- Session handled via an httpOnly JWT cookie from the Go backend
- Auto-logout when the connected wallet disconnects or switches accounts

### Dashboard
- Current streak, weekly completion %, AI proof score, and circle rank
- Daily / weekly / monthly tracking chart
- Today's plans & habits with live on-chain completion toggles
- Active competitions vs. friends, friends leaderboard, and rewards feed

### Messages
- Chat with friends who've accepted your request
- Dedicated mentor thread with research-backed tip cards and inline proof cards

### Smart contract (`ChainpaceCore.sol`)
- `createHabit`, `logCompletion`, `deactivateHabit`
- `getCurrentStreak`, `getBestStreak`, `getWeeklyCompletionBps`, `getProofScore`
- `sendFriendRequest` / `acceptFriendRequest` / `getFriends`
- `createCompetition` / `resolveCompetition`
- On-chain points & badge system (`getPoints`, `hasBadge`)

---

## 🗺️ Roadmap

- [ ] iOS & Android apps
- [ ] AI-generated habit insights fed by real ML model (currently rule-based)
- [ ] IPFS-backed proof storage for habit completions
- [ ] Migrate backend to Postgres for production persistence
- [ ] Mainnet / L2 deployment (Base or Polygon)

---

## 🤝 Contributing

This is currently a solo project in active development. Issues and suggestions are welcome — open an issue before submitting a large PR.

## 📄 License

Licensed under [GPL-3.0](./LICENSE).

---

<div align="center">
<sub>Built with Next.js, Go, and Solidity — because your habits deserve more than a checkbox.</sub>
</div>

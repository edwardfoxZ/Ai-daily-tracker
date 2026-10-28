<div align="center">

# Chainpace

On-chain habit tracker with a private coach, friends, and a signed message thread.

Next.js app + Go API + Solidity contract on Sei Testnet.

</div>

## What the project is

Chainpace has three layers. They do different jobs on purpose.

| Folder | Job |
|---|---|
| `chainpace-app` | The website. Pages, wallet UI, charts, coach chat. |
| `chainpace-backend` | Accounts, cookies, messages, Pace memory. SQLite. |
| `chainpace-contracts` | Habits, streaks, friends, competitions, points. The source of truth for on-chain habits. |

On-chain data stays on the contract. The coach and DMs stay off-chain so the AI can remember without writing every sentence to a chain.

## How a request moves

1. Browser opens a Next.js page (`chainpace-app/app/...`).
2. The page uses `useChainpace()` to read the contract through `ethers`.
3. Account stuff (login, DMs, coach) goes to the Go server at `/api/...` with the `chainpace_token` cookie.
4. The Go server checks the JWT, then reads or writes SQLite.

```
Browser
  |-- wallet + contract calls --> Sei Testnet (ChainpaceCore)
  `-- cookie + fetch /api/* --> Go server --> chainpace.db
```

## Run it

```bash
git clone https://github.com/edwardfoxZ/Ai-daily-tracker.git
cd Ai-daily-tracker

# contracts
cd chainpace-contracts && npm install
npx hardhat run scripts/deploy.ts --network seiTestnet

# backend
cd ../chainpace-backend
cp .env.example .env   # then fill secrets
go run .

# frontend
cd ../chainpace-app
cp .env.local.example .env.local
npm install && npm run dev
```

Frontend: `http://localhost:3000`. Backend: `http://localhost:8080`.

### Env

Backend `chainpace-backend/.env`:

```
JWT_SECRET=long-random-string
GROQ_API_KEY=gsk_...
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=llama-3.1-8b-instant
GOOGLE_CLIENT_ID=....apps.googleusercontent.com
```

Frontend `chainpace-app/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourContract
NEXT_PUBLIC_GOOGLE_CLIENT_ID=....apps.googleusercontent.com
```

Use the **same** Google client id in both files. Add `http://localhost:3000` as an authorized JavaScript origin in Google Cloud.

## Login

Three ways in. All end as a JWT in the `chainpace_token` httpOnly cookie (`cookie.go`).

1. **Google** — `GoogleSignIn.tsx` loads Google Identity Services, posts the id token to `POST /api/auth/google`. `google_auth.go` checks the token with Google, creates a user if the email is new, then sets the cookie.
2. **Email / username** — existing signup and login handlers in the backend.
3. **Wallet only** — `WalletConnectButton` calls `web3.connect(walletId)`, then `POST /api/auth/wallet`. That creates a session without Google.

If you are already signed in with Google and then connect a wallet, the button calls `linkWallet()` so the same account gets the address. Chain features need that address. MetaMask opening is not enough; `useWeb3.connect()` must store it.

`SessionSync.tsx` logs a wallet-based session out if the connected address changes or disappears.

Cookie banner: `CookieBanner.tsx` in the root layout. Accept stores a flag so it does not show again.

## Wallet

`WalletPicker.tsx` is a modal (RainbowKit-style list, not the RainbowKit package). It lists MetaMask, Coinbase, browser wallet, Phantom.

`useWeb3.ts` is the real connector. It requests accounts, builds an ethers `BrowserProvider`, saves `chainpace_wallet_session`, and exposes `address`, `chain`, `connect`, `disconnect`, `switchChain`.

Habits and friends only work when:

- a wallet is connected,
- the chain is Sei Testnet (`0x530`, chain id 1328),
- `NEXT_PUBLIC_CONTRACT_ADDRESS` is set.

`NewHabitButton` opens `NewHabitModal` through a portal on `document.body`, so the sidebar does not clip it.

## On-chain habits

`useChainpace.ts` calls `ChainpaceCore`:

- create / complete / deactivate a habit
- streak, weekly completion, proof score, points
- friend requests, competitions, circle scores

The dashboard and habits page read this hook. Checking a habit also posts `/api/agent/event` so Pace can see the completion.

## Pace (the coach)

Pace is a pinned thread in Messages, not a new page. User id `0`.

Backend files:

| File | What it does |
|---|---|
| `agent.go` | Types and the thread handler. |
| `agent_handlers.go` | Chat, events, CTA accept/decline. |
| `agent_store.go` | Messages, routines, memories, Groq call. |
| `agent_playbook.go` | Fallback when Groq is missing or blocked. |
| `agent_mindset.go` | Splits habits into mind / money / social / body. |
| `coach_plans.go` | Saves a plan when you say when you want a habit. |

Flow:

1. You type in Messages.
2. `agentChatHandler` saves your line, calls `coachReply`.
3. If `GROQ_API_KEY` is set, `groqCoach` tries Groq. If it fails, `playbookChat` answers.
4. A reply can include a CTA (save routine / shrink habit). Confirm writes a routine or a commitment.
5. Saying "I want to gym at 7am on weekdays" creates a row in `coach_plans` and a routine.

Questions are not saved as habits. Old junk chips named "Noted plan" are deactivated on profile load.

## Messages

`/messages` selects nothing. Click Pace or a friend, then the URL becomes `/messages/{id}/{sig}`.

`sig` is the first 24 hex chars of HMAC-SHA256 of the pair of user ids, keyed by `JWT_SECRET` (`threadsig.go`). Guessing an id is not enough. You still must be logged in as one of the two people.

The thread pane scrolls. The composer and Send stay pinned.

## Dashboard and tracking

Dashboard: streak, weekly %, proof score, rank, today's habits, competition, circle, plus `MindsetPanel` (7+ day priorities and category bars).

Tracking: SVG line chart with `1d` / `1w` / `1m`. The curve is built from weekly completion, streak, and today's done count. It is a view of current on-chain numbers, not a stored time series yet.

## Notifications

`lib/notifications.tsx` watches chain changes and new DMs. Each event id is stored so a refresh does not fire the same red badge again. Opening the bell marks items read. Old stored items load as already read.

## Backend map

`main.go` registers routes. Important ones:

```
POST /api/auth/signup|login|wallet|google
GET  /api/auth/me
GET  /api/messages            ?with=
POST /api/messages
GET  /api/thread-link         ?with=
GET  /api/thread-open         ?id=&sig=
GET  /api/agent/thread
POST /api/agent/chat
POST /api/agent/event
POST /api/agent/cta
GET  /api/agent/mindset
GET  /api/agent/plans
```

`envload.go` reads `.env` and strips a UTF-8 BOM so a Windows-saved key still loads.

## Frontend map

```
app/login          sign in
app/dashboard      stats + mindset
app/habits         on-chain habits
app/tracking       1d/1w/1m chart
app/messages       inbox, no thread selected
app/messages/[id]/[sig]   one signed thread
app/friends        on-chain friends
app/competitions   challenges
app/rewards        points
app/profile        account
```

Shared UI lives in `components/`. `AppShell` is the sidebar + top bar. `lib/api.ts` is the fetch client (sends the cookie).

## What is still rough

- Groq can be blocked by network. Pace then uses the playbook. Check the Go log for `pace: groq ok` or `pace: groq failed`.
- Tracking chart is derived, not a real history table.
- Wallet picker is not RainbowKit. Full RainbowKit needs a WalletConnect Cloud project id.
- Google needs both client-id env vars and the correct authorized origin.

# Chainpace — Next.js + TypeScript

Converted from the HTML mockups into a real Next.js 14 (App Router) + TypeScript + Tailwind CSS project.

## Setup

```bash
npm install
npm run dev
```

Then open http://localhost:3000 — it redirects to `/login`.

## Structure

```
app/
  layout.tsx        → fonts (Space Grotesk / Inter / JetBrains Mono) + ThemeProvider
  page.tsx           → redirects to /login
  login/page.tsx      → sign in / sign up (wallet + email + phone flows)
  dashboard/page.tsx  → main dashboard (stats, chart, habits, competition, leaderboard, rewards)
  messages/page.tsx   → mentor + friends chat with pending requests
  globals.css

components/
  Sidebar.tsx         → shared left nav, active route highlighting
  ThemeToggle.tsx      → dark/light switch, persisted to localStorage

lib/
  theme-context.tsx    → React context powering dark/light mode via a `dark` class on <html>
```

## Design tokens

Colors, fonts, and glow shadows are defined in `tailwind.config.ts` (e.g. `violet`, `violet-bright`, `violet-deep`, `mint`, `gold`, `coral`, `shadow-glow`, `shadow-glow-strong`). Every screen pulls from the same tokens so new pages stay visually consistent — just reuse `Sidebar` and `ThemeToggle` and the existing Tailwind classes.

## Notes

- The `/habits`, `/tracking`, `/rewards`, `/competitions`, `/friends`, and `/insights` links in the sidebar are wired up but don't have pages yet — build those next the same way (`app/<name>/page.tsx`, wrap with `<Sidebar />`).
- All data on these pages is hardcoded/mocked — wire up your API or on-chain calls where indicated.
- Wallet connect, checkboxes, and chat are functional at the UI-state level (no real backend yet).

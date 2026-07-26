# Chainpace Backend (Go + SQLite)

Zero network/TLS setup required — SQLite is a local file, so none of the
Windows schannel/proxy issues you hit with MongoDB Atlas can happen here.

## Run it

```bash
go mod tidy
go run .
```

You should see:
```
✅ Connected to SQLite and schema ready (chainpace.db)
🚀 Chainpace backend running at http://localhost:8080
```

A `chainpace.db` file will appear in this folder — that's your entire database.

## Environment variable (optional but recommended)

Set a real JWT secret before you go anywhere near production:

```bash
# Windows PowerShell
$env:JWT_SECRET="a-long-random-string-here"

# Mac/Linux
export JWT_SECRET="a-long-random-string-here"
```

If unset, it falls back to a dev-only default — fine for local testing, not for deploying.

## Endpoints

| Method | Path                        | Purpose                                   |
|--------|------------------------------|--------------------------------------------|
| POST   | `/api/auth/signup`           | Email/phone + password signup             |
| POST   | `/api/auth/login`             | Email/phone/username + password login     |
| POST   | `/api/auth/wallet`            | Wallet login (existing) or signup (new)    |
| GET    | `/api/auth/check-username`    | Live username availability check           |
| GET    | `/api/auth/me`                 | Read current session from cookie           |
| POST   | `/api/auth/logout`            | Clear session cookie                        |

Session is stored as an httpOnly JWT cookie (`chainpace_token`), 7-day expiry.

## Wire up the frontend

1. Copy `lib/api.ts` and `app/login/page.tsx` from the `chainpace-app-updates` package into your Next.js project (same paths), overwriting the old login page.
2. Add `.env.local` in your Next.js project root:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8080
   ```
3. Run both at once:
   ```bash
   # terminal 1
   cd chainpace-backend && go run .

   # terminal 2
   cd chainpace-app && npm run dev
   ```
4. Go to `http://localhost:3000/login` — signup/login now actually persist to `chainpace.db`.

## Migrating to Postgres later

Every query in `models.go` is plain SQL (`db.Exec` / `db.QueryRow`), no
Mongo-specific syntax. Swapping the driver (`modernc.org/sqlite` →
`github.com/jackc/pgx/v5`) and adjusting placeholder syntax (`?` → `$1`) is
the entire migration — the handlers and route logic don't change.

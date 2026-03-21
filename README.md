# SMC Trade Journal
### Fullstack EURUSD Intraday Trading Journal — H1 / M15 / M5 System

Built on: **React + Vite + TailwindCSS + Express + SQLite + Drizzle ORM + JWT Auth**

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, TailwindCSS, Recharts |
| Backend | Node.js, Express |
| Database | SQLite via better-sqlite3 |
| ORM | Drizzle ORM |
| Auth | JWT (access 15min) + Refresh tokens (30d, rotating) |
| Hosting | Render.com (starter plan — persistent disk required) |

---

## Local Development

### 1. Clone & install

```bash
git clone <your-repo>
cd smc-journal

# Install server deps
npm install

# Install client deps
cd client && npm install && cd ..
```

### 2. Environment

```bash
cp .env.example .env
# Edit .env — set JWT_SECRET and JWT_REFRESH_SECRET to long random strings
```

### 3. Create data directory

```bash
mkdir -p data
```

### 4. Run migrations

```bash
npm run db:migrate
```

### 5. Start dev servers (runs both concurrently)

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

---

## Deploy to Render

### Prerequisites
- Render account at render.com
- GitHub repo with this code pushed

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/smc-journal.git
git push -u origin main
```

### Step 2 — Create Render Service

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub repo
3. Render will auto-detect `render.yaml` — click **Apply**

### Step 3 — Environment Variables

Render auto-generates `JWT_SECRET` and `JWT_REFRESH_SECRET` from `render.yaml`.

Double-check these are set in your service dashboard under **Environment**.

### Step 4 — Persistent Disk

The `render.yaml` configures a 1GB persistent disk mounted at `/data`.

> ⚠️ **Important:** Persistent disk requires the **Starter plan ($7/month)**.
> On the free tier, SQLite data is lost on every redeploy/restart.
> If you want free hosting, swap SQLite for **Render's free PostgreSQL** (see below).

### Step 5 — Deploy

Push to `main` → Render auto-deploys. Build command runs `npm install && npm run build`, start command runs `npm run db:migrate && npm start`.

---

## Optional: Swap to Render Free PostgreSQL

If you want free hosting, replace SQLite with Render's free Postgres:

1. Create a free PostgreSQL database on Render
2. Install `drizzle-orm/postgres-js` and `postgres`
3. Update `server/db/client.js` to use `drizzle(postgres(process.env.DATABASE_URL))`
4. Update `drizzle.config.js` dialect to `postgresql`
5. Re-run `drizzle-kit generate` to regenerate migrations

---

## Project Structure

```
smc-journal/
├── client/                      # React frontend
│   ├── src/
│   │   ├── lib/
│   │   │   ├── api.js           # Fetch client with auto token refresh
│   │   │   ├── auth.jsx         # Auth context + useAuth hook
│   │   │   └── constants.js     # Shared enums and formatters
│   │   ├── components/
│   │   │   └── Layout.jsx       # Sidebar navigation shell
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx    # Stats overview + equity curve
│   │   │   ├── Trades.jsx       # Trade log with filters + pagination
│   │   │   ├── TradeForm.jsx    # New / edit trade form
│   │   │   ├── TradeDetail.jsx  # Single trade view
│   │   │   ├── Stats.jsx        # Deep statistics + monthly chart
│   │   │   └── Notes.jsx        # Daily pre-session notes
│   │   ├── App.jsx              # Routes + auth guards
│   │   ├── main.jsx
│   │   └── index.css            # Tailwind + custom components
│   ├── index.html
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/
│   ├── db/
│   │   ├── schema.js            # Drizzle schema (users, trades, tags, notes)
│   │   ├── client.js            # SQLite connection + WAL mode
│   │   ├── migrate.js           # Migration runner
│   │   └── migrations/
│   │       └── 0000_initial.sql # Initial migration
│   ├── middleware/
│   │   └── auth.js              # JWT requireAuth middleware
│   ├── routes/
│   │   ├── auth.js              # Register, login, refresh, logout, /me
│   │   ├── trades.js            # Full CRUD + filters
│   │   ├── stats.js             # All analytics server-side
│   │   └── misc.js              # Tags + daily notes
│   └── index.js                 # Express app entry
│
├── render.yaml                  # Render deployment config
├── drizzle.config.js
├── package.json
└── .env.example
```

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/refresh` | Rotate tokens |
| POST | `/api/auth/logout` | Invalidate refresh token |
| GET  | `/api/auth/me` | Current user |

### Trades
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trades` | List with filters + pagination |
| GET | `/api/trades/:id` | Single trade |
| POST | `/api/trades` | Create trade |
| PUT | `/api/trades/:id` | Update trade |
| DELETE | `/api/trades/:id` | Delete trade |

**Query params for GET /api/trades:**
`session`, `direction`, `outcome`, `setupType`, `dateFrom`, `dateTo`, `isBacktest`, `page`, `limit`, `sort`

### Stats
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Full analytics (win rate, R:R, equity curve, monthly, session breakdown) |

**Query params:** `isBacktest=true/false`

### Tags & Notes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/tags` | List / create tags |
| DELETE | `/api/tags/:id` | Delete tag |
| GET | `/api/notes` | All notes |
| GET | `/api/notes/:date` | Note for date (YYYY-MM-DD) |
| PUT | `/api/notes/:date` | Upsert note for date |

---

## Trade Fields

Every trade stores:

**Core:** date, time, session, pair, direction, setup type, backtest flag

**MTF Bias:** H1 bias, M15 bias, M5 bias (BULL / BEAR / NEUTRAL)

**SMC Confluence:** Swing BOS, Discount/Premium zone, Order Block, FVG, CHoCH, internal BOS

**Levels:** entry, stop loss, TP1, TP2, exit price

**Risk/Result:** risk %, outcome, R result (auto-calculated), pips, P&L USD

**Journal:** pre-trade analysis, post-trade analysis, mistakes/violations

**Psychology:** emotion before/during/after, trade quality rating (1–5)

**Media:** screenshot URL

---

## Security

- Passwords hashed with bcrypt (cost factor 12)
- JWT access tokens expire in 15 minutes
- Refresh tokens rotate on every use (30-day sliding window)
- Refresh tokens stored in DB — can be revoked server-side
- All trade routes require valid JWT
- Users can only access their own data (userId scoping on every query)
- CORS restricted to same-origin in production

---

## Development Commands

```bash
npm run dev          # Start both servers concurrently
npm run dev:server   # Server only (port 3000)
npm run dev:client   # Client only (port 5173)
npm run build        # Build React for production
npm run db:migrate   # Run pending migrations
npm run db:generate  # Generate new migration from schema changes
npm run db:studio    # Open Drizzle Studio (DB GUI)
npm start            # Production server
```

---

## Adding New Schema Fields

1. Edit `server/db/schema.js`
2. Run `npm run db:generate` — Drizzle creates a new migration file
3. Run `npm run db:migrate`
4. Update relevant route in `server/routes/trades.js`
5. Update form in `client/src/pages/TradeForm.jsx`

---

*Built for serious intraday traders. Not financial advice.*

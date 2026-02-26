# STR-Scout

Investment analysis tool for short-term rental properties. Enter property details and financials (or drag & drop documents for AI extraction), and get instant calculations for all standard investment metrics.

## Features

- **Property Management** — Add properties with a guided wizard, track status (analyzing/active/sold/archived)
- **Full Financial Modeling** — Acquisition costs, financing terms, rental income, and flexible operating expenses
- **15+ Investment Metrics** — NOI, Cash on Cash, Cap Rate, DSCR, Gross Yield, Break-Even Occupancy, GRM, Price per Door, and more
- **10-Year Projections** — Annual cash flow, property appreciation, equity buildup, net return, and CAGR
- **AI Document Extraction** — Drag & drop property listings or financial documents; Claude Vision extracts data for review
- **Side-by-Side Comparison** — Compare 2-3 properties with color-coded metric thresholds
- **Address Autocomplete** — Google Places integration auto-fills address, city, state, and zip
- **STR-Specific Expenses** — Per-turnover costs (cleaning, laundry) normalized by guest turnover rate

## Stack

| Layer | Tech |
|---|---|
| Frontend | React, Vite, Tailwind CSS, Zustand |
| Backend | Express, TypeScript |
| Database | SQLite (local dev) / PostgreSQL (production) |
| AI | Anthropic Claude (document extraction) |
| Deployment | Railway |

## Getting Started

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env — see configuration below

# Run development servers (backend :3001, frontend :5173)
npm run dev
```

### Database

**Local development** uses SQLite automatically — no setup needed. The database file is created at `data/str-scout.db` on first run.

**Production** uses PostgreSQL. Set `DATABASE_URL` in your environment to connect:

```bash
DATABASE_URL=postgresql://user:password@host:5432/str_scout
```

When `DATABASE_URL` is unset, the server falls back to SQLite.

### Optional API Keys

| Variable | Purpose | Required? |
|---|---|---|
| `ANTHROPIC_API_KEY` | Document extraction via Claude Vision | No — extraction disabled without it |
| `VITE_GOOGLE_PLACES_API_KEY` | Address autocomplete in the wizard | No — falls back to plain text input |

## Project Structure

```
str-scout/
├── packages/
│   ├── server/              # Express API
│   │   └── src/
│   │       ├── routes/      # REST endpoints
│   │       ├── services/    # DB, calculations, extraction
│   │       └── __tests__/   # Calculation engine tests
│   └── web/                 # React frontend
│       └── src/
│           ├── components/  # Pages and UI components
│           ├── hooks/       # Data fetching hooks
│           └── services/    # API client
├── data/                    # SQLite database (local dev, gitignored)
├── uploads/                 # Document storage (local)
└── railway.toml             # Railway deployment config
```

## API

```
Properties     GET|POST   /api/properties
               GET|PUT|DELETE /api/properties/:id

Financials     GET|PUT    /api/properties/:id/acquisition
               GET|PUT    /api/properties/:id/financing
               GET|PUT    /api/properties/:id/income

Expenses       GET|POST   /api/properties/:id/expenses
               PUT|DELETE /api/properties/:id/expenses/:eid

Calculations   GET        /api/properties/:id/calculations
Dashboard      GET        /api/dashboard
Comparison     POST       /api/compare

Documents      POST|GET   /api/properties/:id/documents
               DELETE     /api/documents/:docId
               POST       /api/documents/:docId/extract
               GET        /api/documents/:docId/extracted
               PUT        /api/extracted/:extractId
               POST       /api/properties/:id/apply-extracted

Health         GET        /api/health
```

## Testing

```bash
npm test
```

Runs the calculation engine test suite (20 tests covering standard mortgages, cash purchases, edge cases, expense normalization, and 10-year projections).

## Deploy to Railway

1. Connect the GitHub repo in Railway
2. Add a PostgreSQL plugin
3. Set `DATABASE_URL` (auto-set by plugin) and `ANTHROPIC_API_KEY` env vars
4. Railway uses `railway.toml` for build/start commands

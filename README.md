# VOLTIS

**Payment and ledger infrastructure platform for reliable financial workflows.**

VOLTIS is a full-stack financial systems project focused on the engineering problems behind payment processing: authentication, organizations, accounts, double-entry ledgering, transaction workflows, idempotency, reconciliation, risk assessment, webhooks, background processing, analytics, and realtime events.

The project is built as a pnpm monorepo with a NestJS API, a dedicated BullMQ worker, a Next.js dashboard, PostgreSQL, Redis, TypeORM, Socket.IO, Docker Compose, and GitHub Actions.

> **Portfolio project:** VOLTIS is intended for engineering evaluation and local development. No public production URL is currently provided.

---

## Product Preview

Add screenshots here after the UI capture is finalized.

```text
README screenshots
├── docs/screenshots/dashboard-overview.png
├── docs/screenshots/transactions.png
└── docs/screenshots/analytics.png
```

Recommended README order:

1. Dashboard overview
2. Transactions / ledger view
3. Analytics / risk view

---

## What VOLTIS Demonstrates

- Secure user authentication with JWT
- Organization/workspace isolation
- Account and chart-of-accounts management
- Transaction processing
- Double-entry ledger entries
- Payment records with idempotency protection
- Background payment processing with BullMQ
- Reconciliation runs and discrepancy tracking
- Risk assessment and decisioning
- Webhook endpoint and delivery management
- Realtime events with Socket.IO
- Financial analytics endpoints
- PostgreSQL persistence with TypeORM migrations
- Unit and end-to-end testing with Vitest
- Dockerized PostgreSQL, Redis, API, worker, and web services
- CI validation through GitHub Actions
- Responsive dashboard with light/dark theme support

---

## Architecture

```text
                         ┌─────────────────────┐
                         │     Next.js Web      │
                         │   Financial Console  │
                         └──────────┬──────────┘
                                    │ HTTP / Socket.IO
                                    ▼
                         ┌─────────────────────┐
                         │     NestJS API      │
                         │ Auth • Payments     │
                         │ Ledger • Risk       │
                         │ Analytics • Webhooks│
                         └───────┬───────┬─────┘
                                 │       │
                    PostgreSQL   │       │ Redis / BullMQ
                                 ▼       ▼
                         ┌──────────┐  ┌──────────────┐
                         │PostgreSQL│  │Worker Service│
                         │ TypeORM  │  │ Payment Jobs │
                         └──────────┘  └──────────────┘
```

### Core flow

```text
Client request
     │
     ▼
Authentication / validation
     │
     ▼
Domain service
     │
     ├──────────────► PostgreSQL / TypeORM
     │
     ├──────────────► Redis / BullMQ ─────► Worker
     │
     └──────────────► Realtime event ─────► Socket.IO clients
```

---

## Engineering Highlights

### Double-entry ledger

Financial transactions are represented through ledger entries tied to accounts and transactions, providing a foundation for auditable movement of value rather than treating payments as isolated CRUD records.

### Idempotent payments

Payment requests carry an idempotency key and request fingerprint so repeated requests can be detected without blindly creating duplicate payment operations.

### Reconciliation

VOLTIS models reconciliation runs and discrepancies so payment, transaction, and ledger state can be compared and investigated.

### Risk engine

Payments can be evaluated through a dedicated risk domain that records a score, decision, signals, and explanation.

### Asynchronous processing

Payment work can be handed to a BullMQ queue and processed by a separate worker service, keeping long-running or retryable work outside the request path.

### Realtime events

The API includes a Socket.IO gateway and event service for pushing operational changes to connected dashboard clients.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 14, React 18, TypeScript |
| UI | CSS, Lucide React |
| API | NestJS 12, TypeScript |
| Authentication | JWT, Passport, bcrypt |
| Database | PostgreSQL 16 |
| ORM | TypeORM |
| Queue | BullMQ |
| Cache / broker | Redis 7 |
| Realtime | Socket.IO |
| Validation | class-validator / class-transformer |
| Testing | Vitest, Supertest |
| Infrastructure | Docker Compose |
| CI | GitHub Actions |
| Package manager | pnpm 11 |
| Runtime | Node.js 22 |

---

## Repository Structure

```text
voltis/
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── accounts/
│   │       ├── admin/
│   │       ├── analytics/
│   │       ├── auth/
│   │       ├── database/
│   │       ├── events/
│   │       ├── ledger/
│   │       ├── organizations/
│   │       ├── payments/
│   │       ├── reconciliation/
│   │       ├── risk/
│   │       ├── transactions/
│   │       ├── users/
│   │       └── webhooks/
│   ├── web/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   └── worker/
│       └── src/
│           └── payments/
├── .github/workflows/ci.yml
├── docker-compose.yml
├── Dockerfile
├── package.json
├── pnpm-lock.yaml
└── pnpm-workspace.yaml
```

---

## Getting Started

### Prerequisites

- Node.js 22
- pnpm 11.24+
- Docker Desktop

Verify your environment:

```bash
node --version
pnpm --version
docker --version
```

### 1. Clone

```bash
git clone https://github.com/Scarlet-Twinz/voltis.git
cd voltis
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment

For local API development, copy the example environment file:

```bash
cp apps/api/.env.example apps/api/.env
```

On Windows PowerShell:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
```

The repository also contains a root `.env.example` for the Docker Compose stack.

Never commit real credentials, tokens, database passwords, or signing secrets.

### 4. Start infrastructure

```bash
docker compose up -d postgres redis
```

Default host ports:

```text
PostgreSQL → localhost:5432
Redis      → localhost:6383
```

### 5. Run database migrations

```bash
pnpm --filter api migration:run
```

### 6. Start the development stack

From the repository root:

```bash
pnpm dev
```

The workspace starts the API, worker, and web applications in parallel.

Open:

```text
Dashboard → http://localhost:3000
API       → http://localhost:4000
Health    → http://localhost:4000/health
```

If you prefer separate terminals:

```bash
pnpm --filter api start:dev
pnpm --filter worker start:dev
pnpm --filter web dev
```

---

## Docker

The repository includes a multi-service Docker Compose setup for PostgreSQL, Redis, API, worker, and web services.

```bash
# Create a local .env from the root example first.
docker compose up --build
```

The API and worker use the internal Docker network for PostgreSQL and Redis. The web application is exposed on port 3000 and the API on port 4000.

---

## Testing & Quality

Run the full workspace checks:

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

API tests:

```bash
pnpm --filter api test
pnpm --filter api test:e2e
```

Worker tests:

```bash
pnpm --filter worker test
pnpm --filter worker test:e2e
```

GitHub Actions runs the build, tests, lint, and typecheck pipeline on pushes and pull requests targeting `main`.

---

## API Domains

The backend is organized around explicit business domains:

- `auth` — registration, login, JWT authentication
- `organizations` — organization lifecycle and ownership
- `accounts` — financial accounts
- `transactions` — transaction creation and processing
- `ledger` — ledger entries and account movement
- `payments` — payment creation and idempotency
- `reconciliation` — reconciliation runs and discrepancies
- `risk` — payment risk assessment
- `webhooks` — endpoints and delivery records
- `analytics` — operational and financial metrics
- `events` — realtime event delivery
- `admin` — administrative operations

---

## Security Notes

VOLTIS is designed as a portfolio implementation of financial-system patterns, not as a production banking system.

The repository intentionally keeps secrets out of source control. Local credentials belong in ignored `.env` files, while `.env.example` files provide safe configuration templates.

Before production use, a real deployment would require additional controls such as managed secret storage, hardened infrastructure, key rotation, audit logging, rate limiting, monitoring, threat modeling, and formal security review.

---

## Current Status

**Functional full-stack portfolio project.**

The current implementation includes the dashboard, authentication flow, organization onboarding, accounts, transactions, ledger, payments, reconciliation, risk, webhooks, analytics, realtime events, background payment processing, migrations, tests, Docker infrastructure, and CI validation.

A hosted production deployment is not currently provided; the repository is intended to be evaluated locally.

---

## Author

**Anthony Emmanuella Mmasinachi**

Full-stack developer focused on frontend engineering, backend systems, APIs, realtime applications, databases, automation, and practical software architecture.

**GitHub:** https://github.com/Scarlet-Twinz

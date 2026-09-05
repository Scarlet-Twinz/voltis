# VOLTIS

**Payment and ledger infrastructure platform for reliable financial workflows.**

VOLTIS is a full-stack financial systems project that demonstrates how payment workflows can be modeled, processed, reconciled, assessed for risk, and surfaced through an operational dashboard.

It combines a **NestJS API, dedicated BullMQ worker, Next.js dashboard, PostgreSQL, Redis, TypeORM, Socket.IO, Docker Compose, and GitHub Actions** in a single pnpm monorepo.

> **Portfolio project:** VOLTIS is an engineering demonstration for local evaluation. It is not a production banking system and does not currently have a public hosted deployment.

---

## Product Preview

The dashboard is designed as a financial operations console for monitoring accounts, transactions, payments, ledger activity, analytics, and risk signals.

> Screenshots will be added to `docs/screenshots/` once the final UI captures are prepared.

Planned screenshots:

1. Dashboard overview
2. Transactions / ledger
3. Analytics / risk

---

## What Is VOLTIS?

VOLTIS focuses on the backend and infrastructure problems that appear in financial software rather than treating payments as simple CRUD records.

A typical workflow looks like this:

```text
User / Operator
      │
      ▼
Next.js Operations Dashboard
      │
      │ HTTP / Socket.IO
      ▼
NestJS API
      │
      ├──────────────► PostgreSQL / TypeORM
      │
      ├──────────────► Redis / BullMQ ─────► Worker
      │
      └──────────────► Realtime Events ────► Dashboard
```

The result is a system where synchronous API requests, persistent financial state, asynchronous processing, reconciliation, risk evaluation, and realtime UI updates are separated into explicit responsibilities.

---

## Core Features

### Authentication & organizations

- JWT-based authentication
- User registration and login
- Organization/workspace isolation
- Organization membership and ownership

### Accounts & ledger

- Financial account management
- Chart-of-accounts structure
- Double-entry ledger entries
- Transaction records linked to ledger movement
- Database migrations with TypeORM

### Payments

- Payment creation and processing workflows
- Idempotency keys to prevent accidental duplicate operations
- Request fingerprinting for repeated requests
- Background processing through BullMQ
- Dedicated worker service

### Reconciliation

- Reconciliation runs
- Discrepancy records
- Comparison of payment, transaction, and ledger state
- Operational investigation workflow

### Risk

- Dedicated risk assessment domain
- Risk scoring
- Decision recording
- Signals and explanations associated with assessments

### Webhooks

- Webhook endpoint management
- Delivery records
- Payment-related event processing

### Realtime operations

- Socket.IO gateway
- Realtime event service
- Dashboard updates without requiring constant page refreshes

### Analytics & administration

- Financial and operational analytics endpoints
- Administrative operations
- Dashboard views for monitoring system activity

---

## Architecture

```text
                         ┌────────────────────────┐
                         │     Next.js Web App     │
                         │   Financial Operations  │
                         │        Dashboard        │
                         └────────────┬───────────┘
                                      │
                             HTTP / Socket.IO
                                      │
                                      ▼
                         ┌────────────────────────┐
                         │       NestJS API       │
                         │                        │
                         │ Auth • Organizations   │
                         │ Accounts • Transactions│
                         │ Ledger • Payments      │
                         │ Risk • Reconciliation  │
                         │ Webhooks • Analytics   │
                         └───────┬────────┬───────┘
                                 │        │
                       PostgreSQL│        │Redis / BullMQ
                                 │        │
                                 ▼        ▼
                         ┌───────────┐ ┌──────────────┐
                         │ PostgreSQL│ │ Worker       │
                         │ TypeORM   │ │ Payment Jobs │
                         └───────────┘ └──────────────┘
```

### Request flow

```text
Client request
     │
     ▼
Authentication + validation
     │
     ▼
Domain controller / service
     │
     ├──► PostgreSQL / TypeORM
     │
     ├──► Redis / BullMQ ───► Worker
     │
     └──► Socket.IO ────────► Connected clients
```

### Why the worker exists

Payment processing and other retryable background work should not have to execute entirely inside an HTTP request. VOLTIS separates this work into a BullMQ queue and dedicated worker so the API can remain responsible for request handling while the worker processes queued jobs.

---

## Engineering Highlights

### Double-entry accounting model

Transactions are represented alongside ledger entries and accounts, providing a foundation for auditable movement of value instead of treating payments as isolated database rows.

### Idempotent payment operations

Payment requests use an idempotency key and request fingerprint so the system can recognize repeated requests and avoid blindly creating duplicate operations.

### Reconciliation as a first-class domain

Reconciliation is modeled explicitly through runs and discrepancies. This makes it possible to represent the process of comparing financial states rather than hiding it inside ad-hoc scripts.

### Risk decisioning

Risk assessment is separated into its own domain and records the score, decision, signals, and explanation used for the assessment.

### Asynchronous processing

Redis and BullMQ provide the queue boundary between the API and the dedicated worker. This demonstrates workload isolation, background execution, and retry-oriented processing.

### Realtime events

Socket.IO provides a realtime channel from the backend to connected dashboard clients so operational changes can be reflected without relying entirely on polling.

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
| Validation | class-validator, class-transformer |
| Testing | Vitest, Supertest |
| Infrastructure | Docker Compose |
| CI | GitHub Actions |
| Package manager | pnpm 11.24 |
| Runtime | Node.js 22 |

---

## Repository Structure

```text
voltis/
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── accounts/          # Financial accounts
│   │       ├── admin/             # Administrative operations
│   │       ├── analytics/         # Financial/operational analytics
│   │       ├── auth/              # Authentication
│   │       ├── database/          # Data source and migrations
│   │       ├── events/            # Realtime events
│   │       ├── ledger/            # Double-entry ledger
│   │       ├── organizations/     # Organizations and membership
│   │       ├── payments/          # Payment workflows/idempotency
│   │       ├── reconciliation/    # Reconciliation and discrepancies
│   │       ├── risk/              # Risk assessment
│   │       ├── transactions/      # Transaction workflows
│   │       ├── users/             # User domain
│   │       └── webhooks/          # Webhook management
│   │
│   ├── web/                       # Next.js operations dashboard
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   │
│   └── worker/                    # BullMQ background processing
│       └── src/
│           └── payments/
│
├── .github/workflows/ci.yml       # CI pipeline
├── docs/screenshots/              # Dashboard screenshots
├── .dockerignore
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── package.json
├── pnpm-lock.yaml
└── pnpm-workspace.yaml
```

---

## Getting Started

The steps below take a developer from a fresh clone to a running VOLTIS dashboard.

### Prerequisites

Install:

- **Node.js 22**
- **pnpm 11.24+**
- **Docker Desktop** with Docker Compose

Verify your environment:

```bash
node --version
pnpm --version
docker --version
```

### 1. Clone the repository

```bash
git clone https://github.com/Scarlet-Twinz/voltis.git
cd voltis
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

For local API development, create the API environment file from the committed template.

macOS/Linux:

```bash
cp apps/api/.env.example apps/api/.env
```

Windows PowerShell:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
```

For the Docker Compose stack, also create the root environment file:

macOS/Linux:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

The example files contain development placeholders only. **Never commit real passwords, JWT secrets, worker secrets, API keys, or other credentials.**

### 4. Start PostgreSQL and Redis

```bash
docker compose up -d postgres redis
```

The local host ports are:

```text
PostgreSQL → localhost:5432
Redis      → localhost:6383
```

Inside Docker Compose, the API and worker use the service names `postgres` and `redis` with the internal Redis port `6379`.

### 5. Run database migrations

```bash
pnpm --filter api migration:run
```

The API is configured with `synchronize: false`, so the database schema is managed through explicit TypeORM migrations rather than automatic schema synchronization.

### 6. Start the complete development stack

From the repository root:

```bash
pnpm dev
```

This starts the API, worker, and web applications in parallel.

Open:

```text
Dashboard → http://localhost:3000
API       → http://localhost:4000
Health    → http://localhost:4000/health
```

### Run each service separately

If you prefer separate terminals:

**API**

```bash
pnpm --filter api start:dev
```

**Worker**

```bash
pnpm --filter worker start:dev
```

**Web**

```bash
pnpm --filter web dev
```

This separate-terminal approach is useful when taking screenshots because you can verify each service independently while keeping the dashboard open in the browser.

---

## Environment Variables

The repository provides `.env.example` templates instead of committing real credentials.

### API

`apps/api/.env` contains configuration for:

| Variable | Purpose | Local value/example |
| --- | --- | --- |
| `NODE_ENV` | Runtime environment | `development` |
| `PORT` | API port | `4000` |
| `CORS_ORIGINS` | Browser origins allowed by the API | `http://localhost:3000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USER` | Database user | `voltis` |
| `DB_PASSWORD` | Database password | local development value |
| `DB_NAME` | Database name | `voltis` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6383` |
| `JWT_SECRET` | JWT signing secret | local placeholder |
| `JWT_EXPIRES_IN` | JWT lifetime | `15m` |
| `WORKER_SECRET` | Internal worker authentication | local placeholder |

### Docker Compose

The root `.env.example` provides the database, Redis, JWT, and worker configuration consumed by the container stack.

For Docker, the API and worker communicate with PostgreSQL and Redis through the Compose network rather than through `localhost`.

---

## Docker

VOLTIS includes a multi-service Docker Compose environment for PostgreSQL, Redis, API, worker, and web.

Create the root `.env` first, then run:

```bash
docker compose up --build
```

Or run detached:

```bash
docker compose up -d --build
```

Check service status:

```bash
docker compose ps
```

Services:

```text
Web        → http://localhost:3000
API        → http://localhost:4000
PostgreSQL → localhost:5432
Redis      → localhost:6383
Worker     → background service
```

The Compose configuration includes health checks and service dependencies so the API and worker wait for their required infrastructure to become healthy.

---

## API Domains

The API is organized into business-oriented modules rather than one large controller/service layer:

| Domain | Responsibility |
| --- | --- |
| `auth` | Registration, login, JWT authentication |
| `organizations` | Organization lifecycle and membership |
| `users` | User records and user-related operations |
| `accounts` | Financial account management |
| `transactions` | Transaction creation and processing |
| `ledger` | Double-entry ledger entries |
| `payments` | Payment lifecycle and idempotency |
| `reconciliation` | Reconciliation runs and discrepancies |
| `risk` | Risk scoring and decisioning |
| `webhooks` | Webhook endpoints and delivery records |
| `analytics` | Financial and operational metrics |
| `events` | Realtime event delivery |
| `admin` | Administrative operations |

---

## Testing & Quality

Run the workspace checks:

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

API:

```bash
pnpm --filter api test
pnpm --filter api test:e2e
pnpm --filter api typecheck
pnpm --filter api build
```

Worker:

```bash
pnpm --filter worker test
pnpm --filter worker test:e2e
pnpm --filter worker typecheck
pnpm --filter worker build
```

Web:

```bash
pnpm --filter web typecheck
pnpm --filter web build
```

The repository also includes GitHub Actions CI for automated validation on pushes and pull requests targeting `main`.

> **Verification note:** README commands describe the intended validation workflow. A passing local command or CI run should be confirmed in the current environment rather than assumed from the documentation.

---

## Database Migrations

VOLTIS uses explicit TypeORM migrations and keeps automatic schema synchronization disabled.

Run migrations:

```bash
pnpm --filter api migration:run
```

Revert the latest migration when appropriate during local development:

```bash
pnpm --filter api migration:revert
```

Migration files live under:

```text
apps/api/src/database/migrations/
```

This keeps schema changes reviewable and version-controlled.

---

## CI

The GitHub Actions workflow lives at:

```text
.github/workflows/ci.yml
```

The pipeline is configured around the locked pnpm version and validates the project through installation, build, tests, linting, and type checking.

```text
Push / Pull Request
        │
        ▼
 GitHub Actions
        │
        ├── Install dependencies
        ├── PostgreSQL service
        ├── Build
        ├── Test
        ├── Lint
        └── Typecheck
```

---

## Security Notes

VOLTIS demonstrates financial-system engineering patterns; it is **not** presented as production-ready banking infrastructure.

The repository intentionally keeps real secrets outside source control. Before production use, additional controls would be required, including:

- Managed secret storage and key rotation
- TLS for externally exposed services
- Strong production authentication/session controls
- Rate limiting and abuse protection
- Hardened authorization policies
- Audit logging and monitoring
- Private networking for databases and brokers
- Production-grade observability
- Threat modeling and formal security review
- Compliance and operational controls appropriate to the financial use case

---

## Current Status

**Functional full-stack portfolio project.**

Implemented areas include:

- Authentication
- Organization onboarding and isolation
- Accounts
- Transactions
- Double-entry ledger
- Payment processing
- Payment idempotency
- Background payment jobs
- Reconciliation
- Risk assessment
- Webhooks
- Analytics
- Realtime events
- Dedicated worker service
- PostgreSQL migrations
- Tests
- Docker infrastructure
- GitHub Actions CI
- Responsive light/dark operations dashboard

A public hosted deployment is not currently provided. The intended evaluation path is to clone the repository and follow the Getting Started section above.

---

## Why VOLTIS?

VOLTIS was built to demonstrate more than a conventional CRUD application.

The project focuses on the engineering boundaries that make financial software interesting: maintaining ledger state, protecting payment operations from duplication, separating synchronous requests from background work, reconciling financial records, evaluating risk, delivering realtime operational information, and keeping infrastructure reproducible.

It is designed as a portfolio-scale example of how a financial operations platform can be structured across frontend, API, database, queue, worker, and infrastructure layers.

---

## License

This project is currently presented as a portfolio and learning project and does not declare an open-source license.

## Author

**Anthony Emmanuella Mmasinachi**

Full-stack developer focused on frontend engineering, backend systems, APIs, realtime applications, automation, databases, and practical software architecture.

**GitHub:** https://github.com/Scarlet-Twinz

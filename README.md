# VOLTIS

**Payment and ledger infrastructure platform for reliable financial workflows.**

VOLTIS is a full-stack financial systems project that models payment processing, double-entry ledger state, reconciliation, risk assessment, asynchronous work, webhooks, analytics, and realtime operational updates.

The system combines a **NestJS API, BullMQ worker, Next.js dashboard, PostgreSQL, Redis, TypeORM, Socket.IO, Docker Compose, and GitHub Actions** in a single pnpm monorepo.

## Product Preview

The dashboard acts as a financial operations console for monitoring accounts, transactions, payments, ledger activity, analytics, and risk signals.

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
- Explicit TypeORM migrations

### Payments

- Payment creation and processing workflows
- Idempotency keys
- Request fingerprinting for repeated requests
- Background processing through BullMQ
- Dedicated worker service

### Reconciliation

- Reconciliation runs
- Discrepancy records
- Comparison of payment, transaction, and ledger state
- Operational investigation workflow

### Risk

- Risk assessment domain
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
- Dashboard updates without constant page refreshes

### Analytics & administration

- Financial and operational analytics endpoints
- Administrative operations
- Dashboard views for monitoring system activity

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
     ├──► Redis / BullMQ ───► Worker
     └──► Socket.IO ────────► Connected clients
```

Payment processing and other retryable background work are separated from HTTP request handling through a BullMQ queue and dedicated worker.

## Engineering Highlights

### Double-entry accounting model

Transactions are represented alongside ledger entries and accounts, providing an auditable model for movement of value.

### Idempotent payment operations

Payment requests use an idempotency key and request fingerprint so repeated requests can be recognized instead of blindly creating duplicate operations.

### Reconciliation

Reconciliation is modeled through runs and discrepancies, providing an explicit workflow for comparing financial states.

### Risk decisioning

Risk assessment records the score, decision, signals, and explanation associated with an assessment.

### Asynchronous processing

Redis and BullMQ provide the queue boundary between the API and worker, supporting workload isolation and retry-oriented processing.

### Realtime events

Socket.IO provides a realtime channel for reflecting operational changes in connected dashboard clients.

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
│   └── worker/
├── .github/workflows/ci.yml
├── docs/screenshots/
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── package.json
├── pnpm-lock.yaml
└── pnpm-workspace.yaml
```

## Getting Started

### Prerequisites

Install:

- Node.js 22
- pnpm 11.24+
- Docker Desktop with Docker Compose

Verify:

```bash
node --version
pnpm --version
docker --version
```

### Install

```bash
git clone https://github.com/Scarlet-Twinz/voltis.git
cd voltis
pnpm install
```

### Configure environment

macOS/Linux:

```bash
cp apps/api/.env.example apps/api/.env
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item .env.example .env
```

Use local development values and never commit real credentials.

### Start infrastructure

```bash
docker compose up -d postgres redis
```

Local host ports:

```text
PostgreSQL → localhost:5432
Redis      → localhost:6383
```

### Run migrations

```bash
pnpm --filter api migration:run
```

### Start the stack

```bash
pnpm dev
```

Endpoints:

```text
Dashboard → http://localhost:3000
API       → http://localhost:4000
Health    → http://localhost:4000/health
```

Or run services separately:

```bash
pnpm --filter api start:dev
pnpm --filter worker start:dev
pnpm --filter web dev
```

## Testing & Quality

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

GitHub Actions validates dependency installation, build, tests, linting, and type checking on pushes and pull requests targeting `main`.

## Database Migrations

VOLTIS uses explicit TypeORM migrations with automatic schema synchronization disabled.

```bash
pnpm --filter api migration:run
pnpm --filter api migration:revert
```

Migration files live under:

```text
apps/api/src/database/migrations/
```

## Docker

Build and start the complete containerized stack:

```bash
docker compose up --build
```

Check services:

```bash
docker compose ps
```

The Compose configuration includes health checks and service dependencies for PostgreSQL, Redis, API, worker, and web services.

## Security Notes

VOLTIS models financial-system engineering patterns but is not presented as production banking infrastructure.

Before production use, additional controls would be required, including managed secret storage and key rotation, TLS, hardened authentication and authorization, rate limiting, audit logging, monitoring, private networking, observability, threat modeling, security review, and applicable compliance controls.

Real secrets remain outside source control. Use the committed environment templates for local configuration.

## Current Status

**Functional full-stack financial systems platform.**

Implemented areas include authentication, organization isolation, accounts, transactions, double-entry ledger, payment processing, idempotency, background jobs, reconciliation, risk assessment, webhooks, analytics, realtime events, dedicated worker processing, database migrations, tests, Docker infrastructure, CI, and a responsive light/dark operations dashboard.

A public hosted deployment is not currently provided; run the system locally using the Getting Started instructions.

## Engineering Focus

VOLTIS focuses on:

- financial state and double-entry ledger modeling;
- idempotent payment operations;
- reconciliation and discrepancy handling;
- risk assessment and decision recording;
- asynchronous job processing;
- realtime operational updates;
- modular backend architecture;
- database migrations and data integrity;
- automated testing and CI.

## License

MIT

## Author

**Anthony Emmanuella Mmasinachi**

Full-stack developer focused on frontend engineering, backend systems, APIs, automation, databases, realtime applications, and practical software architecture.

**GitHub:** https://github.com/Scarlet-Twinz

#  VOLTIS

**Payment and ledger infrastructure platform for reliable financial workflows.**

VOLTIS is a full-stack financial systems project focused on modeling the state transitions that matter when software represents money: accounts, double-entry ledger entries, payments, idempotency, reconciliation, risk decisions, webhooks, asynchronous processing, and realtime operational visibility.

> **Engineering project, not production banking infrastructure.** The repository explicitly documents the additional security, compliance, infrastructure, and operational controls required before real-world financial deployment.

## Financial State Model

```text
Client
  │
  ▼
NestJS API
  │
  ├── Accounts / Transactions
  ├── Payments
  ├── Ledger
  ├── Risk
  ├── Reconciliation
  └── Webhooks
  │
  ├──────────────► PostgreSQL / TypeORM
  │
  ├──────────────► Redis / BullMQ ───► Worker
  │
  └──────────────► Socket.IO ─────────► Dashboard
```

The important boundary is financial state: payment operations and ledger movement are modeled separately so the system can represent what happened, reconcile it, and investigate discrepancies.

## Core Domains

### Accounts & ledger

- Financial account management
- Chart-of-accounts structure
- Double-entry ledger entries
- Transaction records linked to ledger movement
- Explicit TypeORM migrations

### Payment processing

- Payment creation and processing workflows
- Idempotency keys
- Request fingerprinting for repeated requests
- BullMQ background processing
- Dedicated worker service

### Reconciliation

- Reconciliation runs
- Discrepancy records
- Comparison of payment, transaction, and ledger state
- Explicit operational investigation workflow

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
- Dashboard updates without constant refreshes

### Organizations & authentication

- JWT authentication
- User registration/login
- Organization/workspace isolation
- Membership and ownership

## Engineering Highlights

### Double-entry accounting

Transactions are represented alongside ledger entries and accounts so movement of value has an auditable domain model rather than being treated as a single mutable balance field.

### Idempotent operations

Payment requests use an idempotency key and request fingerprint to recognize repeated requests instead of blindly creating duplicate operations.

### Reconciliation as a first-class domain

Reconciliation is represented through runs and discrepancies rather than hidden inside a one-off report. This makes investigation part of the system model.

### Async processing

Retryable/background work is moved behind Redis and BullMQ. HTTP request handling therefore does not need to own every long-running operation.

### Explicit migrations

Automatic schema synchronization is disabled. TypeORM migrations represent schema changes explicitly and are validated through the development/CI workflow.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 14, React 18, TypeScript |
| API | NestJS 12, TypeScript |
| Authentication | JWT, Passport, bcrypt |
| Database | PostgreSQL 16, TypeORM |
| Queue | BullMQ |
| Broker | Redis 7 |
| Realtime | Socket.IO |
| Validation | class-validator, class-transformer |
| Testing | Vitest, Supertest |
| Infrastructure | Docker Compose |
| CI | GitHub Actions |
| Workspace | pnpm monorepo |
| Runtime | Node.js 22 |

## Repository Structure

```text
voltis/
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── accounts/
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
│   │       └── webhooks/
│   ├── web/
│   └── worker/
├── .github/workflows/ci.yml
├── docs/screenshots/
├── docker-compose.yml
├── Dockerfile
└── pnpm-workspace.yaml
```

## Local Development

### Prerequisites

- Node.js 22
- pnpm 11.24+
- Docker Desktop with Docker Compose

```bash
git clone https://github.com/Scarlet-Twinz/voltis.git
cd voltis
pnpm install
```

Configure the environment templates, then start infrastructure:

```bash
docker compose up -d postgres redis
pnpm --filter api migration:run
pnpm dev
```

Default endpoints:

```text
Dashboard → http://localhost:3000
API       → http://localhost:4000
Health    → http://localhost:4000/health
```

For the complete containerized stack:

```bash
docker compose up --build
```

## Testing & Quality

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

API and worker suites also provide targeted unit/E2E commands. GitHub Actions validates dependency installation, tests, linting, type checking, and builds on pushes and pull requests targeting `main`.

## Security Boundary

VOLTIS models financial-system engineering patterns but does not claim production banking readiness.

Before production use, additional controls would be required, including managed secrets and key rotation, TLS, hardened authentication/authorization, rate limiting, audit logging, monitoring, private networking, threat modeling, security review, and applicable regulatory/compliance controls.

Real secrets remain outside source control.

## Current Status

**Functional full-stack financial systems platform.**

Implemented areas include authentication, organization isolation, accounts, transactions, double-entry ledger, payment processing, idempotency, background jobs, reconciliation, risk assessment, webhooks, analytics, realtime events, database migrations, tests, Docker infrastructure, CI, and a responsive operations dashboard.

A public hosted deployment is not currently provided.

## License

MIT

## Author

**Anthony Emmanuella Mmasinachi**

Full-stack and systems engineer focused on backend architecture, data integrity, distributed processing, realtime systems, networking, AI integration, and practical software engineering.

## Project Links

- **Repository:** https://github.com/Scarlet-Twinz/voltis
- **Author:** Anthony Emmanuella Mmasinachi
- **GitHub:** https://github.com/Scarlet-Twinz

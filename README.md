# BillTrack Platform 💳

BillTrack is a Personal Bill & Subscription Management Platform designed to track, organize, and remind users of their recurring financial commitments (streaming services, utilities, rent, insurance, SaaS subscriptions).

## Project Overview

- **Centralized Management:** View all recurring subscriptions, next due dates, and total monthly spend.
- **Occurrence Separation:** Clear architecture separating recurring rules (`Bill`) from individual payment instances (`PaymentOccurrence`).
- **Automated Idempotent Reminders:** Background processing with Redis & BullMQ delivering email notifications before bills are due.
- **RESTful API:** Clean TypeScript + Express modular backend with MongoDB Atlas integration (`billtrack_db`).

---

## Directory Structure

```
billtrack-platform/
├── backend/                  # Node.js + TypeScript Express REST API & BullMQ Workers
│   ├── src/
│   │   ├── config/           # Database, Redis, Pino Logger, Swagger setup
│   │   ├── middleware/       # Auth (JWT), Validation (Zod), Error Handler, Rate Limiter
│   │   ├── modules/          # Auth, Users, Bills, Payments, Categories, Dashboard, Audit
│   │   ├── queues/           # BullMQ Reminder and Notification queues
│   │   ├── workers/          # BullMQ Workers
│   │   ├── jobs/             # Daily scheduler & reconciler
│   │   ├── services/         # Email service (Nodemailer)
│   │   └── utils/            # Recurrence math, date utilities, pagination, errors
│   ├── tests/                # Unit (Jest) and Integration (Supertest) tests
│   ├── Dockerfile
│   └── .env.example
├── frontend/                 # React + Vite + Tailwind CSS (Step 3)
├── docker-compose.yml        # Docker Compose configuration for backend & Redis
└── README.md
```

---

## Quick Start (Backend)

### 1. Environment Setup

Copy `.env.example` to `.env` in the `backend/` directory:

```bash
cd backend
cp .env.example .env
```

Configure your MongoDB Atlas connection string in `MONGO_URI` (ensure it connects to `billtrack_db`).

### 2. Install Dependencies

```bash
cd backend
npm install --legacy-peer-deps
```

### 3. Run Development Server

```bash
npm run dev
```

The API server will run on `http://localhost:5000`.  
Interactive Swagger API documentation: `http://localhost:5000/api/docs`

### 4. Run Automated Tests

```bash
npm test
```

---

## Docker Compose Setup

Run backend and Redis using Docker Compose:

```bash
docker-compose up --build
```

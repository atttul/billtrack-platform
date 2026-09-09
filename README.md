# BillTrack Platform 💳

**BillTrack** is a Personal Bill & Subscription Management Platform designed to help non-technical users track, organize, and manage their recurring financial commitments (streaming services, rent, internet, electricity, gym memberships, SaaS subscriptions, insurance).

---

## 🚀 Key Features

- **Centralized Dashboard:** View monthly recurring expenses, active subscription counts, upcoming payment due dates, and next due payment spotlight.
- **Bill & Payment Occurrence Architecture:** Clear separation between recurring rules ([`Bill`](file:///home/atul_akash/Documents/personal_projects/billtrack-platform/backend/src/modules/bills/bill.model.ts)) and individual cycle instances ([`PaymentOccurrence`](file:///home/atul_akash/Documents/personal_projects/billtrack-platform/backend/src/modules/payments/paymentOccurrence.model.ts)).
- **Recurrence Engine:** Automatic calculation of next due dates (Weekly, Monthly, Yearly) with month-end date clamping (e.g., Jan 31 $\rightarrow$ Feb 28 $\rightarrow$ Mar 31) and leap-year support.
- **Idempotent Background Reminders:** Redis + BullMQ worker queue dispatching automated email reminders prior to due dates without duplicate notifications.
- **Category Management:** Organizes spending with default system categories (Entertainment, Utilities, Rent, Insurance, Internet, Education, Health, Other) and custom user-created categories.
- **Audit Logging:** System audit trail tracking all state-changing actions.
- **Modern Responsive UI:** Clean React + TypeScript + Vite + Tailwind CSS dashboard with responsive sidebar, toast notifications, confirmation dialogs, loading skeletons, and empty states.

---

## 🗄️ Database Specification

> [!IMPORTANT]
> - **Active Database:** `billtrack_db` on MongoDB Atlas.
> - **Isolation Rule:** The database connection strictly uses `billtrack_db`. `go_food_db` (which resides on the same cluster) is **never touched, modified, migrated, or deleted** by this application.

---

## 🏗️ Tech Stack

### Backend
- **Runtime & Language:** Node.js, TypeScript
- **Web Framework:** Express.js
- **Database & ODM:** MongoDB Atlas, Mongoose
- **Queues & Cache:** Redis, BullMQ
- **Validation & Auth:** Zod, JWT, bcryptjs
- **Logging & Docs:** Pino, Swagger / OpenAPI UI
- **Testing:** Jest, Supertest, MongoDB Memory Server

### Frontend
- **Framework & Build:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, Lucide Icons
- **HTTP Client:** Axios with centralized JWT auth interceptor & 401 handling
- **Routing:** React Router v6 (Protected & Public route guards)

---

## 📁 Repository Structure

```
billtrack-platform/
├── backend/
│   ├── src/
│   │   ├── config/           # Database (billtrack_db), Redis, Pino, Swagger
│   │   ├── middleware/       # Auth (JWT), Validation (Zod), Rate Limiting, Error Handler
│   │   ├── modules/          # Auth, Users, Bills, Payments, Categories, Dashboard, Audit
│   │   ├── queues/           # BullMQ Reminder and Notification queues
│   │   ├── workers/          # BullMQ Workers
│   │   ├── jobs/             # Daily scheduler & reconciler
│   │   ├── services/         # Nodemailer Email service
│   │   └── utils/            # Recurrence math, date utilities, pagination, custom errors
│   ├── tests/                # Unit tests (Jest) & Integration tests (Supertest)
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/       # Layout (Sidebar, Navbar), Common (Modal, Toast, Badge, Skeleton)
│   │   ├── context/          # AuthContext, ToastContext
│   │   ├── pages/            # Login, Register, Dashboard, Bills, AddBill, EditBill, BillDetails, PaymentHistory, Categories, Notifications, Settings
│   │   ├── routes/           # AppRoutes with ProtectedRoute and PublicRoute guards
│   │   ├── services/         # API client & domain services
│   │   ├── types/            # TypeScript interfaces
│   │   └── utils/            # Date and Currency formatters
│   └── .env.example
├── docker-compose.yml        # Multi-container setup (Backend + Redis)
└── README.md
```

---

## 🛠️ Local Environment Setup

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
```

Configure your environment variables in `backend/.env`:

```ini
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/billtrack_db?retryWrites=true&w=majority
JWT_SECRET=billtrack_super_secret_jwt_key_2026_dev_mode
JWT_EXPIRES_IN=7d
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=http://localhost:5173
```

Install dependencies and start development server:

```bash
npm install --legacy-peer-deps
npm run dev
```

- API Server: `http://localhost:5000/api/v1`
- Interactive Swagger UI: `http://localhost:5000/api/docs`

Run automated tests:

```bash
npm test
```

### 2. Frontend Setup

```bash
cd frontend
cp .env.example .env
```

Configure environment variable in `frontend/.env`:

```ini
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

Install dependencies and start Vite dev server:

```bash
npm install
npm run dev
```

- Frontend App: `http://localhost:5173`

Run TypeScript build:

```bash
npm run build
```

---

## 🐳 Docker Compose Setup

Run backend and Redis using Docker Compose:

```bash
docker-compose up --build
```

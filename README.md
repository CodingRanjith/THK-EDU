# THK-EDU — Techackode Edutech Platform

Full-stack education management dashboard for **Techackode**.

## Project Structure

```
THK-EDU/
├── client/                 # React + Vite + Tailwind + shadcn/ui
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/       # Protected routes
│   │   │   ├── layout/     # Topbar, Sidebar, Footer, DashboardLayout
│   │   │   └── ui/         # shadcn-style UI components
│   │   ├── config/         # Navigation items
│   │   ├── context/        # Auth context
│   │   ├── lib/            # API client & utilities
│   │   └── pages/          # Login, Dashboard, modules
│   └── .env.example
│
└── server/                 # Node.js + Express + PostgreSQL
    ├── src/
    │   ├── config/         # env & database
    │   ├── controllers/    # auth & admin controllers
    │   ├── db/             # schema, setup, seed
    │   ├── middleware/     # JWT auth & admin guard
    │   ├── models/         # user model
    │   ├── routes/         # API routes
    │   └── services/       # auth service
    └── .env.example
```

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

## Setup

### 1. Database

Create a PostgreSQL database:

```sql
CREATE DATABASE techackode_edu;
```

### 2. Server

```bash
cd server
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

npm install
npm run db:setup
npm run db:seed
npm run dev
```

Default admin credentials (from `.env`):
- **Email:** admin@techackode.com
- **Password:** Admin@123

### 3. Client

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173 and sign in.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Current user profile |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/admin/stats` | Dashboard stats (admin) |
| GET | `/api/admin/users` | List users (admin) |
| POST | `/api/admin/users` | Create user (admin) |
| PATCH | `/api/admin/users/:id/status` | Toggle user status (admin) |
| DELETE | `/api/admin/users/:id` | Delete user (admin) |

## Sidebar Modules (14 items)

Dashboard, Students, Teachers, Courses, Batches, Attendance, Assignments, Exams, Results, Fees & Payments, Reports, Notifications, User Management, Settings

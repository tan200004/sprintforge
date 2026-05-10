# SprintForge 🚀

> AI-powered agile project management and team collaboration platform

![SprintForge](https://img.shields.io/badge/SprintForge-v1.0.0-6366f1?style=for-the-badge)
![Node](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?style=for-the-badge&logo=mongodb)

---

## Overview

SprintForge is a full-stack SaaS platform combining the best features of Jira, Linear, Notion, and Slack — built for modern engineering teams that move fast.

**Key Features:**
- 🔐 JWT authentication with refresh tokens and email verification
- 🛡️ Role-Based Access Control (Admin, Project Manager, Member)
- 📊 Analytics dashboard with Recharts
- 🗂️ Drag-and-drop Kanban board (dnd-kit)
- ⚡ Real-time updates via Socket.IO
- 🤖 AI-powered task/sprint/bug/meeting tools
- 🌙 Dark/Light theme
- ⌨️ Command palette (Ctrl+K)

---

## Project Structure

```
sprintforge/
├── backend/         # Node.js + Express + MongoDB API
│   ├── config/      # DB connection
│   ├── controllers/ # Business logic
│   ├── middleware/  # Auth + RBAC guards
│   ├── models/      # Mongoose schemas
│   ├── routes/      # Express routers
│   ├── services/    # Email + realtime services
│   ├── utils/       # Response handler, token helper
│   └── validators/  # express-validator rules
└── frontend/        # React + Vite + Tailwind
    └── src/
        ├── context/ # Auth, Theme, Socket, Notification
        ├── pages/   # All page components
        ├── components/ # Reusable UI components
        ├── services/ # API client + service modules
        └── layouts/ # AppLayout, AuthLayout
```

---

## Prerequisites

- **Node.js** v18+
- **MongoDB** running locally (`mongodb://localhost:27017`) or a MongoDB Atlas URI
- **npm** v9+

---

## Quick Start

### 1. Clone and install

```bash
# Backend
cd sprintforge/backend
npm install

# Frontend
cd sprintforge/frontend
npm install
```

### 2. Configure environment

Edit `backend/.env` with your settings:

```env
MONGO_URI=mongodb://localhost:27017/sprintforge
JWT_ACCESS_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
SMTP_HOST=smtp.gmail.com
SMTP_USER=your@email.com
SMTP_PASS=your_app_password
CLIENT_URL=http://localhost:5173
```

### 3. Start development servers

```bash
# Terminal 1 — Backend (port 5000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

Open **http://localhost:5173** in your browser.

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register new account |
| POST | `/api/auth/login` | — | Login |
| POST | `/api/auth/logout` | — | Logout |
| POST | `/api/auth/refresh` | Cookie | Refresh access token |
| GET | `/api/auth/verify-email/:token` | — | Verify email |
| POST | `/api/auth/forgot-password` | — | Request reset link |
| POST | `/api/auth/reset-password/:token` | — | Reset password |
| GET | `/api/auth/me` | JWT | Get current user |
| GET | `/api/projects` | JWT | List projects |
| POST | `/api/projects` | PM+ | Create project |
| GET | `/api/projects/:id` | JWT | Get project |
| PUT | `/api/projects/:id` | PM+ | Update project |
| DELETE | `/api/projects/:id` | Admin | Delete project |
| POST | `/api/projects/:id/members` | PM+ | Add member |
| GET | `/api/tasks` | JWT | List tasks |
| POST | `/api/tasks` | JWT | Create task |
| PUT | `/api/tasks/:id` | JWT | Update task |
| PUT | `/api/tasks/:id/move` | JWT | Move kanban column |
| DELETE | `/api/tasks/:id` | JWT | Delete task |
| GET | `/api/comments/task/:taskId` | JWT | Get comments |
| POST | `/api/comments` | JWT | Post comment |
| GET | `/api/notifications` | JWT | Get notifications |
| PUT | `/api/notifications/read-all` | JWT | Mark all read |
| GET | `/api/dashboard` | JWT | Dashboard metrics |
| GET | `/api/activity` | JWT | Activity feed |
| GET | `/api/users` | Admin | List all users |
| GET | `/api/users/profile` | JWT | Get own profile |
| PUT | `/api/users/profile` | JWT | Update profile |
| PUT | `/api/users/:id/role` | Admin | Change user role |
| POST | `/api/ai/generate-description` | JWT | AI task description |
| POST | `/api/ai/sprint-summary` | JWT | AI sprint summary |
| POST | `/api/ai/explain-bug` | JWT | AI bug explainer |
| POST | `/api/ai/meeting-notes` | JWT | AI meeting notes |

---

## Socket.IO Events

| Event (Client → Server) | Description |
|--------------------------|-------------|
| `forge:join:project` | Join a project room for live updates |
| `forge:leave:project` | Leave a project room |

| Event (Server → Client) | Description |
|--------------------------|-------------|
| `forge:notification` | New notification pushed |
| `forge:task:created` | Task created in project |
| `forge:task:updated` | Task updated |
| `forge:task:moved` | Task moved to different column |
| `forge:task:deleted` | Task deleted |
| `forge:comment:new` | New comment posted |

---

## Roles & Permissions

| Action | Admin | Project Manager | Member |
|--------|-------|-----------------|--------|
| Manage users | ✅ | ❌ | ❌ |
| Create projects | ✅ | ✅ | ❌ |
| Delete projects | ✅ | ❌ | ❌ |
| Invite members | ✅ | ✅ | ❌ |
| Create/edit tasks | ✅ | ✅ | ✅ |
| Delete tasks | ✅ | ❌ | Own only |
| Comment on tasks | ✅ | ✅ | ✅ |
| View all analytics | ✅ | Project only | Assigned only |

---

## Deployment

### Frontend → Vercel

```json
// vercel.json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

```bash
cd frontend && npm run build
# Deploy dist/ folder to Vercel
```

### Backend → Render

Set environment variables in the Render dashboard and deploy from Git.

---

## Tech Stack

**Frontend:** React 18, Vite, Tailwind CSS, Framer Motion, Recharts, dnd-kit, Socket.IO Client, React Router v6

**Backend:** Node.js, Express.js, MongoDB, Mongoose, Socket.IO, JWT, Bcrypt, Multer, Nodemailer

---

## License

MIT © SprintForge 2024

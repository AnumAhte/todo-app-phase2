# Todo App Phase 2 - Multi-User Web Application

A modern, secure multi-user todo application built with Next.js, FastAPI, and Neon Serverless PostgreSQL. Features JWT-based authentication with Better Auth and a clean, responsive UI.

## Features

- **User Authentication**: Secure signup/signin with Better Auth and JWT tokens
- **Task Management**: Create, read, update, delete, and toggle task completion
- **User-Scoped Data**: Each user sees only their own tasks
- **Real-time Validation**: Form validation with instant feedback
- **Responsive Design**: Works on desktop and mobile devices
- **Secure API**: JWKS-based JWT verification with EdDSA signatures

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15+ (App Router) |
| Backend | Python FastAPI |
| ORM | SQLModel |
| Database | Neon Serverless PostgreSQL |
| Authentication | Better Auth (JWT with EdDSA) |
| Styling | Tailwind CSS |

## Project Structure

```
Todo-phase2/
├── frontend/                    # Next.js 15+ App Router
│   ├── app/                     # App Router pages and layouts
│   │   ├── (auth)/              # Auth pages (login, signup)
│   │   ├── (dashboard)/         # Protected routes (tasks)
│   │   └── api/auth/[...all]/   # Better Auth API routes
│   ├── components/              # Reusable UI components
│   ├── lib/                     # Utilities and auth client
│   └── package.json
│
├── backend/                     # Python FastAPI
│   ├── app/
│   │   ├── main.py              # FastAPI app entry
│   │   ├── routers/             # API route handlers
│   │   ├── models/              # SQLModel database models
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── auth/                # JWT verification & security
│   │   └── database.py          # Neon PostgreSQL connection
│   ├── requirements.txt
│   └── .env.example
│
├── specs/                       # Feature specifications
├── history/                     # Development history (PHRs, ADRs)
└── .specify/                    # Spec-Kit Plus configuration
```

## Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Neon PostgreSQL database (or any PostgreSQL)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/AnumAhte/todo-app-phase2.git
cd todo-app-phase2
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your database URL and JWT secret
```

**Backend Environment Variables (.env):**
```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
BETTER_AUTH_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000
CLOCK_SKEW_SECONDS=30
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local
# Edit .env.local with your configuration
```

**Frontend Environment Variables (.env.local):**
```env
BETTER_AUTH_SECRET=your-secure-secret-key-min-32-chars
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 4. Database Setup

The application uses Neon Serverless PostgreSQL. Tables are created automatically on first run.

**Database Schema:**
- `users` - User accounts (managed by Better Auth)
- `tasks` - Todo tasks with user ownership

### 5. Running the Application

**Start Backend (Terminal 1):**
```bash
cd backend
.venv\Scripts\activate  # Windows
uvicorn app.main:app --reload --port 8000
```

**Start Frontend (Terminal 2):**
```bash
cd frontend
npm run dev
```

**Access the Application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## API Endpoints

### Authentication (via Better Auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/sign-up/email` | Register new user |
| POST | `/api/auth/sign-in/email` | Login user |
| POST | `/api/auth/sign-out` | Logout user |
| GET | `/api/auth/session` | Get current session |
| GET | `/api/auth/token` | Get JWT token for API |
| GET | `/api/auth/jwks` | Public keys for JWT verification |

### Tasks API (Backend)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/{user_id}/tasks` | List user's tasks |
| POST | `/api/{user_id}/tasks` | Create new task |
| GET | `/api/{user_id}/tasks/{task_id}` | Get specific task |
| PUT | `/api/{user_id}/tasks/{task_id}` | Update task |
| DELETE | `/api/{user_id}/tasks/{task_id}` | Delete task |
| PATCH | `/api/{user_id}/tasks/{task_id}/toggle` | Toggle completion |

**All task endpoints require JWT authentication via `Authorization: Bearer <token>` header.**

## Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│  Frontend   │────▶│ Better Auth │
│             │     │  (Next.js)  │     │   (JWT)     │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                   │
                           │ JWT Token         │ JWKS
                           ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │   Backend   │────▶│    Neon     │
                    │  (FastAPI)  │     │ PostgreSQL  │
                    └─────────────┘     └─────────────┘
```

1. User signs in via Better Auth on frontend
2. Better Auth issues JWT token (EdDSA signed)
3. Frontend includes JWT in API requests to backend
4. Backend verifies JWT using JWKS public keys
5. Backend returns user-scoped data

## Security Features

- **JWT with EdDSA**: Secure token signing with Ed25519 keys
- **JWKS Verification**: Public key rotation support
- **Password Hashing**: Secure password storage via Better Auth
- **CORS Protection**: Configured allowed origins
- **User Isolation**: Strict user-scoped data access
- **SQL Injection Prevention**: Parameterized queries via SQLModel
- **Rate Limiting Ready**: Extensible middleware architecture

## Development

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Code Quality

```bash
# Backend linting
cd backend
ruff check .

# Frontend linting
cd frontend
npm run lint
```

## Deployment

### Backend (Any Python Host)
1. Set production environment variables
2. Use gunicorn with uvicorn workers:
   ```bash
   gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```

### Frontend (Vercel Recommended)
1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Database (Neon)
1. Create project at neon.tech
2. Copy connection string to backend `.env`
3. Enable connection pooling for production

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [FastAPI](https://fastapi.tiangolo.com/) - Python web framework
- [Better Auth](https://better-auth.com/) - Authentication library
- [Neon](https://neon.tech/) - Serverless PostgreSQL
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework

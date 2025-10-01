# Secure Client Portal

A full-stack client portal application implementing robust security controls, workflow automation, and document collaboration. The solution is built with a React (Vite) frontend, a TypeScript Node.js/Express API, and MongoDB for persistence.

## Features
- **Authentication & Security**: JWT access/refresh tokens, MFA, account lockout, CSRF protection, strong password policy, email verification, secure password resets, rate limiting, and security headers.
- **User Management**: Role-based access (admin, manager, staff, client), profile management, activity logging, and admin tooling for user/client administration.
- **Workflows & Collaboration**: Custom workflows with tasks, status tracking, comments, history, templates, and progress analytics.
- **Document Management**: Secure uploads with file type validation and checksum storage, download auditing, and per-user access controls.
- **Notifications**: Real-time Socket.IO push notifications and REST endpoints for notification feeds.
- **Search & Analytics**: Global search across users, workflows, and documents plus dashboard analytics with cached metrics.
- **DevOps & Reliability**: Comprehensive logging, structured configuration, automated tests, Docker containerization, and ready-to-deploy infrastructure.

## Tech Stack
- **Frontend**: React 18, Vite, TypeScript, MUI, React Query, React Hook Form, Zod, Socket.IO client.
- **Backend**: Node.js 18, Express, TypeScript, Mongoose, Zod, JWT, Bcrypt, Winston, Socket.IO, Nodemailer.
- **Database**: MongoDB with Mongoose ODM.
- **Tooling**: Jest, Supertest, ESLint, Docker, docker-compose.

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- MongoDB 6+ (local or remote)
- (Optional) Docker & Docker Compose

### Installation
```bash
# Install workspace dependencies
npm install

# Copy and configure environment variables
cp backend/.env.example backend/.env
# Update backend/.env with secrets (JWT keys must be >=32 chars)
```

### Running in Development
```bash
# Start API and frontend concurrently
npm run dev

# API only
npm run dev:backend

# Frontend only
npm run dev:frontend
```

The API listens on `http://localhost:5000` and the frontend on `http://localhost:5173` by default.

### Database
Ensure `MONGO_URI` in `backend/.env` points to your MongoDB instance. During development you can use `mongodb://127.0.0.1:27017/client-portal`.

### Scripts
| Command | Description |
| --- | --- |
| `npm run test --workspace backend` | Run backend Jest tests (uses mongodb-memory-server) |
| `npm run build --workspace backend` | Compile backend TypeScript to `dist/` |
| `npm run build --workspace frontend` | Produce frontend production build under `frontend/dist` |
| `npm run seed --workspace backend` | Seed demo data (creates admin/client accounts) |

### Docker Deployment
```bash
# Build and start MongoDB, API, and frontend containers
docker-compose up --build
```
- API exposed on `http://localhost:5000`
- Frontend served via Nginx on `http://localhost:5173`
- MongoDB available on `mongodb://portal:portal@localhost:27017`

Update `backend/.env` for production secrets and supply it via Docker secrets or environment variables in your deployment environment.

### Security Configuration Checklist
- Generate unique 32+ character strings for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
- Configure SMTP credentials for password reset and verification emails.
- Place the deployment behind HTTPS (e.g., reverse proxy or load balancer with TLS termination).
- Regularly rotate secrets and database credentials.
- Adjust CORS origins (`FRONTEND_URL`) to the deployed frontend domains.

## Project Structure
```
portal/
├── backend/          # Express API (TypeScript)
├── frontend/         # React SPA (Vite + TypeScript)
├── docker-compose.yml
├── package.json      # Workspace root
└── README.md
```

## Testing & Quality
- Backend tests (`jest`, `supertest`) cover authentication flows.
- ESLint and TypeScript enforce static analysis (run via `npm run lint` / `npm run type-check`).
- React Query caches API responses; invalidation occurs after mutations.

## Environment Variables (Backend)
| Variable | Description |
| --- | --- |
| `PORT` | API port (default 5000) |
| `MONGO_URI` | MongoDB connection string |
| `FRONTEND_URL` | Comma-separated allowed origins for CORS/CSRF |
| `JWT_ACCESS_SECRET` | 32+ char secret for signing access tokens |
| `JWT_REFRESH_SECRET` | 32+ char secret for signing refresh tokens |
| `JWT_ACCESS_EXPIRATION` | Access token lifespan (e.g., `15m`) |
| `JWT_REFRESH_EXPIRATION` | Refresh token lifespan (e.g., `7d`) |
| `FILE_UPLOAD_DIR` | Directory for uploaded documents |
| `MAX_FILE_SIZE_MB` | File upload limit |
| `SMTP_*` | SMTP settings for transactional email |
| `ENABLE_SWAGGER` | Toggle OpenAPI docs (`/api/docs`) |

## API Documentation
An OpenAPI specification is available at `backend/src/docs/openapi.yaml`. When `ENABLE_SWAGGER=true`, Swagger UI is served from `/api/docs`.

## Next Steps
- Configure CI/CD to run linting, testing, and container builds.
- Integrate further analytics or BI tooling via the provided services layer.
- Extend the frontend with additional reporting visualizations as needed.

---
For any questions or enhancements, review the code comments and service abstractions across `backend/src/services` and `frontend/src/services`.

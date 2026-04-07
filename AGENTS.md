# AGENTS.md - Studio Booking App

## Quick Start

### Backend
```bash
cd backend
.\venv\Scripts\activate
pip install -r requirements.txt
# Create PostgreSQL database first: createdb studio_booking_db
psql -U postgres -d studio_booking_db -f database_schema.sql
uvicorn main:app --reload --host 0.0.0.0 --port 8000
# API docs: http://127.0.0.1:8000/docs
```

### Frontend
```bash
cd frontend
npm install
# Edit src/services/api.js - set API_BASE_URL to your LAN IP for device testing
npx expo start
```

## Project Structure
- `backend/main.py` - FastAPI entry point
- `backend/app/routes/` - auth, studio, resource, booking routers
- `frontend/App.js` - React Native entry point
- `frontend/src/screens/` - All screen components
- `frontend/src/services/api.js` - Axios with token interceptor

## Critical Details

- **Login**: Form-encoded `username=email&password` to `/auth/login`
- **Booking slots**: 30-minute increments only
- **Approval flow**: Bookings require owner approval (`pending_approval` → `approved/rejected`)
- **JSONB columns**: Use `meta_data`, NOT `metadata` (avoids reserved name conflict)
- **Database**: PostgreSQL with SQLAlchemy; schema in `backend/database_schema.sql`

## Test Endpoints
- `GET /test-db` - Verify DB connection
- `GET /test-models` - Verify all ORM models work

## Key Routes
- Auth: `/auth/register`, `/auth/login`, `/auth/me`
- Studios: `GET/POST /studios/`, `GET/PUT/DELETE /studios/{id}`
- Bookings: `POST /bookings/`, `GET /bookings/my-bookings`, `GET /bookings/pending-approvals`, `PUT /bookings/{id}/approve`

## CORS Configuration

The backend uses environment-based CORS:
- `ALLOWED_ORIGINS` environment variable (comma-separated)
- Default: `http://localhost:3000,http://127.0.0.1:3000`
- For production: Set specific domains in K8s configmap

## Docker & K8s

### Build Images
```bash
# Backend
docker build -t studio-booking-backend:latest ./backend

# Frontend (static export)
docker build -t studio-booking-frontend:latest ./frontend
```

### Docker Compose (Local)
```bash
docker-compose up --build
# Services: frontend on :3000, backend on :8000, postgres on :5432
```

### Manual Docker (Separate Network)
```bash
# Create network
docker network create studio_booking_network

# Run PostgreSQL
docker run -d --name studio_booking_db --network studio_booking_network -e POSTGRES_USER=studio_app -e POSTGRES_PASSWORD=studio123 -e POSTGRES_DB=studiobook_db -p 5432:5432 postgres:17-alpine

# Run Backend
docker run -d --name studio_booking_backend --network studio_booking_network -e DATABASE_URL="postgresql://studio_app:studio123@studio_booking_db:5432/studiobook_db" -e SECRET_KEY=secret -p 8000:8000 studio-booking-backend:latest

# Run Frontend
docker run -d --name studio_booking_frontend --network studio_booking_network -p 3000:80 studio-booking-frontend:latest
```

### K8s Deploy
```bash
kubectl apply -f k8s/secrets.yml
kubectl apply -f k8s/configmap.yml
kubectl apply -f k8s/postgres.yml
kubectl apply -f k8s/backend-deployment.yml
kubectl apply -f k8s/frontend-deployment.yml
```

## Database Auto-Initialization

The backend includes a startup script (`backend/startup.py`) that:
- Waits for PostgreSQL to be ready (30 retries, 2s delay)
- Creates tables automatically on first startup
- Configurable via env vars: `DB_STARTUP_RETRIES`, `DB_STARTUP_DELAY`

## EAS Build (Android APK)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project (already done - eas.json exists)
cd frontend

# Build APK for testing
eas build --profile preview --platform android

# Download APK from link
```

Build profiles in `eas.json`:
- `development` - Development build with dev client
- `preview` - Internal testing APK
- `production` - App Store ready AAB

## Web Build
```bash
cd frontend
npx expo export --platform web
# Output in dist/ folder
```
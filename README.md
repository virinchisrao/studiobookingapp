# Music Studio booking Application
#### Video Demo:  https://youtu.be/k2tchdte1Pk
#### Description:
Mobile-first studio booking app where customers book studio resources (rooms/booths) in 30-minute slots. Studio owners register studios and manually approve bookings.

#### Table of Contents
Overview
Tech Stack
Architecture
Features
Project Structure
Getting Started
Backend
Frontend
Environment Variables
Database Schema (summary)
API (high-level)

This app enables:

Customers: browse studios/resources, select 30-minute time slots, create bookings.
Owners: create studios, add resources, approve/reject bookings.
Admin: maintenance and future analytics.
Everything runs locally: FastAPI backend, PostgreSQL DB, and Expo-based React Native frontend.

Tech Stack
Frontend: React Native + Expo (tested with Expo Go)
Backend: FastAPI (Python), Swagger docs at /docs
Database: PostgreSQL (local)
ORM/Validation: SQLAlchemy ORM + Pydantic
Auth: JWT (bcrypt + passlib for password hashing)
Config: .env for DB and JWT
Architecture
React Native (Expo) → axios → FastAPI → SQLAlchemy → PostgreSQL
↘ EventLog (audit)

Key ideas:

API-first backend with auto-generated docs.
Relational schema suited for bookings/resources.
Manual booking approval by owners (payments deferred to Phase 2).
Features
Authentication
Registration with hashed passwords (bcrypt)
JWT login and protected routes
Role-based access (customer, owner, admin)
Studios & Resources
Owners create studios, add resources
Studio coordinates (lat/lng) for map display
Booking Workflow
30-minute slot increments (can book consecutive slots)
Conflict detection (overlap checks)
Pending → owner approval → (payment in Phase 2) → confirmed
Refund policy: 24+ hours before start → 80% refund (Phase 1 logic)
Event Logging
Audit trail of key actions (event_log table)
Project Structure


backend/
├─ .env
├─ database_schema.sql
├─ main.py
├─ requirements.txt
└─ app/
   ├─ core/        # config, database session, security (hashing/JWT)
   ├─ models/      # SQLAlchemy models (user, studio, resource, availability, booking, event_log)
   ├─ routes/      # FastAPI routes (auth, studio, resource, booking)
   ├─ schemas/     # Pydantic schemas
   └─ utils/       # booking_helpers (overlap checks, refunds, slot logic)

frontend/
└─ src/
   ├─ components/  # Map/Location pickers
   ├─ navigation/  # AppNavigator
   ├─ screens/     # Auth, customer, owner flows
   ├─ services/    # api.js (axios + AsyncStorage token)
   └─ utils/       # bookingHelpers, studioAPI
Getting Started
Prerequisites
Python 3.10+ (recommended)
Node.js 16+ (Expo recommends newer LTS)
PostgreSQL 13+ installed locally
Expo Go app on your phone (for device testing)
Backend (FastAPI)
Open terminal:


cd backend
Create and activate venv:
Windows (CMD):


python -m venv venv
venv\Scripts\activate
PowerShell:


python -m venv venv
venv\Scripts\Activate.ps1
macOS/Linux:


python -m venv venv
source venv/bin/activate
Install dependencies:


pip install -r requirements.txt
Create database and apply schema:
Create DB (via pgAdmin or psql):


createdb studio_booking_db
Apply schema:


psql -U postgres -d studio_booking_db -f database_schema.sql
Configure environment (backend/.env):


DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/studio_booking_db
SECRET_KEY=your-long-random-secret
ACCESS_TOKEN_EXPIRE_MINUTES=1440
Run backend:


uvicorn main:app --reload
Swagger: http://127.0.0.1:8000/docs

Frontend (React Native + Expo)
Open a new terminal:


cd frontend
npm install
Configure API base URL:
Edit src/services/api.js
Use your machine LAN IP if testing on a real device:
JavaScript

export const API_BASE_URL = "http://192.168.x.x:8000"; // your LAN IP
// Emulators can often use http://127.0.0.1:8000
Start Expo:

npx expo start
Scan the QR code with Expo Go (Android). For iOS, use Camera app or run in simulator.
Environment Variables
Backend (.env):

DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/studio_booking_db
SECRET_KEY=your-long-random-secret
ACCESS_TOKEN_EXPIRE_MINUTES=1440
Tip: Generate a secret with Python:

python -c "import secrets; 
print(secrets.token_urlsafe(64))"

Database Schema (summary)
users: user_id, email, password_hash, name, phone, role, is_active, created_at, last_login
studios: studio_id, owner_id (FK users), name, description, address, city, state, postal_code, phone, is_active, is_published, lat, lng, created_at, updated_at
resources: resource_id, studio_id (FK studios), name, resource_type, base_price_per_hour, max_occupancy, is_active
availability_template: weekly schedule per resource
bookings: booking_id, user_id, resource_id, studio_id, booking_date, start_time, end_time, duration_minutes, status, total_amount, refund/cancel fields
event_log: id, event_type, actor_user_id, meta_data (JSONB), created_at
Note: meta_data used instead of metadata to avoid SQLAlchemy reserved name.

API (high-level)
Health/dev
GET /, GET /health, GET /test-db, GET /test-models
Auth
POST /auth/register (JSON)
POST /auth/login (form-encoded: username=email, password)
GET /auth/me (Bearer token)
Studios
GET /studios
POST /studios (owner-only)
GET /studios/{id}, PUT/PATCH, DELETE (owner-only, scoped)
Resources
CRUD under /resources (owner-only)
Bookings
POST /bookings (customer)
Owner approval/rejection endpoints (see Swagger)
Use Swagger at /docs for full request/response shapes.

Common Workflows
Register users:
Customer account
Owner account (role=owner)
Owner:
Create a studio (with lat/lng for map)
Add resources
Approve/reject bookings
Customer:
Browse studios/resources
Select 30-minute slots, create booking
Cancel booking (refund policy applies)

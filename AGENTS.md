# AGENTS.md - Coding Guidelines for Agents

This document provides guidance for AI agents working on the Studio Booking Application.

## Project Overview

- **Type**: Full-stack mobile-first web application
- **Backend**: FastAPI (Python) with SQLAlchemy ORM, PostgreSQL database
- **Frontend**: React Native with Expo
- **Auth**: JWT-based authentication with bcrypt password hashing
- **API Docs**: Available at `/docs` (Swagger UI)

## Project Structure

```
backend/
├── main.py                 # FastAPI app entry point
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables (DATABASE_URL, SECRET_KEY)
├── app/
│   ├── core/              # Config, database, security, auth dependencies
│   ├── models/            # SQLAlchemy ORM models
│   ├── routes/           # FastAPI route handlers
│   ├── schemas/          # Pydantic request/response schemas
│   └── utils/            # Helper functions

frontend/
├── package.json           # Node/Expo dependencies
├── App.js                 # React Native entry point
└── src/
    ├── components/       # Reusable UI components
    ├── navigation/       # React Navigation setup
    ├── screens/          # Screen components
    ├── services/         # API client (axios)
    └── utils/            # Helper functions
```

## Build & Run Commands

### Backend (FastAPI)

```bash
cd backend

# Activate virtual environment (Windows)
venv\Scripts\activate
# Or (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run development server (auto-reload)
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run tests (if pytest configured)
pytest -v
pytest tests/test_file.py::test_function -v  # Run single test

# Access API docs
# http://127.0.0.1:8000/docs
```

### Frontend (React Native + Expo)

```bash
cd frontend

# Install dependencies
npm install

# Start Expo (QR code for mobile testing)
npx expo start

# Run on specific platforms
npx expo start --web
npx expo start --android
npx expo start --ios
```

## Code Style Guidelines

### Python (Backend)

**Imports**:
- Group in order: standard library, third-party, local application
- Use explicit relative imports: `from app.core.database import Base`

**Naming**:
- Variables/functions: `snake_case` (e.g., `get_user_by_email`)
- Classes: `PascalCase` (e.g., `UserResponse`)
- Constants: `UPPER_SNAKE_CASE`
- Database tables: `snake_case` (e.g., `user_id`, `created_at`)

**Types**:
- Use Pydantic `BaseModel` for request/response schemas
- Use SQLAlchemy `Column` for model definitions
- Use Python type hints (`def func(param: str) -> List[dict]`)

**Error Handling**:
- Raise `HTTPException` with appropriate status codes
- Use try/except blocks, rollback on failure: `db.rollback()`
- Return meaningful error messages in `detail` field

**Formatting**:
- Maximum line length: 100 characters
- Use 4 spaces for indentation
- Add docstrings for route handlers and complex functions

**Pydantic Schemas**:
- Use `Field()` for validation (min_length, max_length, pattern)
- Use `EmailStr` for email validation
- Set `from_attributes = True` in `Config` class for ORM compatibility
- Use `Optional[type]` with `None` default for nullable fields

### JavaScript/React Native (Frontend)

**Imports**:
- Group: React, third-party components, local imports
- Use relative paths: `import { authAPI } from '../services/api'`

**Naming**:
- Variables/functions/components: `camelCase`
- Component files: `PascalCase` (e.g., `BookingScreen.js`)
- Constants: `UPPER_SNAKE_CASE`

**React Patterns**:
- Use functional components with hooks (`useState`, `useEffect`)
- Use async/await for API calls
- Store JWT tokens in AsyncStorage (via `api.js` interceptor)
- Use React Navigation for screen routing

**API Calls**:
- Use the centralized `api.js` service with axios
- Token automatically attached via request interceptor
- Handle errors with try/catch blocks

**State Management**:
- Use React Navigation params for passing data between screens
- Use `AsyncStorage` for persisting auth token

## API Patterns

### Backend Routes

All routes use the pattern: `app.include_router(router)` in `main.py`

Authentication:
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login (form-encoded: username=email, password)
- `GET /auth/me` - Get current user (protected)

Studios:
- `GET /studios/` - List all studios
- `POST /studios/` - Create studio (owner only)
- `GET /studios/{id}` - Get studio details

Bookings:
- `POST /bookings/` - Create booking
- `GET /bookings/my-bookings` - Customer's bookings
- `GET /bookings/pending-approvals` - Owner's pending bookings
- `PUT /bookings/{id}/approve` - Approve/reject booking

### Response Format

Success: Return model instance or dict
Error: Raise `HTTPException(status_code=N, detail="message")`

## Database

- PostgreSQL with SQLAlchemy ORM
- Use `get_db()` dependency for session management
- Always `db.commit()` after changes, `db.refresh()` to get updated data
- Use `meta_data` (not `metadata`) for JSONB columns (avoids reserved name conflict)

## Environment Variables

Backend (`.env`):
```
DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/studio_booking_db
SECRET_KEY=your-random-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

Frontend: Update `API_BASE_URL` in `src/services/api.js` to your LAN IP for device testing

## Testing Notes

- Backend test endpoints: `/test-db`, `/test-models`
- No formal test suite exists yet; consider adding pytest
- Use Swagger UI at `/docs` for manual API testing

## Key Conventions

1. **30-minute slots**: Booking durations are in 30-minute increments
2. **Role-based access**: Users have `customer` or `owner` role
3. **Manual approval**: Bookings require owner approval (pending → approved/rejected)
4. **Event logging**: Key actions logged to `event_log` table with `meta_data` JSONB
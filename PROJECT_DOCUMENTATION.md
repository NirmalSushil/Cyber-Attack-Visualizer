# Project Documentation

Last updated: April 18, 2026

## 1. Project Overview

Cyber Attack Visualizer is a full-stack cyber intelligence and breach-checking application with:

- A Node.js + Express + SQLite backend API.
- A React + Vite frontend with route guards, dashboards, and animated UI.

The product currently supports:

- Identifier scanning for EMAIL, PHONE, IP, AADHAAR, PAN, and URL.
- Backend-based user registration and login.
- Local session persistence in browser storage.
- Scan result history persisted in SQLite and mirrored per-user in localStorage for dashboard analytics.
- Government login mode and a government dashboard view.

## 2. Line Count Summary (Current Codebase)

Source line counts below exclude node_modules, dist/build artifacts, lockfiles, logs, and database files.

- Backend (cyber-backend): 740 lines
- Frontend (cyber-visualizer): 3,292 lines
- Total: 4,032 lines

Largest files by line count:

1. cyber-visualizer/src/components/Home.jsx: 683
2. cyber-visualizer/src/components/DashboardPage.jsx: 484
3. cyber-visualizer/src/components/GovDashboard.jsx: 480
4. cyber-visualizer/src/components/RegisterPage.jsx: 393
5. cyber-visualizer/src/components/LoginPage.jsx: 369
6. cyber-visualizer/src/index.css: 313
7. cyber-backend/controllers/scanController.js: 307
8. cyber-visualizer/src/App.jsx: 262
9. cyber-backend/controllers/authController.js: 176
10. cyber-backend/config/db.js: 106

## 3. Architecture

### 3.1 Backend

Backend entry point: [cyber-backend/server.js](cyber-backend/server.js)

Current routes:

- POST /api/auth/register
- POST /api/auth/login
- POST /api/scan
- GET /api/attacks
- GET /api/attacks/search
- DELETE /api/attacks/:id
- GET /api/enrich/:ip
- GET /api/global-threats

The backend uses:

- CORS and JSON middleware.
- Dotenv for environment configuration.
- Controllers for auth and scan operations.

### 3.2 Database Layer

Database config: [cyber-backend/config/db.js](cyber-backend/config/db.js)

SQLite tables:

- attacks: stores all scan results.
- threat_cache: caches IP intelligence responses.
- users: stores user accounts and role data.

The file also includes lightweight schema migration logic for missing columns in attacks.

### 3.3 Frontend

Frontend bootstrap: [cyber-visualizer/src/main.jsx](cyber-visualizer/src/main.jsx)

App shell and routing: [cyber-visualizer/src/App.jsx](cyber-visualizer/src/App.jsx)

Main pages:

- Login page
- Register page
- Home scanner page
- User dashboard
- Government dashboard

Theme system is managed by ThemeContext and global styles in index.css.

## 4. Authentication Flow

### 4.1 Backend Auth

Auth controller: [cyber-backend/controllers/authController.js](cyber-backend/controllers/authController.js)

Register flow:

- Validates name, username, email, password.
- Enforces minimum password length.
- Rejects duplicate email or username.
- Stores passwordHash using SHA-256.
- Returns created user payload.

Login flow:

- Supports two modes: user and government.
- User mode validates loginId (email/username) + password.
- Government mode validates govId + password + government role.
- Returns normalized user payload on success.

A default government account is auto-created if missing.

### 4.2 Frontend Auth Integration

Login UI: [cyber-visualizer/src/components/LoginPage.jsx](cyber-visualizer/src/components/LoginPage.jsx)

Register UI: [cyber-visualizer/src/components/RegisterPage.jsx](cyber-visualizer/src/components/RegisterPage.jsx)

Both pages call backend endpoints directly using:

- POST /api/auth/login
- POST /api/auth/register

Session helper: [cyber-visualizer/src/userStorage.js](cyber-visualizer/src/userStorage.js)

Notes:

- getSession, setSession, and clearSession are actively used by App and Login flows.
- Legacy helper methods for local user DB still exist in the file for backward compatibility patterns, but active login/register paths use backend APIs.

## 5. Scan Engine and Data Flow

Scan controller: [cyber-backend/controllers/scanController.js](cyber-backend/controllers/scanController.js)

### 5.1 Supported Types

- EMAIL via LeakCheck (with fallback)
- IP via AbuseIPDB (with fallback)
- URL via VirusTotal (with fallback)
- PHONE via Numverify (with fallback)
- AADHAAR and PAN through local fallback path

### 5.2 Fallback Strategy

When keys are missing or APIs fail:

- Controller searches local attacks history.
- Matches by normalized identifier and type.
- Returns latest local result when available.
- Otherwise returns a safe fallback response.

### 5.3 Persistence

Every scan attempt is logged through Attack model:

- Model file: [cyber-backend/models/Attack.js](cyber-backend/models/Attack.js)
- Stores identifier, type, status, severity score, source, breach metadata, and scan timestamp.

### 5.4 Enrichment and Threat Feed

- IP enrichment endpoint uses threat_cache with one-day recency checks before live API calls.
- Global threat feed endpoint pulls top IP data from SANS ISC and maps it into UI-friendly records.

## 6. Frontend Scanner Behavior

Scanner page: [cyber-visualizer/src/components/Home.jsx](cyber-visualizer/src/components/Home.jsx)

Current behavior:

- Validates input by selected identifier type.
- Enforces max input lengths for PHONE (10), AADHAAR (12), PAN (10).
- Normalizes phone/aadhaar/pan while typing.
- Sends scan requests to backend.
- Displays animated progress and modal result view.
- Auto-clears search input after successful scan.
- Stores per-user history in localStorage key pattern search_history_<email>.
- Emits modal state events to hide shared header/footer while popup is open.

The result modal includes:

- Masked identifier display.
- Privacy fingerprint (SHA-256-based reference).
- Risk score and exposure metadata.
- Recommended mitigation actions by type.

## 7. Routing and Access Control

Route guards in [cyber-visualizer/src/App.jsx](cyber-visualizer/src/App.jsx):

- ProtectedRoute requires any session.
- DashboardRoute blocks guest users.
- GovRoute allows only role = government.

Route map:

- /login
- /register
- /home
- /dashboard
- /gov-dashboard

Navbar visibility is suppressed on auth routes and while modal popup is open.

## 8. Key Files

Backend:

- [cyber-backend/server.js](cyber-backend/server.js)
- [cyber-backend/config/db.js](cyber-backend/config/db.js)
- [cyber-backend/controllers/authController.js](cyber-backend/controllers/authController.js)
- [cyber-backend/controllers/scanController.js](cyber-backend/controllers/scanController.js)
- [cyber-backend/models/Attack.js](cyber-backend/models/Attack.js)

Frontend:

- [cyber-visualizer/src/main.jsx](cyber-visualizer/src/main.jsx)
- [cyber-visualizer/src/App.jsx](cyber-visualizer/src/App.jsx)
- [cyber-visualizer/src/components/Home.jsx](cyber-visualizer/src/components/Home.jsx)
- [cyber-visualizer/src/components/LoginPage.jsx](cyber-visualizer/src/components/LoginPage.jsx)
- [cyber-visualizer/src/components/RegisterPage.jsx](cyber-visualizer/src/components/RegisterPage.jsx)
- [cyber-visualizer/src/components/DashboardPage.jsx](cyber-visualizer/src/components/DashboardPage.jsx)
- [cyber-visualizer/src/components/GovDashboard.jsx](cyber-visualizer/src/components/GovDashboard.jsx)
- [cyber-visualizer/src/userStorage.js](cyber-visualizer/src/userStorage.js)
- [cyber-visualizer/src/index.css](cyber-visualizer/src/index.css)

## 9. Current Limitations

- Password hashing currently uses plain SHA-256 without salt.
- No JWT/session token system; frontend persists user session in localStorage.
- Search history for dashboard is client-local and per browser.
- Government dashboard remains largely presentation/static-data oriented.
- No formal automated backend or frontend test suite in package scripts.
- scanRoutes.js exists but routes are currently mounted directly in server.js.

## 10. Recommended Next Improvements

1. Replace SHA-256 password hashing with bcrypt or argon2.
2. Add token-based auth (JWT or secure cookie sessions).
3. Move user scan history to backend user-scoped endpoints for cross-device sync.
4. Add pagination and filters for attacks list and searches.
5. Add integration tests for auth, scan fallback, and enrichment endpoints.
6. Consolidate or remove legacy userStorage helper methods not used in active auth paths.
7. Optionally mount scanRoutes.js for cleaner route organization.

## 11. Conclusion

The project is now in a stronger state than the initial local-only auth version: authentication is wired to backend endpoints, scanning supports resilient fallbacks, and the frontend offers a polished workflow with modal-driven UX and scanner input constraints.

With stronger password security and tokenized sessions, this codebase can move from local demo readiness toward production-grade architecture.
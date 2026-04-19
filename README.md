# Cyber Attack Visualizer

Cyber Attack Visualizer is a full-stack cyber intelligence and breach-checking application designed to help users identify potential security risks associated with their digital footprints.

## Features

- **Identifier Scanning**: Supports scanning for EMAIL, PHONE, IP, AADHAAR, PAN, and URLs.
- **Secure Authentication**: Backend-based user registration and login flows.
- **Dual Dashboard Modes**: Features distinct views for regular users and government personnel with specialized access.
- **Threat Intelligence**: Integrates with external APIs (LeakCheck, AbuseIPDB, VirusTotal, Numverify) to provide real-time enrichment and threat feeds, with resilient local fallback data.
- **Scan History**: Retains detailed scan history with severity scoring, source metadata, and mitigation steps.
- **Responsive & Animated UI**: Built with a dynamic, modern interface.

## Tech Stack

**Frontend:**
- React (bootstrapped with Vite)
- Context API for state and theme management

**Backend:**
- Node.js
- Express
- SQLite for lightweight, persistent data storage

## Project Structure

The project is divided into two primary workspaces:
- `/cyber-backend`: The Node.js Express server handling API routes, authentication logic, and database interactions.
- `/cyber-visualizer`: The React frontend client providing the user interface and interactions.

*(For detailed architectural and implementation insights, please refer to the `PROJECT_DOCUMENTATION.md` file.)*

## Getting Started

To run this project locally, you will need to start both the backend server and the frontend client.

### Prerequisites

- Node.js (v16.0.0 or higher recommended)
- npm or yarn

### Running the Backend

1. Navigate to the backend directory:
   ```bash
   cd cyber-backend
   ```
2. Install the necessary dependencies:
   ```bash
   npm install
   ```
3. Set up the `.env` file based on the environment requirements.
4. Start the server:
   ```bash
   npm start
   ```
   *(By default, the server should run on `http://localhost:5000`)*

### Running the Frontend

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd cyber-visualizer
   ```
2. Install the necessary dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *(The application will typically be available at `http://localhost:5173`)*

## Current Limitations & Future Work

- Enhance password security by migrating from simple SHA-256 to `bcrypt` or `argon2`.
- Implement JWT or secure cookie-based session tokens instead of local storage persistence.
- Develop synchronization of user scan history through backend endpoints for cross-device visibility.
- Add pagination and robust filtering capabilities to dashboard tables.
- Introduce integration tests for improved application reliability.

## License

This project is open-source and available for educational and demonstration purposes.

# Cyber Attack Visualizer Frontend

Frontend application for Cyber Attack Visualizer.

## Stack

- React 19
- Vite (rolldown-vite)
- React Router DOM
- Tailwind CSS
- Framer Motion
- Recharts

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## API Endpoint

The app uses:

- `VITE_API_URL` from environment, or
- `http://localhost:5000` by default

## Important Paths

- `src/App.jsx` - Main app shell and routes
- `src/components/Home.jsx` - Scanner page
- `src/components/DashboardPage.jsx` - User dashboard
- `src/components/GovDashboard.jsx` - Government dashboard
- `src/ThemeContext.jsx` - Theme provider
- `src/userStorage.js` - Local storage auth/session helpers

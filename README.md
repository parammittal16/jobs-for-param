# Career Matcher: Bespoke Executive Search Agent

Career Matcher is a specialized, full-stack application designed to automate the job hunting process for high-level software engineering roles. It leverages AI (Gemini) to perform grounded, real-time web searches to curate opportunities based on a personalized profile, ensuring only high-quality, relevant matches are surfaced.

## Core Features

- **Personalized Job Matching**: Tailored to specific seniority (e.g., SDE3), compensation requirements, and role-specific criteria like UI Principal presence and WLB stability.
- **AI-Powered Grounded Search**: Uses Gemini's Search Grounding capabilities to scan the live web for active openings, filtering out generic career portals in favor of specific job detail pages.
- **Automated Weekly Reporting**: Built-in scheduling system to compile and deliver curated opportunities via email every Saturday at 5:00 PM IST.
- **Application Tracker**: Manage the status of target company applications in a dedicated dashboard.
- **Elegant Dark UI**: A bespoke, refined interface built with Tailwind CSS.

## Tech Stack

- **Frontend**: React 18+, TypeScript, Tailwind CSS, Motion (for UI transitions).
- **Backend**: Express.js (Node.js).
- **AI**: Google Gemini API with Search Grounding.
- **Build System**: Vite.

## Setup & Running

This project is configured as a full-stack application with a unified build process.

### Environment Variables

Ensure the following environment variables are configured (see `.env.example`):
- `GEMINI_API_KEY`: Required for AI search and report generation.
- `RESEND_API_KEY`: Required for automated email delivery (optional for local simulation).

### Development

To start the development server:

```bash
npm install
npm run dev
```

The server will start on port `3000`.

### Production Build

To build the project for deployment:

```bash
npm run build
```

This compiles the frontend and bundles the backend into `dist/server.cjs`.

### Start

To run the production build:

```bash
npm start
```

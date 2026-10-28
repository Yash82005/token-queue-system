# QueueFlow — Token Queue Management System

QueueFlow is a full-stack token queue management system designed to reduce waiting confusion and help service counters manage visitors efficiently.

## Features

- **Visitor token generation:** Visitors select a service and receive a token number.
- **Service-specific queues:** Supports Deposits, Loans, and Enquiry.
- **Counter management:** Counter staff can call the next eligible token, complete service, or skip a token.
- **Live public display:** Queue updates are broadcast using Socket.IO.
- **Estimated waiting time:** Visitors can view an estimated wait based on recent service durations, with a fallback estimate.
- **Input validation:** The backend validates requests and returns errors for invalid inputs.
- **Responsive interface:** Built with React and Tailwind CSS for desktop and mobile layouts.
- **Concurrent token allocation:** Uses PostgreSQL row locking with `FOR UPDATE SKIP LOCKED` to help prevent two counters from claiming the same waiting token.
- **Automated tests:** Vitest and Supertest test API responses and invalid-input handling.

## Tech Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS, Socket.IO Client

**Backend:** Node.js, Express, TypeScript, Socket.IO

**Database:** PostgreSQL

**Testing:** Vitest, Supertest

## Project Structure

```text
token-queue-system/
├── backend/
│   ├── src/
│   ├── tests/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   └── package.json
├── .gitignore
└── README.md
```

## Prerequisites

- Node.js and npm
- PostgreSQL
- Git

## Local Setup

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd token-queue-system
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your public GitHub repository URL.

### 2. Configure the backend

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and update the database connection string with your local PostgreSQL credentials.

Create the `token_queue_db` database in PostgreSQL and ensure the required tables, sequence, and constraints are configured. Follow the database schema included in this repository.

### 3. Start the backend

```bash
npm run dev
```

The backend normally runs at `http://localhost:5000`.

### 4. Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

## Application Pages

- **Visitor:** `/`
- **Counter:** `/counter`
- **Public display:** `/display`

## Testing

From the backend directory:

```bash
npm test
npm run build
```

From the frontend directory:

```bash
npm run build
```

The current automated test suite contains six tests covering the API status endpoint and invalid-input validation.

## Design Decisions

- PostgreSQL stores queue records and service statuses.
- Database row locking with `SKIP LOCKED` helps avoid duplicate token allocation when multiple counters request the next token concurrently.
- Socket.IO broadcasts queue changes so connected displays can update without manual refresh.
- Service-specific filtering prevents counters from calling tokens from the wrong service queue.
- The estimated waiting time uses available completed-service durations and a fallback value when there is insufficient history.

## Limitations and Future Improvements

- Improve waiting-time predictions to account for multiple counters serving a queue in parallel.
- Add authentication and role-based authorization for counter staff.
- Add daily reports and analytics.
- Add deployment-specific environment configuration and verify the live application.
- Expand automated tests to cover successful database operations and concurrent requests.

## AI Tools Used

AI assistance was used during development for coding guidance, debugging, and documentation. All project code and functionality should be reviewed and tested before submission.

## Demo



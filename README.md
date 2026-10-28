# QueueFlow — Real-Time Token Queue Management System

QueueFlow is a full-stack token queue management application that helps visitors join a queue and allows staff to serve visitors efficiently across multiple counters.

## Features

- Generate unique visitor tokens
- View waiting and currently serving tokens
- Manage multiple service counters
- Call the next waiting visitor
- Complete a visitor's service
- Update queue information in real time using Socket.IO
- Store token history in PostgreSQL
- Separate visitor, staff, and public display interfaces

## Tech Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS  
**Backend:** Node.js, Express.js, TypeScript, Socket.IO  
**Database:** PostgreSQL

## Project Structure

- `frontend/` — Visitor dashboard, staff counter dashboard, and public display
- `backend/` — API routes, queue management logic, and database connection

## Prerequisites

- Node.js and npm
- PostgreSQL
- Git

## Setup

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd token-queue-system
```

### 2. Configure the backend

```bash
cd backend
npm install
```

Configure your PostgreSQL connection using the environment variable names defined in the backend configuration. Create the required database and tables using your database schema.

### 3. Start the backend

```bash
npm run dev
```

### 4. Configure and start the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

## Application Pages

- Visitor dashboard: `http://localhost:5173/`
- Staff counter dashboard: `http://localhost:5173/counter`
- Public display: `http://localhost:5173/display`

The backend runs on `http://localhost:5000` by default.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/tokens` | Generate a visitor token |
| GET | `/api/tokens` | Retrieve all tokens |
| PATCH | `/api/tokens/next` | Call the next waiting token |
| PATCH | `/api/tokens/:id/complete` | Complete a serving token |

## Testing

The application has been manually tested for token generation, calling tokens at counters, completing service, and displaying the updated queue.

## Future Improvements

- Automated backend and frontend tests
- Authentication and role-based staff access
- Queue analytics and average waiting-time estimates
- Production deployment and monitoring

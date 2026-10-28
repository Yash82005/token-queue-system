
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import pool from "./db";
import tokenRoutes from "./routes/tokens";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH"],
  },
});

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());
app.use("/api/tokens", tokenRoutes(io));

app.get("/", (_req, res) => {
  res.json({
    message: "Token Queue System API is running",
    status: "success",
  });
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

app.get("/api/health", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      status: "success",
      database: "connected",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database error:", error);

    res.status(500).json({
      status: "error",
      database: "disconnected",
    });
  }
});

export { app, httpServer };

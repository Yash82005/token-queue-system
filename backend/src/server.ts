import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import pool from "./db";
import tokenRoutes from "./routes/tokens";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH"]
  }
});

app.use(cors({
  origin: "http://localhost:5173"
}));

app.use(express.json());
app.use("/api/tokens", tokenRoutes(io));

app.get("/", (req, res) => {
  res.json({
    message: "Token Queue System API is running",
    status: "success"
  });
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      status: "success",
      database: "connected",
      time: result.rows[0].now
    });
  } catch (error) {
    console.error("Database error:", error);

    res.status(500).json({
      status: "error",
      database: "disconnected"
    });
  }
});

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
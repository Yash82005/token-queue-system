import { Router } from "express";
import pool from "../db";
import { Server } from "socket.io";

export default function tokenRoutes(io: Server) {
  const router = Router();


  // Generate a new token
  router.post("/", async (req, res) => {
    const allowedServices = ["Deposits", "Loans", "Enquiry"];
    const serviceType = req.body?.service_type;

    if (
      typeof serviceType !== "string" ||
      !allowedServices.includes(serviceType)
    ) {
      return res.status(400).json({
        message: "Please select a valid service: Deposits, Loans, or Enquiry",
      });
    }

    try {
      const result = await pool.query(
        `INSERT INTO tokens (token_number, status, service_type)
         VALUES (
           'A' || LPAD(nextval('token_number_seq')::text, 3, '0'),
           'waiting',
           $1
         )
         RETURNING *`,
        [serviceType]
      );

      const token = result.rows[0];

      io.emit("queue-updated");

      res.status(201).json({
        message: "Token generated successfully",
        token,
      });
    } catch (error) {
      console.error("Create token error:", error);

      res.status(500).json({
        message: "Failed to generate token",
      });
    }
  });


  // Get all tokens
  router.get("/", async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM tokens ORDER BY id ASC`
      );

      res.json(result.rows);
    } catch (error) {
      console.error("Fetch tokens error:", error);

      res.status(500).json({
        message: "Failed to fetch tokens"
      });
    }
  });

  // Call the next waiting token
  router.patch("/next", async (req, res) => {
    const counterNumber = Number(req.body.counterNumber);
    const allowedServices = ["Deposits", "Loans", "Enquiry"];
    const serviceType = req.body?.service_type;

    if (!Number.isInteger(counterNumber) || counterNumber < 1 || counterNumber > 3) {
      return res.status(400).json({
        message: "Counter number must be between 1 and 3",
      });
    }

    if (
      typeof serviceType !== "string" ||
      !allowedServices.includes(serviceType)
    ) {
      return res.status(400).json({
        message: "Please select a valid service",
      });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Prevent the same counter from serving two tokens
      const existing = await client.query(
        `SELECT id FROM tokens
         WHERE status = 'serving'
         AND counter_number = $1
         LIMIT 1`,
        [counterNumber]
      );

      if (existing.rows.length > 0) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          message: "This counter is already serving a token"
        });
      }

      // Lock the next waiting token
      const waiting = await client.query(
       `SELECT id FROM tokens
       WHERE status = 'waiting'
       AND service_type = $1
       ORDER BY id ASC
       FOR UPDATE SKIP LOCKED
       LIMIT 1`,
      [serviceType]
    );

      if (waiting.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          message: "No waiting tokens available"
        });
      }

      const result = await client.query(
        `UPDATE tokens
         SET status = 'serving',
             counter_number = $1,
             called_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [counterNumber, waiting.rows[0].id]
      );

      await client.query("COMMIT");

      io.emit("queue-updated");

      res.json({
        message: "Next token called successfully",
        token: result.rows[0]
      });
    } catch (error) {
      await client.query("ROLLBACK");

      console.error("Call next error:", error);

      res.status(500).json({
        message: "Failed to call next token"
      });
    } finally {
      client.release();
    }
  });
  
  // Skip a token currently being served
  router.patch("/:id/skip", async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ message: "Invalid token ID" });
    }

    try {
      const result = await pool.query(
        `UPDATE tokens
         SET status = 'skipped'
         WHERE id = $1
           AND status = 'serving'
         RETURNING *`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Serving token not found",
        });
      }

      io.emit("queue-updated");

      res.json({
        message: "Token skipped successfully",
        token: result.rows[0],
      });
    } catch (error) {
      console.error("Skip token error:", error);
      res.status(500).json({
        message: "Failed to skip token",
      });
    }
  });


  // Complete a token
  router.patch("/:id/complete", async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        message: "Invalid token ID"
      });
    }

    try {
      const result = await pool.query(
        `UPDATE tokens
         SET status = 'completed',
             completed_at = NOW()
         WHERE id = $1
         AND status = 'serving'
         RETURNING *`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Serving token not found"
        });
      }

      io.emit("queue-updated");

      res.json({
        message: "Token completed successfully",
        token: result.rows[0]
      });
    } catch (error) {
      console.error("Complete token error:", error);

      res.status(500).json({
        message: "Failed to complete token"
      });
    }
  });

  return router;
}
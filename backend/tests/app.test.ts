
import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("QueueFlow API", () => {
  it("GET / should return the API status", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.message).toBe(
      "Token Queue System API is running"
    );
  });

  it("should reject an invalid service type", async () => {
    const response = await request(app)
      .post("/api/tokens")
      .send({ service_type: "InvalidService" });

    expect(response.status).toBe(400);
  });

  it("should reject an invalid counter number", async () => {
    const response = await request(app)
      .patch("/api/tokens/next")
      .send({
        counterNumber: 99,
        service_type: "Deposits",
      });

    expect(response.status).toBe(400);
  });

  it("should reject an invalid service when calling next token", async () => {
    const response = await request(app)
      .patch("/api/tokens/next")
      .send({
        counterNumber: 1,
        service_type: "InvalidService",
      });

    expect(response.status).toBe(400);
  });

  it("should reject a non-numeric token ID when skipping", async () => {
    const response = await request(app).patch(
      "/api/tokens/not-a-number/skip"
    );

    expect(response.status).toBe(400);
  });

  it("should reject a non-numeric token ID when completing", async () => {
    const response = await request(app).patch(
      "/api/tokens/not-a-number/complete"
    );

    expect(response.status).toBe(400);
  });
});

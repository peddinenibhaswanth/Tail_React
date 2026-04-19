const request = require("supertest");
const app = require("../app");
const User = require("../models/User");

describe("Auth flow", () => {
  it("registers a customer and returns a token", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test Customer",
      email: "customer@example.com",
      password: "password123",
      password2: "password123",
      role: "customer",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.token.length).toBeGreaterThan(10);
  });

  it("logs in a customer and returns a token", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Test Customer",
      email: "customer2@example.com",
      password: "password123",
      password2: "password123",
      role: "customer",
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "customer2@example.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.token.length).toBeGreaterThan(10);
  });

  it("rejects login for an unapproved organization account", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Org User",
      email: "org@example.com",
      password: "password123",
      password2: "password123",
      role: "organization",
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "org@example.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body).toMatchObject({
      success: false,
      message: expect.stringContaining("pending approval"),
    });
  });

  it("POST /api/auth/login supports legacy plaintext passwords and upgrades them", async () => {
    const legacyEmail = "legacy-user@example.com";
    const legacyPassword = "LegacyPass123!";

    // Insert directly into Mongo to bypass mongoose pre-save hashing.
    await User.collection.insertOne({
      name: "Legacy User",
      email: legacyEmail,
      password: legacyPassword,
      role: "customer",
      isApproved: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: legacyEmail, password: legacyPassword })
      .expect(200);

    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body).toHaveProperty("token");
    expect(loginRes.body).toHaveProperty("user");
    expect(loginRes.body.user).toHaveProperty("email", legacyEmail);

    const upgraded = await User.findOne({ email: legacyEmail }).lean();
    expect(typeof upgraded.password).toBe("string");
    expect(upgraded.password).toMatch(/^\$2[aby]\$\d{2}\$/);
  });
});

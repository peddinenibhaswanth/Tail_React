const request = require("supertest");
const app = require("../app");

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
});

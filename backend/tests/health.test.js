const request = require("supertest");
const app = require("../app");

describe("GET /api/health", () => {
  it("returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: expect.any(String),
      timestamp: expect.any(String),
    });
  });
});

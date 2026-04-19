const request = require("supertest");
const app = require("../app");

describe("Google OAuth (disabled)", () => {
  it("GET /api/auth/google returns 501 when not configured", async () => {
    // Ensure we are testing the disabled state
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;

    const res = await request(app)
      .get("/api/auth/google")
      .set("Accept", "application/json");

    expect(res.statusCode).toBe(501);
    expect(res.body).toMatchObject({
      success: false,
      message: expect.stringContaining("Google OAuth is not configured"),
    });
  });
});

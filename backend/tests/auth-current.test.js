const request = require("supertest");
const app = require("../app");

async function registerAndLogin(email) {
  await request(app).post("/api/auth/register").send({
    name: "Test User",
    email,
    password: "Password123!",
    password2: "Password123!",
    role: "customer",
  });

  const loginRes = await request(app).post("/api/auth/login").send({
    email,
    password: "Password123!",
  });

  return loginRes.body.token;
}

describe("Auth /current and /logout", () => {
  it("rejects /api/auth/current without token", async () => {
    const res = await request(app).get("/api/auth/current");
    expect(res.statusCode).toBe(401);
    expect(res.body).toMatchObject({ success: false });
  });

  it("returns current user with a valid token", async () => {
    const token = await registerAndLogin("current@example.com");

    const res = await request(app)
      .get("/api/auth/current")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      user: expect.any(Object),
    });
    expect(res.body.user).toHaveProperty("email", "current@example.com");
  });

  it("allows logout with a valid token", async () => {
    const token = await registerAndLogin("logout@example.com");

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ success: true });
  });
});

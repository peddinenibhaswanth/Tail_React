const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");

const User = require("../models/User");

describe("Public appointments endpoints", () => {
  it("GET /api/appointments/veterinaries returns empty list initially", async () => {
    const res = await request(app).get("/api/appointments/veterinaries");
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ success: true, total: 0 });
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/appointments/veterinaries returns approved vets", async () => {
    await User.create({
      name: "Vet",
      email: "vet@example.com",
      password: "Password123!",
      role: "veterinary",
      isApproved: true,
      vetInfo: {
        clinicName: "Clinic",
      },
    });

    const res = await request(app).get("/api/appointments/veterinaries");
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ success: true });
    expect(res.body.total).toBe(1);
    expect(res.body.data[0]).toHaveProperty("email", "vet@example.com");
  });

  it("GET /api/appointments/available-slots rejects missing parameters", async () => {
    const res = await request(app).get("/api/appointments/available-slots");
    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({ success: false });
  });

  it("GET /api/appointments/available-slots returns slots for a vet", async () => {
    const vet = await User.create({
      name: "Vet 2",
      email: "vet2@example.com",
      password: "Password123!",
      role: "veterinary",
      isApproved: true,
      vetInfo: {},
    });

    const date = "2026-04-16";
    const res = await request(app).get(
      `/api/appointments/available-slots?veterinary=${vet._id}&date=${date}`
    );

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ success: true });
    expect(res.body.data).toHaveProperty("isVetAvailable", true);
    expect(Array.isArray(res.body.data.allSlots)).toBe(true);
    expect(Array.isArray(res.body.data.availableSlots)).toBe(true);
    expect(res.body.data.availableSlots.length).toBe(res.body.data.allSlots.length);
  });

  it("GET /api/appointments/available-slots returns 404 for unknown vet", async () => {
    const missingId = new mongoose.Types.ObjectId().toString();
    const date = "2026-04-16";
    const res = await request(app).get(
      `/api/appointments/available-slots?veterinary=${missingId}&date=${date}`
    );

    expect(res.statusCode).toBe(404);
    expect(res.body).toMatchObject({ success: false });
  });
});

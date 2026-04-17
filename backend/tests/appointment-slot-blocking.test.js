const request = require("supertest");
const app = require("../app");
const User = require("../models/User");

describe("Appointment slot blocking", () => {
  it("prevents double-booking the same vet/date/timeSlot", async () => {
    // Create an approved vet
    const vet = await User.create({
      name: "Dr Vet",
      email: "vet@example.com",
      password: "password123",
      role: "veterinary",
      isApproved: true,
      vetInfo: {
        clinicName: "Test Clinic",
      },
    });

    // Register + login a customer
    await request(app).post("/api/auth/register").send({
      name: "Slot Customer",
      email: "slotcustomer@example.com",
      password: "password123",
      password2: "password123",
      role: "customer",
    });

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "slotcustomer@example.com",
      password: "password123",
    });

    const token = loginRes.body.token;
    expect(typeof token).toBe("string");

    const bookingBody = {
      veterinary: String(vet._id),
      petName: "Buddy",
      petType: "dog",
      date: "2026-04-16",
      timeSlot: "09:00-10:00",
      reason: "Checkup",
    };

    const first = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${token}`)
      .send(bookingBody);

    expect(first.statusCode).toBe(201);
    expect(first.body.success).toBe(true);

    const second = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...bookingBody, petName: "Buddy2" });

    expect(second.statusCode).toBe(400);
    expect(second.body.success).toBe(false);
    expect(String(second.body.message)).toMatch(/already booked/i);
  });
});

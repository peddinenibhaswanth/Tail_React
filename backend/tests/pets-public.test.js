const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");

const User = require("../models/User");
const Pet = require("../models/Pet");

describe("Public pets endpoints", () => {
  it("GET /api/pets returns an empty list initially", async () => {
    const res = await request(app).get("/api/pets");
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ success: true });
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/pets returns only available pets by default", async () => {
    const shelter = await User.create({
      name: "Shelter",
      email: "shelter@example.com",
      password: "Password123!",
      role: "organization",
      isApproved: true,
      organizationInfo: { orgName: "Org" },
    });

    await Pet.create({
      name: "Buddy",
      species: "dog",
      breed: "Mixed",
      age: { value: 2, unit: "years" },
      gender: "male",
      size: "medium",
      color: "brown",
      description: "Friendly",
      mainImage: "buddy.jpg",
      images: ["buddy.jpg"],
      status: "available",
      shelter: shelter._id,
    });

    await Pet.create({
      name: "Adopted Pet",
      species: "cat",
      breed: "Mixed",
      age: { value: 3, unit: "years" },
      gender: "female",
      size: "small",
      color: "black",
      description: "Already adopted",
      mainImage: "adopted.jpg",
      images: ["adopted.jpg"],
      status: "adopted",
      shelter: shelter._id,
    });

    const res = await request(app).get("/api/pets");
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ success: true });
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0]).toHaveProperty("name", "Buddy");
  });

  it("GET /api/pets/search can filter by species", async () => {
    const shelter = await User.create({
      name: "Shelter 2",
      email: "shelter2@example.com",
      password: "Password123!",
      role: "organization",
      isApproved: true,
      organizationInfo: { orgName: "Org2" },
    });

    await Pet.create({
      name: "Rabbit",
      species: "rabbit",
      breed: "Mini",
      age: { value: 1, unit: "years" },
      gender: "female",
      size: "small",
      color: "white",
      description: "Cute",
      mainImage: "rabbit.jpg",
      images: ["rabbit.jpg"],
      status: "available",
      shelter: shelter._id,
    });

    const res = await request(app).get("/api/pets/search?species=rabbit");
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ success: true });
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0]).toHaveProperty("species", "rabbit");
  });

  it("GET /api/pets/:id returns 404 for a missing pet", async () => {
    const missingId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/pets/${missingId}`);
    expect(res.statusCode).toBe(404);
    expect(res.body).toMatchObject({ success: false });
  });
});

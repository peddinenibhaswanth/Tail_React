const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");

const User = require("../models/User");
const Product = require("../models/Product");

describe("Public products endpoints", () => {
  it("GET /api/products returns an empty list initially", async () => {
    const res = await request(app).get("/api/products");
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ success: true });
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/products returns seeded products", async () => {
    const seller = await User.create({
      name: "Seller",
      email: "seller@example.com",
      password: "Password123!",
      role: "seller",
      isApproved: true,
      sellerInfo: { businessName: "Shop" },
    });

    await Product.create({
      name: "Durable Dog Chew Toy",
      description: "A long-lasting toy",
      price: 15.99,
      category: "toys",
      petType: "dog",
      stock: 10,
      seller: seller._id,
    });

    const res = await request(app).get("/api/products");
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ success: true });
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0]).toHaveProperty("name", "Durable Dog Chew Toy");
  });

  it("GET /api/products/:id returns 404 for a missing product", async () => {
    const missingId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/products/${missingId}`);
    expect(res.statusCode).toBe(404);
    expect(res.body).toMatchObject({ success: false });
  });

  it("GET /api/products/:id returns product details (with reviews array)", async () => {
    const seller = await User.create({
      name: "Seller 2",
      email: "seller2@example.com",
      password: "Password123!",
      role: "seller",
      isApproved: true,
      sellerInfo: { businessName: "Shop2" },
    });

    const product = await Product.create({
      name: "Cat Food",
      description: "Tasty",
      price: 9.5,
      category: "food",
      petType: "cat",
      stock: 5,
      seller: seller._id,
    });

    const res = await request(app).get(`/api/products/${product._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ success: true });
    expect(res.body.data).toHaveProperty("_id", String(product._id));
    expect(res.body.data).toHaveProperty("reviews");
    expect(Array.isArray(res.body.data.reviews)).toBe(true);
  });
});

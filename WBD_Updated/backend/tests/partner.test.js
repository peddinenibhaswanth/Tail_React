const request = require("supertest");
const app = require("../app");

const User = require("../models/User");
const Product = require("../models/Product");
const Pet = require("../models/Pet");

describe("Partner API (x-api-key)", () => {
  it("rejects partner products without API key", async () => {
    const res = await request(app).get("/api/partner/products");
    expect(res.statusCode).toBe(401);
    expect(res.body).toMatchObject({ success: false });
  });

  it("allows partner products with valid API key", async () => {
    const seller = await User.create({
      name: "Seller",
      email: "partner-seller@example.com",
      password: "Password123!",
      role: "seller",
      isApproved: true,
      sellerInfo: { businessName: "PartnerShop" },
    });

    await Product.create({
      name: "Partner Product",
      description: "Desc",
      price: 20,
      category: "other",
      petType: "all",
      stock: 1,
      seller: seller._id,
    });

    const res = await request(app)
      .get("/api/partner/products")
      .set("x-api-key", "test-partner-key");

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ success: true });
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0]).toHaveProperty("name", "Partner Product");
  });

  it("allows partner pets with valid API key", async () => {
    const shelter = await User.create({
      name: "Shelter",
      email: "partner-shelter@example.com",
      password: "Password123!",
      role: "organization",
      isApproved: true,
      organizationInfo: { orgName: "PartnerOrg" },
    });

    await Pet.create({
      name: "Partner Pet",
      species: "dog",
      breed: "Mixed",
      age: { value: 1, unit: "years" },
      gender: "male",
      size: "small",
      color: "tan",
      description: "Desc",
      mainImage: "p.jpg",
      images: ["p.jpg"],
      status: "available",
      shelter: shelter._id,
    });

    const res = await request(app)
      .get("/api/partner/pets")
      .set("x-api-key", "test-partner-key");

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ success: true });
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0]).toHaveProperty("name", "Partner Pet");
  });
});

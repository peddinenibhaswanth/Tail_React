const mongoose = require("mongoose");
require("dotenv").config();

const Product = require("../models/Product");
const User = require("../models/User");

function getEnvInt(name, fallback) {
  const raw = process.env[name];
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Missing MONGODB_URI in env");
    process.exit(2);
  }

  const productsCount = getEnvInt("SEED_PRODUCTS", 4000);
  const vetsCount = getEnvInt("SEED_VETS", 200);
  const reset = String(process.env.SEED_RESET || "true").toLowerCase() === "true";

  await mongoose.connect(uri);

  try {
    if (reset) {
      await Product.deleteMany({});
      await User.deleteMany({ email: { $in: ["benchmark-seller@local", "benchmark-admin@local"] } });
      await User.deleteMany({ email: { $regex: /^benchmark-vet\d+@local$/ } });
    }

    const seller = await User.findOneAndUpdate(
      { email: "benchmark-seller@local" },
      {
        $setOnInsert: {
          name: "Benchmark Seller",
          email: "benchmark-seller@local",
          password: "$2a$10$wHCEqCkXlHT4XbNwZcP0IuH9QqYc9q9Nw9Yv7oQ0sK4m0sXGm3k9C", // 'password123' (bcrypt)
          role: "seller",
          isApproved: true,
          sellerInfo: {
            businessName: "Benchmark Store",
            businessPhone: "0000000000",
          },
        },
      },
      { new: true, upsert: true }
    );

    await User.findOneAndUpdate(
      { email: "benchmark-admin@local" },
      {
        $setOnInsert: {
          name: "Benchmark Admin",
          email: "benchmark-admin@local",
          password: "$2a$10$wHCEqCkXlHT4XbNwZcP0IuH9QqYc9q9Nw9Yv7oQ0sK4m0sXGm3k9C", // 'password123'
          role: "admin",
          isApproved: true,
        },
      },
      { new: true, upsert: true }
    );

    const vetDocs = [];
    for (let i = 1; i <= vetsCount; i++) {
      vetDocs.push({
        updateOne: {
          filter: { email: `benchmark-vet${i}@local` },
          update: {
            $setOnInsert: {
              name: `Benchmark Vet ${i}`,
              email: `benchmark-vet${i}@local`,
              password: "$2a$10$wHCEqCkXlHT4XbNwZcP0IuH9QqYc9q9Nw9Yv7oQ0sK4m0sXGm3k9C",
              role: "veterinary",
              isApproved: true,
              vetInfo: {
                clinicName: `Benchmark Clinic ${i}`,
                clinicAddress: {
                  line1: "Main Road",
                  city: "Pune",
                  state: "MH",
                  pincode: "411001",
                  country: "India",
                },
                availableDays: ["Monday", "Tuesday", "Wednesday"],
                availableTimeSlots: [{ start: "10:00", end: "11:00" }],
                coordinates: { type: "Point", coordinates: [73.8567, 18.5204] },
              },
            },
          },
          upsert: true,
        },
      });
    }

    if (vetDocs.length) {
      await User.bulkWrite(vetDocs, { ordered: false });
    }

    const categories = ["food", "toys", "accessories", "grooming", "health", "training", "other"];
    const petTypes = ["dog", "cat", "bird", "rabbit", "all", "other"];

    if (productsCount > 0) {
      const docs = [];
      for (let i = 1; i <= productsCount; i++) {
        const category = categories[i % categories.length];
        const petType = petTypes[i % petTypes.length];
        const featured = i % 10 === 0;
        const onSale = i % 7 === 0;
        const price = 50 + (i % 200);

        docs.push({
          insertOne: {
            document: {
              name: `Benchmark Product ${i} ${category} ${petType}`,
              description: `Benchmark description for product ${i}. Great for ${petType}. ${category} ${category} ${category}.`,
              price,
              category,
              petType,
              stock: 100,
              seller: seller._id,
              featured,
              onSale,
              salePrice: onSale ? Math.max(1, price * 0.9) : undefined,
              discountPercent: onSale ? 10 : 0,
              createdAt: new Date(Date.now() - i * 1000),
              updatedAt: new Date(),
            },
          },
        });
      }

      for (const part of chunk(docs, 500)) {
        // bulkWrite avoids per-document mongoose overhead
        await Product.bulkWrite(part, { ordered: false });
      }
    }

    const finalCounts = {
      products: await Product.countDocuments(),
      vets: await User.countDocuments({ role: "veterinary", isApproved: true }),
    };

    console.log("Seeded benchmark data successfully:");
    console.log(JSON.stringify(finalCounts, null, 2));
  } finally {
    await mongoose.connection.close();
  }
}

main().catch((err) => {
  console.error(err && err.message ? err.message : err);
  process.exit(1);
});

/**
 * Migration Script: Convert old plain-text clinicAddress to structured format
 * and geocode addresses using Nominatim
 * 
 * Run: node scripts/migrateVetAddresses.js
 * 
 * This script:
 * 1. Finds all vets with old string clinicAddress
 * 2. Attempts to parse and geocode each address
 * 3. Updates to new structured format
 * 4. Reports successes and failures
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const { geocodeAddress, buildFullAddress } = require("../services/geocodingService");

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/tail-treasures";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function migrate() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Find vets that have old string clinicAddress or no coordinates
    const vets = await User.find({
      role: "veterinary",
      $or: [
        { "vetInfo.clinicAddress": { $type: "string" } },
        { "vetInfo.coordinates": { $exists: false } },
        { "vetInfo.coordinates.coordinates": { $eq: [0, 0] } },
      ],
    });

    console.log(`Found ${vets.length} vets to migrate`);

    const results = { success: 0, failed: 0, skipped: 0, details: [] };

    for (const vet of vets) {
      const oldAddress = vet.vetInfo?.clinicAddress;

      // If clinicAddress is already an object (already migrated), skip
      if (typeof oldAddress === "object" && oldAddress !== null && oldAddress.city) {
        console.log(`SKIP: ${vet.name} - already has structured address`);
        results.skipped++;
        continue;
      }

      // If it's a string, try to parse it
      const addressStr = typeof oldAddress === "string" ? oldAddress : "";

      if (!addressStr) {
        console.log(`SKIP: ${vet.name} - no address to migrate`);
        results.skipped++;
        continue;
      }

      console.log(`Processing: ${vet.name} - "${addressStr}"`);

      // Try to parse the string into structured format
      // Simple heuristic: split by commas, last parts might be city/state/pincode
      const parts = addressStr.split(",").map((p) => p.trim());
      const structuredAddress = {
        line1: parts[0] || addressStr,
        line2: parts.length > 3 ? parts[1] : "",
        city: parts.length >= 3 ? parts[parts.length - 2] : parts.length >= 2 ? parts[1] : "",
        state: parts.length >= 4 ? parts[parts.length - 1] : "",
        pincode: "",
        country: "India",
      };

      // Try to extract pincode (6 digits for India)
      const pincodeMatch = addressStr.match(/\b(\d{6})\b/);
      if (pincodeMatch) {
        structuredAddress.pincode = pincodeMatch[1];
      }

      // Try geocoding
      const geoResult = await geocodeAddress(structuredAddress);

      // Rate limit: wait 1.5 seconds between requests
      await sleep(1500);

      const fullAddress = buildFullAddress(structuredAddress);

      const updateData = {
        "vetInfo.clinicAddress": structuredAddress,
        "vetInfo.fullAddress": fullAddress,
      };

      if (geoResult) {
        updateData["vetInfo.coordinates"] = {
          type: "Point",
          coordinates: [geoResult.lng, geoResult.lat],
        };
        console.log(`  ✓ Geocoded: [${geoResult.lat}, ${geoResult.lng}]`);
        results.success++;
      } else {
        // Set default coordinates (0, 0) - will show as "location unknown"
        updateData["vetInfo.coordinates"] = {
          type: "Point",
          coordinates: [0, 0],
        };
        console.log(`  ✗ Geocoding FAILED - flagged for manual review`);
        results.failed++;
      }

      // Set default consultation modes if not set
      if (!vet.vetInfo?.consultationModes || vet.vetInfo.consultationModes.length === 0) {
        updateData["vetInfo.consultationModes"] = ["in-clinic"];
        const fee = vet.vetInfo?.consultationFee || 500;
        updateData["vetInfo.consultationFees"] = {
          "in-clinic": fee,
          "home-visit": 0,
          "video-consultation": 0,
        };
      }

      await User.findByIdAndUpdate(vet._id, { $set: updateData });

      results.details.push({
        name: vet.name,
        email: vet.email,
        oldAddress: addressStr,
        newAddress: structuredAddress,
        geocoded: !!geoResult,
        coordinates: geoResult ? [geoResult.lat, geoResult.lng] : null,
      });
    }

    console.log("\n=== MIGRATION COMPLETE ===");
    console.log(`Success (geocoded): ${results.success}`);
    console.log(`Failed (needs manual): ${results.failed}`);
    console.log(`Skipped: ${results.skipped}`);

    if (results.failed > 0) {
      console.log("\nFailed vets (need manual address update):");
      results.details
        .filter((d) => !d.geocoded)
        .forEach((d) => {
          console.log(`  - ${d.name} (${d.email}): "${d.oldAddress}"`);
        });
    }

    process.exit(0);
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
}

migrate();

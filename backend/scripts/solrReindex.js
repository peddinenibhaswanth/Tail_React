const mongoose = require("mongoose");

const connectDB = require("../config/db");
const Product = require("../models/Product");
const Pet = require("../models/Pet");
const {
  isSolrEnabled,
  solrAddDocuments,
  solrDeleteAll,
} = require("../services/solrService");

function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) {
    out.push(array.slice(i, i + size));
  }
  return out;
}

function productToSolrDoc(p) {
  return {
    id: `product:${p._id}`,
    entityType_s: "product",
    entityId_s: String(p._id),
    name_t: p.name,
    description_t: p.description || "",
  };
}

function petToSolrDoc(pet) {
  return {
    id: `pet:${pet._id}`,
    entityType_s: "pet",
    entityId_s: String(pet._id),
    name_t: pet.name,
    description_t: pet.description || "",
  };
}

async function main() {
  if (!isSolrEnabled()) {
    console.error(
      "SOLR is not enabled. Set SOLR_ENABLED=true and SOLR_URL before running solr:reindex."
    );
    process.exit(2);
  }

  await connectDB();

  const [products, pets] = await Promise.all([
    Product.find({}).select("name description").lean(),
    Pet.find({}).select("name description").lean(),
  ]);

  const docs = [
    ...products.map(productToSolrDoc),
    ...pets.map(petToSolrDoc),
  ];

  console.log(`Loaded from MongoDB: ${products.length} products, ${pets.length} pets`);
  console.log(`Indexing into Solr: ${docs.length} docs`);

  await solrDeleteAll({ commit: true });

  const batches = chunk(docs, 250);
  for (let i = 0; i < batches.length; i += 1) {
    await solrAddDocuments(batches[i], { commit: false });
    console.log(`Indexed batch ${i + 1}/${batches.length}`);
  }

  // Final commit
  await solrAddDocuments([], { commit: true });
  console.log("Done. Solr index is ready.");

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err.message || err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});

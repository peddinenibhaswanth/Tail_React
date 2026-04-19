const Product = require("../models/Product");
const Pet = require("../models/Pet");
const { isSolrEnabled, solrSelect } = require("./solrService");

const normalizeQuery = (q) => {
  const s = String(q || "").trim();
  return s.length ? s : null;
};

const searchWithMongoText = async ({ q, limit = 20 }) => {
  // Split budget between products and pets
  const perType = Math.max(1, Math.floor(limit / 2));

  const [products, pets] = await Promise.all([
    Product.find(
      { $text: { $search: q } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(perType)
      .select("name description price images category petType")
      .lean(),

    Pet.find(
      { $text: { $search: q } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(perType)
      .select("name description species breed age gender images adoptionStatus")
      .lean(),
  ]);

  const results = [];

  for (const p of products) {
    results.push({
      entityType: "product",
      entityId: String(p._id),
      score: p.score ?? null,
      preview: {
        name: p.name,
        description: p.description,
      },
    });
  }

  for (const pet of pets) {
    results.push({
      entityType: "pet",
      entityId: String(pet._id),
      score: pet.score ?? null,
      preview: {
        name: pet.name,
        description: pet.description,
      },
    });
  }

  // Keep highest scores first when available
  results.sort((a, b) => (Number(b.score || 0) - Number(a.score || 0)));

  return results.slice(0, limit);
};

const searchWithSolr = async ({ q, limit = 20 }) => {
  const data = await solrSelect({ q, rows: limit });
  const docs = data?.response?.docs || [];

  return docs
    .map((d) => ({
      entityType: d.entityType_s,
      entityId: d.entityId_s,
      score: d.score ?? null,
      preview: {
        name: d.name_t,
      },
    }))
    .filter((r) => r.entityType && r.entityId);
};

const search = async ({ q, limit = 20 }) => {
  const query = normalizeQuery(q);
  if (!query) return [];

  const safeLimit = Math.max(1, Math.min(50, Number(limit) || 20));

  if (isSolrEnabled()) {
    try {
      const solrResults = await searchWithSolr({ q: query, limit: safeLimit });
      // If Solr is empty/unindexed, fallback to Mongo so the feature still works.
      if (solrResults.length) return solrResults;
    } catch {
      // Ignore Solr errors and fallback to Mongo
    }
  }

  return searchWithMongoText({ q: query, limit: safeLimit });
};

module.exports = {
  search,
};

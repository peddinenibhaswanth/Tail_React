const searchService = require("../services/searchService");

const globalSearch = async (req, res) => {
  try {
    const { q, limit } = req.query;
    const results = await searchService.search({ q, limit });

    return res.json({
      success: true,
      query: String(q || ""),
      total: results.length,
      data: results,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Search failed",
      error: error.message,
    });
  }
};

module.exports = {
  globalSearch,
};

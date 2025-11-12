const Pet = require("../models/Pet");
const AdoptionApplication = require("../models/AdoptionApplication");
const { deleteFiles } = require("../middleware/upload");

// @desc    Get all pets with filters and pagination
// @route   GET /api/pets
// @access  Public
exports.getAllPets = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      species,
      breed,
      gender,
      size,
      age,
      status,
      shelter,
      search,
      sort = "-createdAt",
    } = req.query;

    // Build query
    const query = {};

    // Filters
    if (species) query.species = species;
    if (breed) query.breed = new RegExp(breed, "i");
    if (gender) query.gender = gender;
    if (size) query.size = size;
    if (status) query.status = status;
    else query.status = "available"; // Default to available pets
    if (shelter) query.shelter = shelter;

    // Age range filter
    if (age) {
      switch (age) {
        case "young":
          query.age = { $lt: 1 };
          break;
        case "adult":
          query.age = { $gte: 1, $lt: 7 };
          break;
        case "senior":
          query.age = { $gte: 7 };
          break;
      }
    }

    // Search by name, species, breed, description
    if (search) {
      query.$text = { $search: search };
    }

    // Execute query with pagination
    const pets = await Pet.find(query)
      .populate("shelter", "name email phoneNumber address")
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Get total count for pagination
    const count = await Pet.countDocuments(query);

    res.json({
      success: true,
      data: pets,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalPets: count,
        perPage: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching pets",
      error: error.message,
    });
  }
};

// @desc    Get single pet by ID
// @route   GET /api/pets/:id
// @access  Public
exports.getPetById = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id).populate(
      "shelter",
      "name email phoneNumber address profilePicture"
    );

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    res.json({
      success: true,
      data: pet,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching pet",
      error: error.message,
    });
  }
};

// @desc    Create new pet
// @route   POST /api/pets
// @access  Private (Admin/Co-Admin)
exports.createPet = async (req, res) => {
  try {
    const petData = {
      ...req.body,
      shelter: req.user._id,
    };

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      petData.images = req.files.map((file) => file.filename);
      petData.mainImage = req.files[0].filename;
    }

    const pet = await Pet.create(petData);

    res.status(201).json({
      success: true,
      message: "Pet created successfully",
      data: pet,
    });
  } catch (error) {
    // Delete uploaded files if pet creation fails
    if (req.files && req.files.length > 0) {
      const filenames = req.files.map((file) => `pets/${file.filename}`);
      deleteFiles(filenames);
    }

    res.status(400).json({
      success: false,
      message: "Error creating pet",
      error: error.message,
    });
  }
};

// @desc    Update pet
// @route   PUT /api/pets/:id
// @access  Private (Admin/Co-Admin)
exports.updatePet = async (req, res) => {
  try {
    let pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      // Delete old images
      if (pet.images && pet.images.length > 0) {
        const oldImages = pet.images.map((img) => `pets/${img}`);
        deleteFiles(oldImages);
      }

      req.body.images = req.files.map((file) => file.filename);
      req.body.mainImage = req.files[0].filename;
    }

    pet = await Pet.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: "Pet updated successfully",
      data: pet,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating pet",
      error: error.message,
    });
  }
};

// @desc    Delete pet
// @route   DELETE /api/pets/:id
// @access  Private (Admin/Co-Admin)
exports.deletePet = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    // Check if pet has pending applications
    const pendingApplications = await AdoptionApplication.countDocuments({
      pet: req.params.id,
      status: { $in: ["pending", "under_review", "approved"] },
    });

    if (pendingApplications > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete pet with pending adoption applications",
      });
    }

    // Delete associated images
    if (pet.images && pet.images.length > 0) {
      const imagePaths = pet.images.map((img) => `pets/${img}`);
      deleteFiles(imagePaths);
    }

    await pet.deleteOne();

    res.json({
      success: true,
      message: "Pet deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting pet",
      error: error.message,
    });
  }
};

// @desc    Update pet status
// @route   PATCH /api/pets/:id/status
// @access  Private (Admin/Co-Admin)
exports.updatePetStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (
      !["available", "pending", "adopted", "not_available"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const pet = await Pet.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    res.json({
      success: true,
      message: "Pet status updated successfully",
      data: pet,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating pet status",
      error: error.message,
    });
  }
};

// @desc    Get featured/adoptable pets
// @route   GET /api/pets/featured
// @access  Public
exports.getFeaturedPets = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;

    const pets = await Pet.find({
      status: "available",
      "healthInfo.vaccinated": true,
    })
      .populate("shelter", "name")
      .sort("-createdAt")
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: pets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching featured pets",
      error: error.message,
    });
  }
};

// @desc    Search pets
// @route   GET /api/pets/search
// @access  Public
exports.searchPets = async (req, res) => {
  try {
    const { q, species, breed, status = "available" } = req.query;

    const query = { status };

    if (q) {
      query.$or = [
        { name: new RegExp(q, "i") },
        { breed: new RegExp(q, "i") },
        { description: new RegExp(q, "i") },
      ];
    }
    if (species) query.species = species;
    if (breed) query.breed = new RegExp(breed, "i");

    const pets = await Pet.find(query)
      .populate("shelter", "name")
      .sort("-createdAt")
      .limit(20)
      .lean();

    res.json({
      success: true,
      data: pets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error searching pets",
      error: error.message,
    });
  }
};

// @desc    Get breeds by species type
// @route   GET /api/pets/breeds
// @access  Public
exports.getBreedsByType = async (req, res) => {
  try {
    const { species } = req.query;

    const query = species ? { species } : {};

    const breeds = await Pet.distinct("breed", query);

    res.json({
      success: true,
      data: breeds.filter((b) => b).sort(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching breeds",
      error: error.message,
    });
  }
};

// @desc    Update adoption status
// @route   PATCH /api/pets/:id/adoption-status
// @access  Private (Admin/Co-Admin)
exports.updateAdoptionStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (
      !["available", "pending", "adopted", "not_available"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid adoption status value",
      });
    }

    const pet = await Pet.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: "Pet not found",
      });
    }

    res.json({
      success: true,
      message: "Adoption status updated successfully",
      data: pet,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating adoption status",
      error: error.message,
    });
  }
};

// @desc    Get pet statistics
// @route   GET /api/pets/stats
// @access  Private (Admin/Co-Admin)
exports.getPetStats = async (req, res) => {
  try {
    const stats = await Pet.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const speciesStats = await Pet.aggregate([
      {
        $match: { status: "available" },
      },
      {
        $group: {
          _id: "$species",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        byStatus: stats,
        bySpecies: speciesStats,
        total: await Pet.countDocuments(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching pet statistics",
      error: error.message,
    });
  }
};

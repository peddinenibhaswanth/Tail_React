const express = require("express");
const router = express.Router();
const petController = require("../controllers/petController");
const { isAuthenticated, isAdminOrCoAdmin } = require("../middleware/auth");
const { uploadPetImages } = require("../middleware/upload");
const AdoptionApplication = require("../models/AdoptionApplication");
const Pet = require("../models/Pet");

// Public routes
router.get("/", petController.getAllPets);
router.get("/search", petController.searchPets);
router.get("/featured", petController.getFeaturedPets);
router.get("/breeds", petController.getBreedsByType);

// Get user's applications (must come before /:id)
router.get("/applications/my", isAuthenticated, async (req, res) => {
  try {
    const applications = await AdoptionApplication.find({
      applicant: req.user._id,
    })
      .populate("pet", "name species breed mainImage status")
      .sort("-createdAt");

    res.json({ success: true, data: applications });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching applications",
      error: error.message,
    });
  }
});

// This must come after /applications/my
router.get("/:id", petController.getPetById);

// Adoption application route (must be authenticated)
router.post("/adopt", isAuthenticated, async (req, res) => {
  try {
    const {
      pet,
      housingType,
      hasYard,
      otherPets,
      experience,
      reason,
      employmentStatus,
      references,
    } = req.body;

    // Check if pet exists and is available
    const petDoc = await Pet.findById(pet);
    if (!petDoc) {
      return res.status(404).json({ success: false, message: "Pet not found" });
    }
    if (petDoc.status !== "available") {
      return res.status(400).json({
        success: false,
        message: "This pet is not available for adoption",
      });
    }

    // Check if user already has a pending application for this pet
    const existingApplication = await AdoptionApplication.findOne({
      pet,
      applicant: req.user._id,
      status: { $in: ["pending", "under_review"] },
    });
    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending application for this pet",
      });
    }

    // Create simplified application
    const application = await AdoptionApplication.create({
      pet,
      applicant: req.user._id,
      personalInfo: {
        fullName: req.user.name,
        age: 25, // Default
        occupation: employmentStatus || "Not specified",
        phoneNumber: req.user.phone || "Not provided",
      },
      address: {
        street: req.user.address?.street || "Not provided",
        city: req.user.address?.city || "Not provided",
        state: req.user.address?.state || "Not provided",
        zipCode: req.user.address?.zipCode || "00000",
        country: "India",
      },
      livingSituation: {
        homeType: (housingType || "apartment").toLowerCase(),
        homeOwnership: "rent",
        hasYard: hasYard || false,
        landlordPermission: true,
      },
      household: {
        numberOfAdults: 1,
        numberOfChildren: 0,
        allMembersAgree: true,
      },
      petExperience: {
        hadPetsBefore: !!experience,
        currentPets: !!otherPets,
        currentPetsDetails: otherPets || "",
        petCareExperience: experience || "No prior experience",
      },
      carePlans: {
        dailyCareTime: "Several hours",
        exercisePlan: "Daily walks and play",
        aloneTimePerDay: "4-8 hours",
        vacationPlan: "Pet sitter or family care",
        emergencyPlan: "Nearby vet clinic",
      },
      additionalInfo: {
        whyAdopt: reason || "Looking for a companion",
      },
      references: references
        ? [{ name: "Reference", relationship: "Friend", phone: references }]
        : [],
      status: "pending",
    });

    // Update pet status to pending
    await Pet.findByIdAndUpdate(pet, { status: "pending" });

    res.status(201).json({
      success: true,
      message: "Adoption application submitted successfully",
      data: application,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error submitting application",
      error: error.message,
    });
  }
});

// Protected routes (require authentication)
router.post(
  "/",
  isAuthenticated,
  isAdminOrCoAdmin,
  uploadPetImages,
  petController.createPet
);
router.put(
  "/:id",
  isAuthenticated,
  isAdminOrCoAdmin,
  uploadPetImages,
  petController.updatePet
);
router.delete(
  "/:id",
  isAuthenticated,
  isAdminOrCoAdmin,
  petController.deletePet
);

// Adoption status routes
router.patch(
  "/:id/adoption-status",
  isAuthenticated,
  isAdminOrCoAdmin,
  petController.updateAdoptionStatus
);

module.exports = router;

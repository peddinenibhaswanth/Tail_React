const express = require("express");
const router = express.Router();
const petController = require("../controllers/petController");
const { isAuthenticated, isAdminOrCoAdmin, isOrganizationOrAdmin } = require("../middleware/auth");
const { uploadPetImages } = require("../middleware/upload");
const { cacheResponse } = require("../middleware/cache");
const { uploadRequestFilesToCloudinary } = require("../middleware/cloudinaryUpload");
const { validatePet } = require("../middleware/validators");
const AdoptionApplication = require("../models/AdoptionApplication");
const Pet = require("../models/Pet");
const { createNotification } = require("../controllers/notificationController");

/**
 * @swagger
 * tags:
 *   name: Pets
 *   description: Pet adoption and management
 */

// Public routes
/**
 * @swagger
 * /api/pets:
 *   get:
 *     summary: Retrieve a list of all pets available for adoption
 *     tags: [Pets]
 *     responses:
 *       200:
 *         description: A list of pets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Pet'
 */
router.get(
  "/",
  cacheResponse({ namespace: "pets", ttlSeconds: 180 }),
  petController.getAllPets
);

/**
 * @swagger
 * /api/pets/search:
 *   get:
 *     summary: Search for pets based on various criteria
 *     tags: [Pets]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Type of pet (e.g., Dog, Cat)
 *       - in: query
 *         name: breed
 *         schema:
 *           type: string
 *         description: Breed of the pet
 *       - in: query
 *         name: age
 *         schema:
 *           type: string
 *         description: Age range of the pet
 *       - in: query
 *         name: size
 *         schema:
 *           type: string
 *         description: Size of the pet
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *         description: Gender of the pet
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Location to search for pets
 *     responses:
 *       200:
 *         description: A list of matching pets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Pet'
 */
router.get(
  "/search",
  cacheResponse({ namespace: "pets", ttlSeconds: 180 }),
  petController.searchPets
);

/**
 * @swagger
 * /api/pets/featured:
 *   get:
 *     summary: Get a list of featured pets
 *     tags: [Pets]
 *     responses:
 *       200:
 *         description: A list of featured pets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Pet'
 */
router.get(
  "/featured",
  cacheResponse({ namespace: "pets", ttlSeconds: 300 }),
  petController.getFeaturedPets
);

/**
 * @swagger
 * /api/pets/breeds:
 *   get:
 *     summary: Get a list of breeds for a given pet type
 *     tags: [Pets]
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *         description: The type of pet (e.g., Dog, Cat)
 *     responses:
 *       200:
 *         description: A list of breed strings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */
router.get(
  "/breeds",
  cacheResponse({ namespace: "pets", ttlSeconds: 600 }),
  petController.getBreedsByType
);

/**
 * @swagger
 * /api/pets/my-pets:
 *   get:
 *     summary: Get pets belonging to the authenticated organization or all pets for admin
 *     tags: [Pets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of pets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Pet'
 *       403:
 *         description: Access denied
 */
router.get("/my-pets", isAuthenticated, async (req, res) => {
  try {
    if (req.user.role !== "organization" && req.user.role !== "admin" && req.user.role !== "co-admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const query = req.user.role === "organization"
      ? { shelter: req.user._id }
      : {};

    const pets = await Pet.find(query)
      .populate("shelter", "name email")
      .sort("-createdAt")
      .lean();

    res.json({ success: true, data: pets });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching pets",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/pets/applications/my:
 *   get:
 *     summary: Get all adoption applications submitted by the authenticated user
 *     tags: [Pets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of the user's adoption applications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AdoptionApplication'
 */
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

/**
 * @swagger
 * /api/pets/{id}:
 *   get:
 *     summary: Get a single pet by ID
 *     tags: [Pets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the pet
 *     responses:
 *       200:
 *         description: A single pet object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pet'
 *       404:
 *         description: Pet not found
 */
router.get(
  "/:id",
  cacheResponse({ namespace: "pets", ttlSeconds: 300 }),
  petController.getPetById
);

/**
 * @swagger
 * /api/pets/adopt:
 *   post:
 *     summary: Submit an adoption application for a pet
 *     tags: [Pets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pet:
 *                 type: string
 *                 description: The ID of the pet to adopt
 *               housingType:
 *                 type: string
 *               hasYard:
 *                 type: boolean
 *               otherPets:
 *                 type: string
 *               experience:
 *                 type: string
 *               reason:
 *                 type: string
 *               employmentStatus:
 *                 type: string
 *               references:
 *                 type: string
 *     responses:
 *       201:
 *         description: Adoption application submitted successfully
 *       400:
 *         description: Bad request (e.g., pet not available, pending application exists)
 *       404:
 *         description: Pet not found
 */
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

    // Notify customer about adoption submission
    await createNotification({
      recipient: req.user._id,
      type: "adoption_submitted",
      title: "Adoption Application Submitted",
      message: `Your adoption application for ${petDoc.name} has been submitted successfully and is pending review`,
      relatedModel: "AdoptionApplication",
      relatedId: application._id,
      link: `/applications`,
    });

    // Notify the organization/shelter about new application
    if (petDoc.shelter) {
      await createNotification({
        recipient: petDoc.shelter,
        type: "adoption_submitted",
        title: "New Adoption Application",
        message: `A new adoption application has been submitted for ${petDoc.name}`,
        relatedModel: "AdoptionApplication",
        relatedId: application._id,
        link: `/organization/applications`,
      });
    }

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

/**
 * @swagger
 * /api/pets:
 *   post:
 *     summary: Create a new pet listing (Organization/Admin only)
 *     tags: [Pets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/PetCreateRequest'
 *     responses:
 *       201:
 *         description: Pet created successfully
 *       400:
 *         description: Validation error (missing required fields or images)
 */
router.post(
  "/",
  isAuthenticated,
  isOrganizationOrAdmin,
  uploadPetImages,
  uploadRequestFilesToCloudinary({ folder: "pets" }),
  validatePet,
  petController.createPet
);

/**
 * @swagger
 * /api/pets/{id}:
 *   put:
 *     summary: Update an existing pet listing (Organization/Admin only)
 *     tags: [Pets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the pet to update
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/PetUpdateRequest'
 *     responses:
 *       200:
 *         description: Pet updated successfully
 *   delete:
 *     summary: Delete a pet listing (Organization/Admin only)
 *     tags: [Pets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the pet to delete
 *     responses:
 *       200:
 *         description: Pet deleted successfully
 */
router.put(
  "/:id",
  isAuthenticated,
  isOrganizationOrAdmin,
  uploadPetImages,
  uploadRequestFilesToCloudinary({ folder: "pets" }),
  petController.updatePet
);
router.delete(
  "/:id",
  isAuthenticated,
  isOrganizationOrAdmin,
  petController.deletePet
);

/**
 * @swagger
 * /api/pets/{id}/adoption-status:
 *   patch:
 *     summary: Update the adoption status of a pet (Admin/Co-Admin only)
 *     tags: [Pets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the pet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [available, pending, adopted, withdrawn]
 *                 description: The new adoption status
 *     responses:
 *       200:
 *         description: Adoption status updated successfully
 */
router.patch(
  "/:id/adoption-status",
  isAuthenticated,
  isAdminOrCoAdmin,
  petController.updateAdoptionStatus
);

module.exports = router;

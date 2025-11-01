const express = require("express");
const router = express.Router();
const petController = require("../controllers/petController");
const { isAuthenticated, isAdminOrCoAdmin } = require("../middleware/auth");
const { petUpload } = require("../middleware/upload");

// Public routes
router.get("/", petController.getAllPets);
router.get("/search", petController.searchPets);
router.get("/featured", petController.getFeaturedPets);
router.get("/breeds", petController.getBreedsByType);
router.get("/:id", petController.getPetById);

// Protected routes (require authentication)
router.post(
  "/",
  isAuthenticated,
  isAdminOrCoAdmin,
  petUpload,
  petController.createPet
);
router.put(
  "/:id",
  isAuthenticated,
  isAdminOrCoAdmin,
  petUpload,
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

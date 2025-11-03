const mongoose = require("mongoose");

const adoptionApplicationSchema = new mongoose.Schema(
  {
    // Reference to the pet being adopted
    pet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pet",
      required: true,
    },

    // Reference to the applicant (customer)
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Personal Information
    personalInfo: {
      fullName: {
        type: String,
        required: true,
        trim: true,
      },
      age: {
        type: Number,
        required: true,
        min: 18,
      },
      occupation: {
        type: String,
        required: true,
        trim: true,
      },
      phoneNumber: {
        type: String,
        required: true,
        trim: true,
      },
      alternatePhone: {
        type: String,
        trim: true,
      },
    },

    // Address Information
    address: {
      street: {
        type: String,
        required: true,
        trim: true,
      },
      city: {
        type: String,
        required: true,
        trim: true,
      },
      state: {
        type: String,
        required: true,
        trim: true,
      },
      zipCode: {
        type: String,
        required: true,
        trim: true,
      },
      country: {
        type: String,
        required: true,
        default: "USA",
        trim: true,
      },
    },

    // Living Situation
    livingSituation: {
      homeType: {
        type: String,
        enum: ["house", "apartment", "condo", "townhouse", "farm", "other"],
        required: true,
      },
      homeOwnership: {
        type: String,
        enum: ["own", "rent"],
        required: true,
      },
      landlordPermission: {
        type: Boolean,
        default: null,
      },
      hasYard: {
        type: Boolean,
        required: true,
      },
      yardFenced: {
        type: Boolean,
        default: null,
      },
    },

    // Household Information
    household: {
      numberOfAdults: {
        type: Number,
        required: true,
        min: 1,
      },
      numberOfChildren: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      childrenAges: [Number],
      allMembersAgree: {
        type: Boolean,
        required: true,
      },
    },

    // Pet Experience
    petExperience: {
      hadPetsBefore: {
        type: Boolean,
        required: true,
      },
      currentPets: {
        type: Boolean,
        required: true,
      },
      currentPetsDetails: {
        type: String,
        trim: true,
      },
      petCareExperience: {
        type: String,
        required: true,
        trim: true,
      },
      veterinarianInfo: {
        name: String,
        phone: String,
        clinic: String,
      },
    },

    // Pet Care Plans
    carePlans: {
      dailyCareTime: {
        type: String,
        required: true,
        trim: true,
      },
      exercisePlan: {
        type: String,
        required: true,
        trim: true,
      },
      aloneTimePerDay: {
        type: String,
        required: true,
        trim: true,
      },
      vacationPlan: {
        type: String,
        required: true,
        trim: true,
      },
      emergencyPlan: {
        type: String,
        required: true,
        trim: true,
      },
    },

    // Additional Information
    additionalInfo: {
      whyAdopt: {
        type: String,
        required: true,
        trim: true,
      },
      surrenderCircumstances: {
        type: String,
        trim: true,
      },
      additionalComments: {
        type: String,
        trim: true,
      },
    },

    // References
    references: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        relationship: {
          type: String,
          required: true,
          trim: true,
        },
        phone: {
          type: String,
          required: true,
          trim: true,
        },
        email: {
          type: String,
          trim: true,
        },
      },
    ],

    // Application Status
    status: {
      type: String,
      enum: ["pending", "under_review", "approved", "rejected", "withdrawn"],
      default: "pending",
    },

    // Review Information
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reviewedAt: Date,

    reviewNotes: {
      type: String,
      trim: true,
    },

    rejectionReason: {
      type: String,
      trim: true,
    },

    // Interview details
    interview: {
      scheduled: {
        type: Boolean,
        default: false,
      },
      date: Date,
      notes: String,
      completed: {
        type: Boolean,
        default: false,
      },
    },

    // Home visit details
    homeVisit: {
      required: {
        type: Boolean,
        default: false,
      },
      scheduled: {
        type: Boolean,
        default: false,
      },
      date: Date,
      notes: String,
      completed: {
        type: Boolean,
        default: false,
      },
    },

    // Adoption completion
    adoptionDate: Date,

    adoptionFee: {
      type: Number,
      min: 0,
    },

    adoptionFeePaid: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
adoptionApplicationSchema.index({ pet: 1, applicant: 1 });
adoptionApplicationSchema.index({ applicant: 1, status: 1 });
adoptionApplicationSchema.index({ status: 1, createdAt: -1 });

// Virtual to check if application is complete
adoptionApplicationSchema.virtual("isComplete").get(function () {
  return (
    this.status === "approved" && this.adoptionDate && this.adoptionFeePaid
  );
});

// Method to calculate application score (for prioritization)
adoptionApplicationSchema.methods.calculateScore = function () {
  let score = 0;

  // Experience with pets
  if (this.petExperience.hadPetsBefore) score += 20;
  if (this.petExperience.currentPets) score += 10;

  // Living situation
  if (this.livingSituation.homeOwnership === "own") score += 15;
  if (this.livingSituation.hasYard) score += 10;
  if (this.livingSituation.yardFenced) score += 5;

  // Household agreement
  if (this.household.allMembersAgree) score += 20;

  // References provided
  score += this.references.length * 5;

  // Detailed responses
  if (this.additionalInfo.whyAdopt && this.additionalInfo.whyAdopt.length > 100)
    score += 10;
  if (this.carePlans.exercisePlan && this.carePlans.exercisePlan.length > 50)
    score += 5;

  return score;
};

const AdoptionApplication = mongoose.model(
  "AdoptionApplication",
  adoptionApplicationSchema
);

module.exports = AdoptionApplication;

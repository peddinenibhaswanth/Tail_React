const mongoose = require("mongoose");

const revenueSchema = new mongoose.Schema(
  {
    // Date for the revenue entry
    date: {
      type: Date,
      required: true,
      index: true,
    },

    // Period type for aggregation
    periodType: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      required: true,
      default: "daily",
    },

    // Period identifier (e.g., "2025-10", "2025-W44", "2025-10-31")
    periodIdentifier: {
      type: String,
      required: true,
      index: true,
    },

    // Product sales revenue
    productSales: {
      totalOrders: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalRevenue: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalProfit: {
        type: Number,
        default: 0,
      },
      averageOrderValue: {
        type: Number,
        default: 0,
        min: 0,
      },
      // Breakdown by category
      byCategory: [
        {
          category: String,
          orders: Number,
          revenue: Number,
        },
      ],
      // Top selling products
      topProducts: [
        {
          product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
          },
          name: String,
          quantity: Number,
          revenue: Number,
        },
      ],
    },

    // Adoption revenue
    adoptions: {
      totalAdoptions: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalRevenue: {
        type: Number,
        default: 0,
        min: 0,
      },
      averageAdoptionFee: {
        type: Number,
        default: 0,
        min: 0,
      },
      // Breakdown by species
      bySpecies: [
        {
          species: String,
          count: Number,
          revenue: Number,
        },
      ],
    },

    // Veterinary appointments revenue
    appointments: {
      totalAppointments: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalRevenue: {
        type: Number,
        default: 0,
        min: 0,
      },
      averageAppointmentFee: {
        type: Number,
        default: 0,
        min: 0,
      },
      // Breakdown by veterinary
      byVeterinary: [
        {
          veterinary: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          name: String,
          count: Number,
          revenue: Number,
        },
      ],
    },

    // Total revenue summary
    summary: {
      totalRevenue: {
        type: Number,
        default: 0,
      },
      totalTax: {
        type: Number,
        default: 0,
      },
      totalCommission: {
        type: Number,
        default: 0,
      },
      totalPayouts: {
        type: Number,
        default: 0,
      },
      totalOrders: {
        type: Number,
        default: 0,
      },
      totalTransactions: {
        type: Number,
        default: 0,
      },
    },

    // Payment methods breakdown
    paymentMethods: [
      {
        method: {
          type: String,
          enum: [
            "credit_card",
            "debit_card",
            "paypal",
            "cash",
            "bank_transfer",
            "other",
          ],
        },
        count: Number,
        amount: Number,
      },
    ],

    // Expenses (for profit calculation)
    expenses: {
      operationalCosts: {
        type: Number,
        default: 0,
        min: 0,
      },
      marketingCosts: {
        type: Number,
        default: 0,
        min: 0,
      },
      staffCosts: {
        type: Number,
        default: 0,
        min: 0,
      },
      otherCosts: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalExpenses: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    // Profit calculation
    profit: {
      grossProfit: {
        type: Number,
        default: 0,
      },
      netProfit: {
        type: Number,
        default: 0,
      },
      profitMargin: {
        type: Number,
        default: 0,
      },
    },

    // Customer metrics
    customerMetrics: {
      newCustomers: {
        type: Number,
        default: 0,
        min: 0,
      },
      returningCustomers: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalCustomers: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    // Seller metrics (for multi-vendor platform)
    sellerMetrics: [
      {
        seller: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        name: String,
        totalSales: Number,
        totalRevenue: Number,
        commission: Number,
      },
    ],

    // Additional notes
    notes: {
      type: String,
      trim: true,
    },

    // Status
    status: {
      type: String,
      enum: ["draft", "final", "archived"],
      default: "draft",
    },

    // Finalized information
    finalizedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    finalizedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound indexes
revenueSchema.index({ periodType: 1, periodIdentifier: 1 }, { unique: true });
revenueSchema.index({ date: 1, periodType: 1 });

// Method to calculate totals
revenueSchema.methods.calculateTotals = function () {
  // Calculate total revenue
  this.summary.totalRevenue =
    this.productSales.totalRevenue +
    this.adoptions.totalRevenue +
    this.appointments.totalRevenue;

  // Calculate total orders/transactions
  this.summary.totalOrders = this.productSales.totalOrders;
  this.summary.totalTransactions =
    this.productSales.totalOrders +
    this.adoptions.totalAdoptions +
    this.appointments.totalAppointments;

  // Calculate total expenses
  this.expenses.totalExpenses =
    this.expenses.operationalCosts +
    this.expenses.marketingCosts +
    this.expenses.staffCosts +
    this.expenses.otherCosts;

  // Calculate profit
  this.profit.grossProfit = this.productSales.totalProfit;
  this.profit.netProfit =
    this.summary.totalRevenue - this.expenses.totalExpenses;
  this.profit.profitMargin =
    this.summary.totalRevenue > 0
      ? (this.profit.netProfit / this.summary.totalRevenue) * 100
      : 0;

  return this;
};

// Pre-save hook to calculate totals
revenueSchema.pre("save", function (next) {
  this.calculateTotals();
  next();
});

// Static method to get revenue for a period
revenueSchema.statics.getRevenueForPeriod = function (
  periodType,
  periodIdentifier
) {
  return this.findOne({ periodType, periodIdentifier });
};

// Static method to get revenue trend
revenueSchema.statics.getRevenueTrend = function (
  periodType,
  startDate,
  endDate
) {
  return this.find({
    periodType,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: 1 });
};

// Static method to get top performing categories
revenueSchema.statics.getTopCategories = async function (
  periodType,
  periodIdentifier,
  limit = 5
) {
  const revenue = await this.findOne({ periodType, periodIdentifier });
  if (!revenue) return [];

  return revenue.productSales.byCategory
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
};

const Revenue = mongoose.model("Revenue", revenueSchema);

module.exports = Revenue;

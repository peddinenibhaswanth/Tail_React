const Cart = require("../models/Cart");
const Product = require("../models/Product");

// @desc    Get checkout summary
// @route   GET /api/checkout/summary
// @access  Private
exports.getCheckoutSummary = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate({
      path: "items.product",
      select: "name price salePrice onSale mainImage stock seller",
      populate: {
        path: "seller",
        select: "name sellerInfo.businessName email",
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // Validate all items
    const unavailableItems = [];
    const outOfStockItems = [];
    const adjustedItems = [];

    for (const item of cart.items) {
      if (!item.product) {
        unavailableItems.push("Product no longer available");
        continue;
      }

      if (item.product.stock === 0) {
        outOfStockItems.push(item.product.name);
      } else if (item.quantity > item.product.stock) {
        adjustedItems.push({
          name: item.product.name,
          requestedQty: item.quantity,
          availableQty: item.product.stock,
        });
      }
    }

    if (unavailableItems.length > 0 || outOfStockItems.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some items in your cart are not available",
        unavailableItems,
        outOfStockItems,
        adjustedItems,
      });
    }

    await cart.calculateTotals();

    // Get user's saved addresses if any
    const savedAddresses = req.user.addresses || [];

    res.json({
      success: true,
      data: {
        cart,
        savedAddresses,
        pricing: {
          itemsPrice: cart.subtotal,
          taxPrice: cart.tax,
          shippingPrice: cart.shippingCost,
          totalPrice: cart.total,
        },
        warnings: adjustedItems.length > 0 ? adjustedItems : null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching checkout summary",
      error: error.message,
    });
  }
};

// @desc    Validate checkout data before order creation
// @route   POST /api/checkout/validate
// @access  Private
exports.validateCheckout = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;

    // Validate shipping address
    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        field: "shippingAddress",
        message: "Shipping address is required",
      });
    }

    const requiredAddressFields = [
      "street",
      "city",
      "state",
      "zipCode",
      "country",
    ];
    const missingFields = requiredAddressFields.filter(
      (field) => !shippingAddress[field]
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        field: "shippingAddress",
        message: `Missing required address fields: ${missingFields.join(", ")}`,
      });
    }

    // Validate ZIP code format (assuming Indian PIN code)
    if (!/^\d{6}$/.test(shippingAddress.zipCode)) {
      return res.status(400).json({
        success: false,
        field: "zipCode",
        message: "Invalid ZIP code format",
      });
    }

    // Validate payment method
    const validPaymentMethods = ["cod", "card", "upi", "netbanking", "wallet"];
    if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        field: "paymentMethod",
        message: "Valid payment method is required",
      });
    }

    // Validate cart one more time
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product"
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        field: "cart",
        message: "Cart is empty",
      });
    }

    const stockIssues = [];
    for (const item of cart.items) {
      if (!item.product) {
        stockIssues.push({
          issue: "unavailable",
          message: "Product no longer available",
        });
      } else if (item.product.stock < item.quantity) {
        stockIssues.push({
          product: item.product.name,
          issue: "insufficient_stock",
          available: item.product.stock,
          requested: item.quantity,
        });
      }
    }

    if (stockIssues.length > 0) {
      return res.status(400).json({
        success: false,
        field: "cart",
        message: "Stock availability issues",
        issues: stockIssues,
      });
    }

    res.json({
      success: true,
      message: "Checkout validation passed",
      data: {
        itemCount: cart.items.length,
        totalAmount: cart.total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error validating checkout",
      error: error.message,
    });
  }
};

// @desc    Calculate shipping cost
// @route   POST /api/checkout/shipping-cost
// @access  Private
exports.calculateShippingCost = async (req, res) => {
  try {
    const { zipCode, itemsPrice } = req.body;

    // Free shipping for orders above ₹1000
    if (itemsPrice >= 1000) {
      return res.json({
        success: true,
        shippingCost: 0,
        freeShipping: true,
        message: "Free shipping on orders above ₹1000",
      });
    }

    // Basic shipping cost calculation
    let shippingCost = 50;

    // Could add more complex logic based on zipCode, weight, etc.
    // For now, flat rate
    if (zipCode && zipCode.startsWith("5")) {
      shippingCost = 40; // Local delivery
    }

    res.json({
      success: true,
      shippingCost,
      freeShipping: false,
      message: `₹${1000 - itemsPrice} more for free shipping`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error calculating shipping cost",
      error: error.message,
    });
  }
};

// @desc    Apply promo code
// @route   POST /api/checkout/promo
// @access  Private
exports.applyPromoCode = async (req, res) => {
  try {
    const { promoCode, cartTotal } = req.body;

    if (!promoCode) {
      return res.status(400).json({
        success: false,
        message: "Promo code is required",
      });
    }

    // Dummy promo codes for demonstration
    const promoCodes = {
      FIRST10: { discount: 10, type: "percentage", minOrder: 500 },
      SAVE20: { discount: 20, type: "percentage", minOrder: 1000 },
      FLAT100: { discount: 100, type: "fixed", minOrder: 800 },
      WELCOME: { discount: 15, type: "percentage", minOrder: 0 },
    };

    const promo = promoCodes[promoCode.toUpperCase()];

    if (!promo) {
      return res.status(400).json({
        success: false,
        message: "Invalid promo code",
      });
    }

    if (cartTotal < promo.minOrder) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value of ₹${promo.minOrder} required for this promo code`,
      });
    }

    let discount = 0;
    if (promo.type === "percentage") {
      discount = (cartTotal * promo.discount) / 100;
    } else {
      discount = promo.discount;
    }

    // Max discount cap
    const maxDiscount = cartTotal * 0.5; // Max 50% discount
    discount = Math.min(discount, maxDiscount);

    res.json({
      success: true,
      message: "Promo code applied successfully",
      data: {
        promoCode: promoCode.toUpperCase(),
        discount: discount,
        newTotal: cartTotal - discount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error applying promo code",
      error: error.message,
    });
  }
};

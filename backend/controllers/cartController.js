const Cart = require("../models/Cart");
const Product = require("../models/Product");

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ customer: req.user._id }).populate({
      path: "items.product",
      select: "name price salePrice onSale mainImage stock seller",
      populate: {
        path: "seller",
        select: "name sellerInfo.businessName",
      },
    });

    if (!cart) {
      cart = await Cart.create({ customer: req.user._id, items: [] });
    }

    await cart.calculateTotals();

    res.json({
      success: true,
      data: cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching cart",
      error: error.message,
    });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/items
// @access  Private
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock available",
      });
    }

    let cart = await Cart.findOne({ customer: req.user._id });

    if (!cart) {
      cart = await Cart.create({
        customer: req.user._id,
        items: [],
      });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    // Determine the price (sale price or regular price)
    const price = product.onSale ? product.salePrice : product.price;

    if (existingItemIndex > -1) {
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;

      if (newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: "Cannot add more than available stock",
        });
      }

      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].price = price;
    } else {
      cart.items.push({
        product: productId,
        quantity,
        price: price,
        name: product.name,
        image: product.mainImage || "default-product.jpg",
      });
    }

    await cart.save();
    await cart.populate({
      path: "items.product",
      select: "name price salePrice onSale mainImage stock",
    });

    await cart.calculateTotals();

    res.json({
      success: true,
      message: "Item added to cart",
      data: cart,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error adding item to cart",
      error: error.message,
    });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/items/:productId
// @access  Private
exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { productId } = req.params;

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock available",
      });
    }

    const cart = await Cart.findOne({ customer: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].price = product.onSale
      ? product.salePrice
      : product.price;

    await cart.save();
    await cart.populate({
      path: "items.product",
      select: "name price salePrice onSale mainImage stock",
    });

    await cart.calculateTotals();

    res.json({
      success: true,
      message: "Cart updated",
      data: cart,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating cart",
      error: error.message,
    });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:productId
// @access  Private
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ customer: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    await cart.save();
    await cart.populate({
      path: "items.product",
      select: "name price salePrice onSale mainImage stock",
    });

    await cart.calculateTotals();

    res.json({
      success: true,
      message: "Item removed from cart",
      data: cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error removing item from cart",
      error: error.message,
    });
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ customer: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    cart.items = [];
    await cart.save();
    await cart.calculateTotals();

    res.json({
      success: true,
      message: "Cart cleared",
      data: cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error clearing cart",
      error: error.message,
    });
  }
};

// @desc    Validate cart items (check stock availability)
// @route   GET /api/cart/validate
// @access  Private
exports.validateCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ customer: req.user._id }).populate(
      "items.product"
    );

    if (!cart || cart.items.length === 0) {
      return res.json({
        success: true,
        valid: true,
        message: "Cart is empty",
      });
    }

    const issues = [];
    let cartUpdated = false;

    for (let i = cart.items.length - 1; i >= 0; i--) {
      const item = cart.items[i];

      if (!item.product) {
        cart.items.splice(i, 1);
        cartUpdated = true;
        issues.push({
          issue: "removed",
          message: "Product no longer available",
        });
        continue;
      }

      if (item.product.stock === 0) {
        cart.items.splice(i, 1);
        cartUpdated = true;
        issues.push({
          product: item.product.name,
          issue: "out_of_stock",
          message: `${item.product.name} is out of stock and was removed`,
        });
      } else if (item.quantity > item.product.stock) {
        cart.items[i].quantity = item.product.stock;
        cartUpdated = true;
        issues.push({
          product: item.product.name,
          issue: "quantity_adjusted",
          message: `${item.product.name} quantity adjusted to ${item.product.stock} (available stock)`,
        });
      }

      const currentPrice = item.product.onSale
        ? item.product.salePrice
        : item.product.price;
      if (item.price !== currentPrice) {
        cart.items[i].price = currentPrice;
        cartUpdated = true;
        issues.push({
          product: item.product.name,
          issue: "price_changed",
          message: `${item.product.name} price updated to ₹${currentPrice}`,
        });
      }
    }

    if (cartUpdated) {
      await cart.save();
      await cart.calculateTotals();
    }

    res.json({
      success: true,
      valid: issues.length === 0,
      issues,
      data: cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error validating cart",
      error: error.message,
    });
  }
};

// @desc    Get cart item count
// @route   GET /api/cart/count
// @access  Private
exports.getCartCount = async (req, res) => {
  try {
    const cart = await Cart.findOne({ customer: req.user._id });

    const count = cart
      ? cart.items.reduce((total, item) => total + item.quantity, 0)
      : 0;

    res.json({
      success: true,
      count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching cart count",
      error: error.message,
    });
  }
};

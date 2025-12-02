import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as cartService from "../../api/cartService";

const initialState = {
  items: [],
  total: 0,
  itemCount: 0,
  isLoading: false,
  isError: false,
  message: "",
};

// Get cart items
export const getCart = createAsyncThunk("cart/getCart", async (_, thunkAPI) => {
  try {
    return await cartService.getCart();
  } catch (error) {
    const message =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

// Add to cart
export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async (cartData, thunkAPI) => {
    try {
      return await cartService.addToCart(cartData);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update cart item
export const updateCartItem = createAsyncThunk(
  "cart/updateCartItem",
  async ({ itemId, quantity }, thunkAPI) => {
    try {
      return await cartService.updateCartItem(itemId, quantity);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Remove from cart
export const removeFromCart = createAsyncThunk(
  "cart/removeFromCart",
  async (itemId, thunkAPI) => {
    try {
      return await cartService.removeFromCart(itemId);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Clear cart
export const clearCart = createAsyncThunk(
  "cart/clearCart",
  async (_, thunkAPI) => {
    try {
      return await cartService.clearCart();
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    resetCart: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.message = "";
    },
    calculateTotal: (state) => {
      let total = 0;
      let itemCount = 0;
      state.items.forEach((item) => {
        total += item.product.price * item.quantity;
        itemCount += item.quantity;
      });
      state.total = total;
      state.itemCount = itemCount;
    },
    // Optimistic update for quantity change (instant UI update)
    updateQuantityOptimistic: (state, action) => {
      const { productId, quantity } = action.payload;
      const itemIndex = state.items.findIndex(
        (item) => item.product._id === productId
      );
      if (itemIndex !== -1) {
        state.items[itemIndex].quantity = quantity;
        cartSlice.caseReducers.calculateTotal(state);
      }
    },
    // Optimistic remove item
    removeItemOptimistic: (state, action) => {
      const productId = action.payload;
      state.items = state.items.filter(
        (item) => item.product._id !== productId
      );
      cartSlice.caseReducers.calculateTotal(state);
    },
  },
  extraReducers: (builder) => {
    builder
      // Get cart
      .addCase(getCart.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(getCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.message = "";
        // Backend returns {success, data: {items, ...}}
        const cartData = action.payload.data || action.payload;
        state.items = cartData.items || [];
        cartSlice.caseReducers.calculateTotal(state);
      })
      .addCase(getCart.rejected, (state, action) => {
        state.isLoading = false;
        // Don't show error message for cart fetch failures - just reset cart
        state.isError = false;
        state.message = "";
        state.items = [];
        state.total = 0;
        state.itemCount = 0;
      })
      // Add to cart
      .addCase(addToCart.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        const cartData = action.payload.data || action.payload;
        state.items = cartData.items || [];
        state.message = "Item added to cart!";
        cartSlice.caseReducers.calculateTotal(state);
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Failed to add item to cart";
      })
      // Update cart item (no loading - optimistic update handles UI)
      .addCase(updateCartItem.fulfilled, (state, action) => {
        const cartData = action.payload.data || action.payload;
        state.items = cartData.items || [];
        cartSlice.caseReducers.calculateTotal(state);
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        // On error, refetch cart to restore correct state
        state.isError = true;
        state.message = action.payload;
      })
      // Remove from cart (no loading - optimistic update handles UI)
      .addCase(removeFromCart.fulfilled, (state, action) => {
        const cartData = action.payload.data || action.payload;
        state.items = cartData.items || [];
        cartSlice.caseReducers.calculateTotal(state);
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        // On error, refetch cart to restore correct state
        state.isError = true;
        state.message = action.payload;
      })
      // Clear cart
      .addCase(clearCart.fulfilled, (state) => {
        state.items = [];
        state.total = 0;
        state.itemCount = 0;
      });
  },
});

export const {
  resetCart,
  calculateTotal,
  updateQuantityOptimistic,
  removeItemOptimistic,
} = cartSlice.actions;
export default cartSlice.reducer;

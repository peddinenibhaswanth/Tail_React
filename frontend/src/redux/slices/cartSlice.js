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
  },
  extraReducers: (builder) => {
    builder
      // Get cart
      .addCase(getCart.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items || [];
        cartSlice.caseReducers.calculateTotal(state);
      })
      .addCase(getCart.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Add to cart
      .addCase(addToCart.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items || [];
        cartSlice.caseReducers.calculateTotal(state);
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Update cart item
      .addCase(updateCartItem.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items || [];
        cartSlice.caseReducers.calculateTotal(state);
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Remove from cart
      .addCase(removeFromCart.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items || [];
        cartSlice.caseReducers.calculateTotal(state);
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.isLoading = false;
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

export const { resetCart, calculateTotal } = cartSlice.actions;
export default cartSlice.reducer;

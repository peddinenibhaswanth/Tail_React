import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as productService from "../../api/productService";

const initialState = {
  products: [],
  sellerProducts: [],
  product: null,
  categories: [],
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: "",
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  },
  filters: {
    category: "",
    minPrice: "",
    maxPrice: "",
    inStock: false,
    search: "",
  },
};

// Get all products
export const getProducts = createAsyncThunk(
  "products/getProducts",
  async (query, thunkAPI) => {
    try {
      return await productService.getProducts(query);
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

// Get single product
export const getProduct = createAsyncThunk(
  "products/getProduct",
  async (id, thunkAPI) => {
    try {
      return await productService.getProduct(id);
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

// Get featured products
export const getFeaturedProducts = createAsyncThunk(
  "products/getFeaturedProducts",
  async (_, thunkAPI) => {
    try {
      return await productService.getFeaturedProducts();
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

// Get categories
export const getCategories = createAsyncThunk(
  "products/getCategories",
  async (_, thunkAPI) => {
    try {
      return await productService.getCategories();
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

// Get products by seller
export const getProductsBySeller = createAsyncThunk(
  "products/getProductsBySeller",
  async (sellerId, thunkAPI) => {
    try {
      return await productService.getProductsBySeller(sellerId);
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

// Create product (Seller/Admin)
export const createProduct = createAsyncThunk(
  "products/createProduct",
  async (productData, thunkAPI) => {
    try {
      return await productService.createProduct(productData);
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

// Update product (Seller/Admin)
export const updateProduct = createAsyncThunk(
  "products/updateProduct",
  async ({ id, productData }, thunkAPI) => {
    try {
      return await productService.updateProduct(id, productData);
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

// Delete product (Seller/Admin)
export const deleteProduct = createAsyncThunk(
  "products/deleteProduct",
  async (id, thunkAPI) => {
    try {
      await productService.deleteProduct(id);
      return { id };
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

// Update product stock (Seller/Admin)
export const updateStock = createAsyncThunk(
  "products/updateStock",
  async ({ id, stock }, thunkAPI) => {
    try {
      return await productService.updateStock(id, stock);
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

// Add product review
export const addReview = createAsyncThunk(
  "products/addReview",
  async ({ productId, reviewData }, thunkAPI) => {
    try {
      return await productService.addReview(productId, reviewData);
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

export const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    resetProducts: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        category: "",
        minPrice: "",
        maxPrice: "",
        inStock: false,
        search: "",
      };
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all products
      .addCase(getProducts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.products = action.payload.data || action.payload.products || [];
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(getProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get single product
      .addCase(getProduct.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.product = action.payload.data || action.payload;
      })
      .addCase(getProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get featured products
      .addCase(getFeaturedProducts.fulfilled, (state, action) => {
        state.products = action.payload.data || action.payload;
      })
      // Get categories
      .addCase(getCategories.fulfilled, (state, action) => {
        state.categories = action.payload.data || action.payload;
      })
      // Get products by seller
      .addCase(getProductsBySeller.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProductsBySeller.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.sellerProducts = action.payload.data || action.payload;
      })
      .addCase(getProductsBySeller.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Create product
      .addCase(createProduct.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const newProduct = action.payload.data || action.payload;
        state.products.push(newProduct);
        state.sellerProducts.push(newProduct);
        state.message = "Product created successfully!";
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Update product
      .addCase(updateProduct.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const updatedProduct = action.payload.data || action.payload;
        state.product = updatedProduct;
        state.products = state.products.map((p) =>
          p._id === updatedProduct._id ? updatedProduct : p
        );
        state.sellerProducts = state.sellerProducts.map((p) =>
          p._id === updatedProduct._id ? updatedProduct : p
        );
        state.message = "Product updated successfully!";
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Delete product
      .addCase(deleteProduct.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.products = state.products.filter(
          (p) => p._id !== action.payload.id
        );
        state.sellerProducts = state.sellerProducts.filter(
          (p) => p._id !== action.payload.id
        );
        state.message = "Product deleted successfully!";
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Update stock
      .addCase(updateStock.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateStock.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const updatedProduct = action.payload.data || action.payload;
        state.products = state.products.map((p) =>
          p._id === updatedProduct._id ? updatedProduct : p
        );
        state.sellerProducts = state.sellerProducts.map((p) =>
          p._id === updatedProduct._id ? updatedProduct : p
        );
        state.message = "Stock updated successfully!";
      })
      .addCase(updateStock.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Add review
      .addCase(addReview.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addReview.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.product = action.payload;
        state.message = "Review added successfully!";
      })
      .addCase(addReview.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { resetProducts, setFilters, clearFilters, setPagination } =
  productSlice.actions;
export default productSlice.reducer;

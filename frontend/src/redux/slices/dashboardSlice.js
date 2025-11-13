import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as dashboardService from "../../api/dashboardService";

const initialState = {
  dashboardData: null,
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: "",
};

// Get admin dashboard
export const getAdminDashboard = createAsyncThunk(
  "dashboard/getAdminDashboard",
  async (_, thunkAPI) => {
    try {
      return await dashboardService.getAdminDashboard();
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

// Get seller dashboard
export const getSellerDashboard = createAsyncThunk(
  "dashboard/getSellerDashboard",
  async (_, thunkAPI) => {
    try {
      return await dashboardService.getSellerDashboard();
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

// Get veterinary dashboard
export const getVeterinaryDashboard = createAsyncThunk(
  "dashboard/getVeterinaryDashboard",
  async (_, thunkAPI) => {
    try {
      return await dashboardService.getVeterinaryDashboard();
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

// Get customer dashboard
export const getCustomerDashboard = createAsyncThunk(
  "dashboard/getCustomerDashboard",
  async (_, thunkAPI) => {
    try {
      return await dashboardService.getCustomerDashboard();
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

export const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    resetDashboard: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
    clearDashboard: (state) => {
      state.dashboardData = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Admin dashboard
      .addCase(getAdminDashboard.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAdminDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.dashboardData = action.payload.data || action.payload;
      })
      .addCase(getAdminDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Seller dashboard
      .addCase(getSellerDashboard.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSellerDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.dashboardData = action.payload.data || action.payload;
      })
      .addCase(getSellerDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Veterinary dashboard
      .addCase(getVeterinaryDashboard.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getVeterinaryDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.dashboardData = action.payload.data || action.payload;
      })
      .addCase(getVeterinaryDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Customer dashboard
      .addCase(getCustomerDashboard.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCustomerDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.dashboardData = action.payload.data || action.payload;
      })
      .addCase(getCustomerDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { resetDashboard, clearDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;

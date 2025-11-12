import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as appointmentService from "../../api/appointmentService";

const initialState = {
  appointments: [],
  appointment: null,
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: "",
};

// Create appointment
export const createAppointment = createAsyncThunk(
  "appointments/createAppointment",
  async (appointmentData, thunkAPI) => {
    try {
      return await appointmentService.createAppointment(appointmentData);
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

// Get user appointments
export const getUserAppointments = createAsyncThunk(
  "appointments/getUserAppointments",
  async (_, thunkAPI) => {
    try {
      return await appointmentService.getUserAppointments();
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

// Get single appointment
export const getAppointment = createAsyncThunk(
  "appointments/getAppointment",
  async (id, thunkAPI) => {
    try {
      return await appointmentService.getAppointment(id);
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

// Cancel appointment
export const cancelAppointment = createAsyncThunk(
  "appointments/cancelAppointment",
  async (id, thunkAPI) => {
    try {
      return await appointmentService.cancelAppointment(id);
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

export const appointmentSlice = createSlice({
  name: "appointments",
  initialState,
  reducers: {
    resetAppointments: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // Create appointment
      .addCase(createAppointment.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createAppointment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.appointment = action.payload.data || action.payload;
        state.message = "Appointment booked successfully!";
      })
      .addCase(createAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get user appointments
      .addCase(getUserAppointments.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUserAppointments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.appointments = action.payload.data || action.payload;
      })
      .addCase(getUserAppointments.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get single appointment
      .addCase(getAppointment.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAppointment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.appointment = action.payload.data || action.payload;
      })
      .addCase(getAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Cancel appointment
      .addCase(cancelAppointment.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(cancelAppointment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.appointment = action.payload.data || action.payload;
        state.message = "Appointment cancelled successfully!";
      })
      .addCase(cancelAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { resetAppointments } = appointmentSlice.actions;
export default appointmentSlice.reducer;

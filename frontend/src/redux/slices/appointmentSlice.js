import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as appointmentService from "../../api/appointmentService";

const initialState = {
  appointments: [],
  appointment: null,
  veterinaries: [],
  availableSlots: [],
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

// Get vet appointments (for veterinary role)
export const getVetAppointments = createAsyncThunk(
  "appointments/getVetAppointments",
  async (params = {}, thunkAPI) => {
    try {
      return await appointmentService.getVetAppointments(params);
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

// Update appointment status (vet/admin)
export const updateAppointmentStatus = createAsyncThunk(
  "appointments/updateStatus",
  async ({ id, status, notes, paymentStatus }, thunkAPI) => {
    try {
      return await appointmentService.updateAppointmentStatus(
        id,
        status,
        notes,
        paymentStatus
      );
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

// Get veterinaries list
export const getVeterinaries = createAsyncThunk(
  "appointments/getVeterinaries",
  async (_, thunkAPI) => {
    try {
      return await appointmentService.getVeterinaries();
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

// Get available slots
export const getAvailableSlots = createAsyncThunk(
  "appointments/getAvailableSlots",
  async ({ veterinary, date }, thunkAPI) => {
    try {
      return await appointmentService.getAvailableSlots(veterinary, date);
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
    clearAvailableSlots: (state) => {
      state.availableSlots = [];
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
      // Get vet appointments
      .addCase(getVetAppointments.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getVetAppointments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.appointments = action.payload.data || action.payload;
      })
      .addCase(getVetAppointments.rejected, (state, action) => {
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
      // Update appointment status
      .addCase(updateAppointmentStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateAppointmentStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.appointment = action.payload.data || action.payload;
        // Update in list if exists
        const index = state.appointments.findIndex(
          (a) => a._id === state.appointment._id
        );
        if (index !== -1) {
          state.appointments[index] = state.appointment;
        }
        state.message = "Appointment status updated!";
      })
      .addCase(updateAppointmentStatus.rejected, (state, action) => {
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
        // Update in list if exists
        const index = state.appointments.findIndex(
          (a) => a._id === state.appointment._id
        );
        if (index !== -1) {
          state.appointments[index] = state.appointment;
        }
        state.message = "Appointment cancelled successfully!";
      })
      .addCase(cancelAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get veterinaries
      .addCase(getVeterinaries.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getVeterinaries.fulfilled, (state, action) => {
        state.isLoading = false;
        state.veterinaries = action.payload.data || action.payload;
      })
      .addCase(getVeterinaries.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get available slots
      .addCase(getAvailableSlots.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAvailableSlots.fulfilled, (state, action) => {
        state.isLoading = false;
        state.availableSlots =
          action.payload.data?.availableSlots ||
          action.payload.availableSlots ||
          [];
      })
      .addCase(getAvailableSlots.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { resetAppointments, clearAvailableSlots } =
  appointmentSlice.actions;
export default appointmentSlice.reducer;

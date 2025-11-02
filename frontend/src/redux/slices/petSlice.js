import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as petService from "../../api/petService";

const initialState = {
  pets: [],
  pet: null,
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
    species: "",
    breed: "",
    age: "",
    size: "",
    gender: "",
    search: "",
  },
};

// Get all pets
export const getPets = createAsyncThunk(
  "pets/getPets",
  async (query, thunkAPI) => {
    try {
      return await petService.getPets(query);
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

// Get single pet
export const getPet = createAsyncThunk("pets/getPet", async (id, thunkAPI) => {
  try {
    return await petService.getPet(id);
  } catch (error) {
    const message =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

// Apply for adoption
export const applyForAdoption = createAsyncThunk(
  "pets/applyForAdoption",
  async ({ petId, applicationData }, thunkAPI) => {
    try {
      return await petService.applyForAdoption(petId, applicationData);
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

export const petSlice = createSlice({
  name: "pets",
  initialState,
  reducers: {
    resetPets: (state) => {
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
        species: "",
        breed: "",
        age: "",
        size: "",
        gender: "",
        search: "",
      };
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all pets
      .addCase(getPets.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getPets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.pets = action.payload.pets || [];
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(getPets.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get single pet
      .addCase(getPet.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getPet.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.pet = action.payload;
      })
      .addCase(getPet.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Apply for adoption
      .addCase(applyForAdoption.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(applyForAdoption.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = "Application submitted successfully!";
      })
      .addCase(applyForAdoption.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { resetPets, setFilters, clearFilters, setPagination } =
  petSlice.actions;
export default petSlice.reducer;

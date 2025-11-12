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

// Create pet (Admin)
export const createPet = createAsyncThunk(
  "pets/createPet",
  async (petData, thunkAPI) => {
    try {
      return await petService.createPet(petData);
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

// Update pet (Admin)
export const updatePet = createAsyncThunk(
  "pets/updatePet",
  async ({ id, petData }, thunkAPI) => {
    try {
      return await petService.updatePet(id, petData);
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

// Delete pet (Admin)
export const deletePet = createAsyncThunk(
  "pets/deletePet",
  async (id, thunkAPI) => {
    try {
      return await petService.deletePet(id);
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
        // Backend returns {success, data, pagination}
        state.pets = action.payload.data || action.payload.pets || [];
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
        // Backend returns {success, data}
        state.pet = action.payload.data || action.payload;
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
      })
      // Create pet
      .addCase(createPet.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createPet.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.pets.push(action.payload);
        state.message = "Pet created successfully!";
      })
      .addCase(createPet.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Update pet
      .addCase(updatePet.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updatePet.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.pet = action.payload;
        state.pets = state.pets.map((p) =>
          p._id === action.payload._id ? action.payload : p
        );
        state.message = "Pet updated successfully!";
      })
      .addCase(updatePet.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Delete pet
      .addCase(deletePet.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deletePet.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.pets = state.pets.filter((p) => p._id !== action.payload.id);
        state.message = "Pet deleted successfully!";
      })
      .addCase(deletePet.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { resetPets, setFilters, clearFilters, setPagination } =
  petSlice.actions;
export default petSlice.reducer;

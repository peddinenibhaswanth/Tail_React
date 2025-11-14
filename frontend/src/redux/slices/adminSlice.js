import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as adminService from "../../api/adminService";

const initialState = {
  users: [],
  user: null,
  coAdmins: [],
  applications: [],
  application: null,
  messages: [],
  message: null,
  statistics: null,
  pagination: {
    page: 1,
    pages: 1,
    total: 0,
  },
  isLoading: false,
  isError: false,
  isSuccess: false,
  errorMessage: "",
};

// Get all users
export const getAllUsers = createAsyncThunk(
  "admin/getAllUsers",
  async (params = {}, thunkAPI) => {
    try {
      return await adminService.getAllUsers(params);
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

// Get user by ID
export const getUserById = createAsyncThunk(
  "admin/getUserById",
  async (id, thunkAPI) => {
    try {
      return await adminService.getUserById(id);
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

// Update user
export const updateUser = createAsyncThunk(
  "admin/updateUser",
  async ({ id, userData }, thunkAPI) => {
    try {
      return await adminService.updateUser(id, userData);
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

// Delete user
export const deleteUser = createAsyncThunk(
  "admin/deleteUser",
  async (id, thunkAPI) => {
    try {
      await adminService.deleteUser(id);
      return id;
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

// Approve user (seller/vet)
export const approveUser = createAsyncThunk(
  "admin/approveUser",
  async (id, thunkAPI) => {
    try {
      return await adminService.approveUser(id);
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

// Update user role
export const updateUserRole = createAsyncThunk(
  "admin/updateUserRole",
  async ({ id, role }, thunkAPI) => {
    try {
      return await adminService.updateUserRole(id, role);
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

// Get all co-admins
export const getAllCoAdmins = createAsyncThunk(
  "admin/getAllCoAdmins",
  async (_, thunkAPI) => {
    try {
      return await adminService.getAllCoAdmins();
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

// Create co-admin
export const createCoAdmin = createAsyncThunk(
  "admin/createCoAdmin",
  async (coAdminData, thunkAPI) => {
    try {
      return await adminService.createCoAdmin(coAdminData);
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

// Delete co-admin
export const deleteCoAdmin = createAsyncThunk(
  "admin/deleteCoAdmin",
  async (id, thunkAPI) => {
    try {
      await adminService.deleteCoAdmin(id);
      return id;
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

// Get all applications
export const getAllApplications = createAsyncThunk(
  "admin/getAllApplications",
  async (params = {}, thunkAPI) => {
    try {
      return await adminService.getAllApplications(params);
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

// Get application by ID
export const getApplicationById = createAsyncThunk(
  "admin/getApplicationById",
  async (id, thunkAPI) => {
    try {
      return await adminService.getApplicationById(id);
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

// Update application status
export const updateApplicationStatus = createAsyncThunk(
  "admin/updateApplicationStatus",
  async ({ id, status, notes }, thunkAPI) => {
    try {
      return await adminService.updateApplicationStatus(id, status, notes);
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

// Get all messages
export const getAllMessages = createAsyncThunk(
  "admin/getAllMessages",
  async (params = {}, thunkAPI) => {
    try {
      return await adminService.getAllMessages(params);
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

// Get message by ID
export const getMessageById = createAsyncThunk(
  "admin/getMessageById",
  async (id, thunkAPI) => {
    try {
      return await adminService.getMessageById(id);
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

// Mark message as read
export const markMessageAsRead = createAsyncThunk(
  "admin/markMessageAsRead",
  async (id, thunkAPI) => {
    try {
      return await adminService.markMessageAsRead(id);
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

// Update message status
export const updateMessageStatus = createAsyncThunk(
  "admin/updateMessageStatus",
  async ({ id, isRead }, thunkAPI) => {
    try {
      return await adminService.updateMessageStatus(id, isRead);
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

// Reply to message
export const replyToMessage = createAsyncThunk(
  "admin/replyToMessage",
  async ({ id, reply }, thunkAPI) => {
    try {
      return await adminService.replyToMessage(id, reply);
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

// Delete message
export const deleteMessage = createAsyncThunk(
  "admin/deleteMessage",
  async (id, thunkAPI) => {
    try {
      await adminService.deleteMessage(id);
      return id;
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

// Get admin statistics
export const getAdminStatistics = createAsyncThunk(
  "admin/getStatistics",
  async (_, thunkAPI) => {
    try {
      return await adminService.getAdminStatistics();
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

export const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    resetAdmin: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false; state.errorMessage = "";
    },
    clearAdminMessages: (state) => {
      state.isSuccess = false;
      state.isError = false; state.errorMessage = "";
    },
    clearUser: (state) => {
      state.user = null;
    },
    clearApplication: (state) => {
      state.application = null;
    },
    clearMessage: (state) => {
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all users
      .addCase(getAllUsers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.users =
          action.payload.data?.users ||
          action.payload.users ||
          action.payload.data ||
          [];
        if (action.payload.data?.pagination || action.payload.pagination) {
          state.pagination =
            action.payload.data?.pagination || action.payload.pagination;
        }
      })
      .addCase(getAllUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true; state.errorMessage = action.payload;
      })
      // Get user by ID
      .addCase(getUserById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUserById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data || action.payload;
      })
      .addCase(getUserById.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true; state.errorMessage = action.payload;
      })
      // Update user
      .addCase(updateUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload.data || action.payload;
        const index = state.users.findIndex((u) => u._id === state.user._id);
        if (index !== -1) {
          state.users[index] = state.user;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true; state.errorMessage = action.payload;
      })
      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.users = state.users.filter((u) => u._id !== action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true; state.errorMessage = action.payload;
      })
      // Approve user
      .addCase(approveUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(approveUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const updatedUser = action.payload.data || action.payload;
        const index = state.users.findIndex((u) => u._id === updatedUser._id);
        if (index !== -1) {
          state.users[index] = updatedUser;
        }
      })
      .addCase(approveUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true; state.errorMessage = action.payload;
      })
      // Update user role
      .addCase(updateUserRole.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateUserRole.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const updatedUser = action.payload.data || action.payload;
        const index = state.users.findIndex((u) => u._id === updatedUser._id);
        if (index !== -1) {
          state.users[index] = updatedUser;
        }
      })
      .addCase(updateUserRole.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true; state.errorMessage = action.payload;
      })
      // Get all co-admins
      .addCase(getAllCoAdmins.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllCoAdmins.fulfilled, (state, action) => {
        state.isLoading = false;
        state.coAdmins = action.payload.data || action.payload;
      })
      .addCase(getAllCoAdmins.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true; state.errorMessage = action.payload;
      })
      // Create co-admin
      .addCase(createCoAdmin.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createCoAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.coAdmins.push(action.payload.data || action.payload);
      })
      .addCase(createCoAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true; state.errorMessage = action.payload;
      })
      // Delete co-admin
      .addCase(deleteCoAdmin.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteCoAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.coAdmins = state.coAdmins.filter((c) => c._id !== action.payload);
      })
      .addCase(deleteCoAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true; state.errorMessage = action.payload;
      })
      // Get all applications
      .addCase(getAllApplications.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllApplications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.applications =
          action.payload.data?.applications ||
          action.payload.applications ||
          action.payload.data ||
          [];
      })
      .addCase(getAllApplications.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true; state.errorMessage = action.payload;
      })
      // Get application by ID
      .addCase(getApplicationById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getApplicationById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.application = action.payload.data || action.payload;
      })
      .addCase(getApplicationById.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true; state.errorMessage = action.payload;
      })
      // Update application status
      .addCase(updateApplicationStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateApplicationStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.application = action.payload.data || action.payload;
        const index = state.applications.findIndex(
          (a) => a._id === state.application._id
        );
        if (index !== -1) {
          state.applications[index] = state.application;
        }
      })
      .addCase(updateApplicationStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true; state.errorMessage = action.payload;
      })
      // Get all messages
      .addCase(getAllMessages.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages =
          action.payload.data?.messages ||
          action.payload.messages ||
          action.payload.data ||
          [];
      })
      .addCase(getAllMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true; state.errorMessage = action.payload;
      })
      // Get message by ID
      .addCase(getMessageById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getMessageById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = action.payload.data || action.payload;
      })
      .addCase(getMessageById.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true; state.errorMessage = action.payload;
      })
      // Mark message as read
      .addCase(markMessageAsRead.fulfilled, (state, action) => {
        const updatedMessage = action.payload.data || action.payload;
        const index = state.messages.findIndex(
          (m) => m._id === updatedMessage._id
        );
        if (index !== -1) {
          state.messages[index] = updatedMessage;
        }
      })
      // Update message status
      .addCase(updateMessageStatus.fulfilled, (state, action) => {
        const updatedMessage = action.payload.data || action.payload;
        const index = state.messages.findIndex(
          (m) => m._id === updatedMessage._id
        );
        if (index !== -1) {
          state.messages[index] = updatedMessage;
        }
      })
      // Reply to message
      .addCase(replyToMessage.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(replyToMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = action.payload.data || action.payload;
        const index = state.messages.findIndex(
          (m) => m._id === state.message._id
        );
        if (index !== -1) {
          state.messages[index] = state.message;
        }
      })
      .addCase(replyToMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true; state.errorMessage = action.payload;
      })
      // Delete message
      .addCase(deleteMessage.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.messages = state.messages.filter((m) => m._id !== action.payload);
      })
      .addCase(deleteMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true; state.errorMessage = action.payload;
      })
      // Get admin statistics
      .addCase(getAdminStatistics.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAdminStatistics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.statistics = action.payload.data || action.payload;
      })
      .addCase(getAdminStatistics.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true; state.errorMessage = action.payload;
      });
  },
});

export const {
  resetAdmin,
  clearAdminMessages,
  clearUser,
  clearApplication,
  clearMessage,
} = adminSlice.actions;
export default adminSlice.reducer;

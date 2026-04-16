import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as messageService from "../../api/messageService";

const initialState = {
  messages: [],
  message: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  errorMessage: "",
};

// Send contact message
export const sendContactMessage = createAsyncThunk(
  "messages/sendContact",
  async (messageData, thunkAPI) => {
    try {
      return await messageService.sendContactMessage(messageData);
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

// Get user's messages
export const getMyMessages = createAsyncThunk(
  "messages/getMyMessages",
  async (_, thunkAPI) => {
    try {
      return await messageService.getMyMessages();
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

// Get single message
export const getMessage = createAsyncThunk(
  "messages/getMessage",
  async (id, thunkAPI) => {
    try {
      return await messageService.getMessage(id);
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

export const messageSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    resetMessages: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.errorMessage = "";
    },
    clearMessage: (state) => {
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Send contact message
      .addCase(sendContactMessage.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
      })
      .addCase(sendContactMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.messages.unshift(action.payload.data);
      })
      .addCase(sendContactMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage = action.payload;
      })
      // Get my messages
      .addCase(getMyMessages.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getMyMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages = action.payload.data || [];
      })
      .addCase(getMyMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage = action.payload;
      })
      // Get single message
      .addCase(getMessage.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = action.payload.data;
      })
      .addCase(getMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage = action.payload;
      });
  },
});

export const { resetMessages, clearMessage } = messageSlice.actions;
export default messageSlice.reducer;

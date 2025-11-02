import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import cartReducer from "./slices/cartSlice";
import petReducer from "./slices/petSlice";
import productReducer from "./slices/productSlice";
import orderReducer from "./slices/orderSlice";
import appointmentReducer from "./slices/appointmentSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    pets: petReducer,
    products: productReducer,
    orders: orderReducer,
    appointments: appointmentReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }),
});

export default store;

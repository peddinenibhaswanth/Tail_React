import React, { useEffect } from "react";
import { Alert as BootstrapAlert } from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import { reset as resetAuth } from "../../redux/slices/authSlice";
import { resetCart } from "../../redux/slices/cartSlice";
import { resetPets } from "../../redux/slices/petSlice";
import { resetProducts } from "../../redux/slices/productSlice";
import { resetOrders } from "../../redux/slices/orderSlice";
import { resetAppointments } from "../../redux/slices/appointmentSlice";

const Alert = () => {
  const dispatch = useDispatch();

  const {
    isError: authError,
    isSuccess: authSuccess,
    message: authMessage,
  } = useSelector((state) => state.auth);
  const { isError: cartError, message: cartMessage } = useSelector(
    (state) => state.cart
  );
  const {
    isError: petError,
    isSuccess: petSuccess,
    message: petMessage,
  } = useSelector((state) => state.pets);
  const {
    isError: productError,
    isSuccess: productSuccess,
    message: productMessage,
  } = useSelector((state) => state.products);
  const {
    isError: orderError,
    isSuccess: orderSuccess,
    message: orderMessage,
  } = useSelector((state) => state.orders);
  const {
    isError: appointmentError,
    isSuccess: appointmentSuccess,
    message: appointmentMessage,
  } = useSelector((state) => state.appointments);

  const alerts = [];

  if (authError && authMessage)
    alerts.push({ type: "danger", message: authMessage, reset: resetAuth });
  if (authSuccess && authMessage)
    alerts.push({ type: "success", message: authMessage, reset: resetAuth });
  // Only show cart errors if it's not a fetch error (show success messages for add to cart)
  if (cartError && cartMessage && !cartMessage.toLowerCase().includes("fetch"))
    alerts.push({ type: "danger", message: cartMessage, reset: resetCart });
  // Show cart success messages (like "Item added to cart!")
  if (!cartError && cartMessage && cartMessage.toLowerCase().includes("added"))
    alerts.push({ type: "success", message: cartMessage, reset: resetCart });
  if (petError && petMessage)
    alerts.push({ type: "danger", message: petMessage, reset: resetPets });
  if (petSuccess && petMessage)
    alerts.push({ type: "success", message: petMessage, reset: resetPets });
  if (productError && productMessage)
    alerts.push({
      type: "danger",
      message: productMessage,
      reset: resetProducts,
    });
  if (productSuccess && productMessage)
    alerts.push({
      type: "success",
      message: productMessage,
      reset: resetProducts,
    });
  if (orderError && orderMessage)
    alerts.push({ type: "danger", message: orderMessage, reset: resetOrders });
  if (orderSuccess && orderMessage)
    alerts.push({ type: "success", message: orderMessage, reset: resetOrders });
  if (appointmentError && appointmentMessage)
    alerts.push({
      type: "danger",
      message: appointmentMessage,
      reset: resetAppointments,
    });
  if (appointmentSuccess && appointmentMessage)
    alerts.push({
      type: "success",
      message: appointmentMessage,
      reset: resetAppointments,
    });

  useEffect(() => {
    if (alerts.length > 0) {
      const timer = setTimeout(() => {
        alerts.forEach((alert) => dispatch(alert.reset()));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alerts, dispatch]);

  if (alerts.length === 0) return null;

  return (
    <div className="alert-container">
      {alerts.map((alert, index) => (
        <BootstrapAlert
          key={index}
          variant={alert.type}
          dismissible
          onClose={() => dispatch(alert.reset())}
          className="mb-2"
        >
          {alert.message}
        </BootstrapAlert>
      ))}
    </div>
  );
};

export default Alert;

import axios from "./axios";

// Submit a contact message
export const sendContactMessage = async (messageData) => {
  const response = await axios.post("/api/messages/contact", messageData);
  return response.data;
};

// Get user's messages
export const getMyMessages = async () => {
  const response = await axios.get("/api/messages/my-messages");
  return response.data;
};

// Get single message
export const getMessage = async (id) => {
  const response = await axios.get(`/api/messages/${id}`);
  return response.data;
};

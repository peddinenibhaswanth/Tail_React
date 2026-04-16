import axios from "./axios";

// Get all pets
export const getPets = async (query) => {
  const response = await axios.get("/api/pets", { params: query });
  return response.data;
};

// Get single pet
export const getPet = async (id) => {
  const response = await axios.get(`/api/pets/${id}`);
  return response.data;
};

// Apply for adoption
export const applyForAdoption = async (petId, applicationData) => {
  const response = await axios.post(
    `/api/pets/${petId}/apply`,
    applicationData
  );
  return response.data;
};

// Get user's adoption applications
export const getUserApplications = async () => {
  const response = await axios.get("/api/pets/applications/my");
  return response.data;
};

// Create a new pet (Admin)
export const createPet = async (petData) => {
  const response = await axios.post("/api/pets", petData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// Update a pet (Admin)
export const updatePet = async (id, petData) => {
  const response = await axios.put(`/api/pets/${id}`, petData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// Delete a pet (Admin)
export const deletePet = async (id) => {
  const response = await axios.delete(`/api/pets/${id}`);
  return response.data;
};

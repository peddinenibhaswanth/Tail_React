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

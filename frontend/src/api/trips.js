import client from "./client";

export const listTrips = async (params = {}) => {
  const response = await client.get("/trips/", { params });
  return response.data;
};

export const createTrip = async (data) => {
  const response = await client.post("/trips/", data);
  return response.data;
};

export const dispatchTrip = async (id) => {
  const response = await client.post(`/trips/${id}/dispatch/`);
  return response.data;
};

export const completeTrip = async (id, data = {}) => {
  const response = await client.post(`/trips/${id}/complete/`, data);
  return response.data;
};

export const cancelTrip = async (id, data = {}) => {
  const response = await client.post(`/trips/${id}/cancel/`, data);
  return response.data;
};

export const updateTrip = async (id, data) => {
  const response = await client.patch(`/trips/${id}/`, data);
  return response.data;
};

export const deleteTrip = async (id) => {
  const response = await client.delete(`/trips/${id}/`);
  return response.data;
};

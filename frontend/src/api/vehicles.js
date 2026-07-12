import client from './client'

export const listVehicles = async (params) => {
  const response = await client.get('/vehicles/', { params })
  return response.data
}

export const createVehicle = async (data) => {
  const response = await client.post('/vehicles/', data)
  return response.data
}

export const updateVehicle = async (id, data) => {
  const response = await client.patch(`/vehicles/${id}/`, data)
  return response.data
}

export const deleteVehicle = async (id) => {
  const response = await client.delete(`/vehicles/${id}/`)
  return response.data
}

export const listAvailableVehicles = async () => {
  const response = await client.get('/vehicles/available/')
  return response.data
}

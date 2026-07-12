import client from './client'

export const listTrips = async (params) => {
  const response = await client.get('/trips/', { params })
  return response.data
}

export const createTrip = async (data) => {
  const response = await client.post('/trips/', data)
  return response.data
}

export const updateTrip = async (id, data) => {
  const response = await client.patch(`/trips/${id}/`, data)
  return response.data
}

export const deleteTrip = async (id) => {
  const response = await client.delete(`/trips/${id}/`)
  return response.data
}

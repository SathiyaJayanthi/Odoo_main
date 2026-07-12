import client from './client'

export const listDrivers = async (params) => {
  const response = await client.get('/drivers/', { params })
  return response.data
}

export const createDriver = async (data) => {
  const response = await client.post('/drivers/', data)
  return response.data
}

export const updateDriver = async (id, data) => {
  const response = await client.patch(`/drivers/${id}/`, data)
  return response.data
}

export const listAvailableDrivers = async () => {
  const response = await client.get('/drivers/available/')
  return response.data
}

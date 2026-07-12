import client from './client'

export const listMaintenance = async (params) => {
  const response = await client.get('/maintenance/', { params })
  return response.data
}

export const openMaintenance = async (data) => {
  const response = await client.post('/maintenance/', data)
  return response.data
}

export const closeMaintenance = async (id, data) => {
  const response = await client.post(`/maintenance/${id}/close/`, data)
  return response.data
}

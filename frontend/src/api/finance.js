import client from './client'

export const listFuelLogs = async (params) => {
  const response = await client.get('/fuel-logs/', { params })
  return response.data
}

export const createFuelLog = async (data) => {
  const response = await client.post('/fuel-logs/', data)
  return response.data
}

export const listExpenses = async (params) => {
  const response = await client.get('/expenses/', { params })
  return response.data
}

export const createExpense = async (data) => {
  const response = await client.post('/expenses/', data)
  return response.data
}

export const getCostSummary = async (vehicleId) => {
  const response = await client.get(`/vehicles/${vehicleId}/cost-summary/`)
  return response.data
}

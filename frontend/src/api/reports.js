import client from './client'

export const getDashboardStats = async () => {
  const response = await client.get('/reports/dashboard/')
  return response.data
}

export const getFuelEfficiency = async () => {
  const response = await client.get('/reports/fuel-efficiency/')
  return response.data
}

export const getROI = async () => {
  const response = await client.get('/reports/roi/')
  return response.data
}

export const downloadCSVReport = async () => {
  const response = await client.get('/reports/export/', {
    params: { type: 'csv' },
    responseType: 'blob'
  })
  return response.data
}

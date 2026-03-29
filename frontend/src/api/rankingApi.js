import api from './axios'

export async function getGlobalRanking(limit = 10) {
  const { data } = await api.get('/rankings/global', { params: { limit } })
  return data.data
}

export async function getWeeklyRanking(limit = 10) {
  const { data } = await api.get('/rankings/weekly', { params: { limit } })
  return data.data
}

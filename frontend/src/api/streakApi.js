import api from './axios'

export async function getStreak() {
  const { data } = await api.get('/streak/me')
  return data.data
}

export async function checkIn() {
  const { data } = await api.post('/streak/checkin')
  return data.data
}

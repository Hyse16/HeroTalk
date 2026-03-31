import api from './axios'

export const getQuestions = (page = 0) => api.get(`/admin/questions?page=${page}&size=20`)
export const createQuestion = (data) => api.post('/admin/questions', data)
export const updateQuestion = (id, data) => api.put(`/admin/questions/${id}`, data)
export const deleteQuestion = (id) => api.delete(`/admin/questions/${id}`)
export const uploadQuestionsCsv = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/admin/questions/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export const getMonsters = (page = 0) => api.get(`/admin/monsters?page=${page}&size=20`)
export const createMonster = (data) => api.post('/admin/monsters', data)
export const updateMonster = (id, data) => api.put(`/admin/monsters/${id}`, data)
export const deleteMonster = (id) => api.delete(`/admin/monsters/${id}`)

export const getItems = (page = 0) => api.get(`/admin/items?page=${page}&size=20`)
export const createItem = (data) => api.post('/admin/items', data)
export const updateItem = (id, data) => api.put(`/admin/items/${id}`, data)
export const deleteItem = (id) => api.delete(`/admin/items/${id}`)

export const getCosmetics = (page = 0) => api.get(`/admin/cosmetics?page=${page}&size=20`)
export const createCosmetic = (data) => api.post('/admin/cosmetics', data)
export const updateCosmetic = (id, data) => api.put(`/admin/cosmetics/${id}`, data)
export const deleteCosmetic = (id) => api.delete(`/admin/cosmetics/${id}`)

export const getUsers = (page = 0) => api.get(`/admin/users?page=${page}&size=20`)
export const toggleUserStatus = (id) => api.patch(`/admin/users/${id}/status`)

export const getGlobalRanking = () => api.get('/admin/rankings/global')
export const getWeeklyRanking = () => api.get('/admin/rankings/weekly')
export const clearWeeklyRanking = () => api.delete('/admin/rankings/weekly')

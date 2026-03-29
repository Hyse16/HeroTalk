import api from './axios'

export async function getTodayQuests() {
  const { data } = await api.get('/quests/today')
  return data.data
}

export async function claimQuestReward(userQuestId) {
  const { data } = await api.post(`/quests/${userQuestId}/claim`)
  return data.data
}

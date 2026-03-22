import api from './axios'

export async function getDungeons() {
  const res = await api.get('/dungeons')
  return res.data.data
  // Returns: [{ id, name, toeicPart, requiredLevel, region, description, isWeeklyBoss }]
}

export async function getDungeonMonsters(dungeonId) {
  const res = await api.get(`/dungeons/${dungeonId}/monsters`)
  return res.data.data
  // Returns: [{ id, name, monsterType, hp, attackPower, expReward, goldReward, toeicPart }]
}

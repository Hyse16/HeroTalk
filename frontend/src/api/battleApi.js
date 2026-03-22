import api from './axios'

export async function startBattle(monsterId) {
  const res = await api.post('/battles/start', { monsterId })
  return res.data.data
  // Returns: { battleId, monsterName, monsterMaxHp, monsterCurrentHp, characterMaxHp, characterCurrentHp, question }
}

export async function processTurn(battleId, action, score = null) {
  const body = { action }
  if (score !== null) body.score = score
  const res = await api.post(`/battles/${battleId}/turn`, body)
  return res.data.data
  // Returns: { turnNumber, damageDealt, damageTaken, isCritical, monsterCurrentHp, characterCurrentHp, battleEnded, result, expGained, goldGained, nextQuestion }
}

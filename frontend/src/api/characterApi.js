import api from './axios'

export async function createCharacter(name, job, gender) {
  const response = await api.post('/characters', { name, job, gender })
  return response.data.data // CharacterResponse
}

export async function getCharacter() {
  const res = await api.get('/characters/me')
  return res.data.data
  // Returns: { id, name, job, gender, level, exp, gold, maxHp, ... }
}

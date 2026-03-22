import api from '@/api/axios'

export async function checkCharacterExists() {
  const response = await api.get('/characters/me')
  return response.data.data // CharacterResponse
}

export async function createCharacter(name, job) {
  const response = await api.post('/characters', { name, job })
  return response.data.data // CharacterResponse
}

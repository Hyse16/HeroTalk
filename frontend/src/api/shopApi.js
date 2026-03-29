import api from './axios'

export async function getItems() {
  const { data } = await api.get('/shop/items')
  return data.data
}

export async function getCosmetics() {
  const { data } = await api.get('/shop/cosmetics')
  return data.data
}

export async function buyItem(itemId, quantity = 1) {
  const { data } = await api.post(`/shop/items/${itemId}/buy`, null, {
    params: { quantity },
  })
  return data.data
}

export async function buyCosmetic(cosmeticId) {
  const { data } = await api.post(`/shop/cosmetics/${cosmeticId}/buy`)
  return data.data
}

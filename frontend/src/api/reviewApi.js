import api from './axios'

export async function getReviews() {
  const { data } = await api.get('/reviews')
  return data.data
}

export async function submitReview(reviewId, transcript) {
  const { data } = await api.post(`/reviews/${reviewId}/submit`, { transcript })
  return data.data
}

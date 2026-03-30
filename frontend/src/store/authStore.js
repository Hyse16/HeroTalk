import { create } from 'zustand'
import useCharacterStore from './characterStore'

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  accessToken: localStorage.getItem('accessToken') || null,
  isAuthenticated: !!localStorage.getItem('accessToken'),

  login: (user, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken)
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
    if (user) localStorage.setItem('user', JSON.stringify(user))
    set({ user, accessToken, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    useCharacterStore.getState().clearCharacter()
    set({ user: null, accessToken: null, isAuthenticated: false })
  },

  setAccessToken: (accessToken) => {
    localStorage.setItem('accessToken', accessToken)
    set({ accessToken })
  },

  setUser: (user) => {
    if (user) localStorage.setItem('user', JSON.stringify(user))
    set({ user })
  },
}))

export default useAuthStore

import { create } from 'zustand'

const useCharacterStore = create((set) => ({
  character: null,
  setCharacter: (character) => set({ character }),
  clearCharacter: () => set({ character: null }),
}))

export default useCharacterStore

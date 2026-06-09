import { create } from 'zustand'

interface ProfessionalFilterState {
  selectedProfessionalId: number | null
  setSelectedProfessionalId: (id: number | null) => void
}

export const useProfessionalFilterStore = create<ProfessionalFilterState>((set) => ({
  selectedProfessionalId: null,
  setSelectedProfessionalId: (id) => set({ selectedProfessionalId: id }),
}))

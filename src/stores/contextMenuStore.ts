import { create } from 'zustand';

interface ContextMenuState {
  activeMenuId: string | null;
  setActiveMenu: (id: string | null) => void;
  clearActiveMenu: () => void;
}

export const useContextMenuStore = create<ContextMenuState>((set) => ({
  activeMenuId: null,
  
  setActiveMenu: (id) => set({ activeMenuId: id }),
  
  clearActiveMenu: () => set({ activeMenuId: null }),
}));
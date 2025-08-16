import { create } from 'zustand';

interface LinkPreviewState {
  isOpen: boolean;
  url: string;
  openLinkPreview: (url: string) => void;
  closeLinkPreview: () => void;
}

export const useLinkPreviewStore = create<LinkPreviewState>((set) => ({
  isOpen: false,
  url: '',
  openLinkPreview: (url: string) => set({ isOpen: true, url }),
  closeLinkPreview: () => set({ isOpen: false, url: '' }),
}));
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Space = {
  id: string;
  name: string;
  description?: string;
  color?: string;
  stats: {
    tasks: number;
    notes: number;
    canvas: number;
    agents: number;
  };
  createdAt: string;
  updatedAt: string;
  preferences?: {
    viewMode?: 'grid' | 'list';
    sortBy?: 'name' | 'type' | 'updated' | 'created';
    sortOrder?: 'asc' | 'desc';
  };
};

interface SpacesStore {
  spaces: Space[];
  addSpace: (space: Omit<Space, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSpace: (id: string, updates: Partial<Omit<Space, 'id'>>) => void;
  deleteSpace: (id: string) => void;
  getSpace: (id: string) => Space | undefined;
}

// Initial default spaces
const defaultSpaces: Space[] = [
  {
    id: 'space-1',
    name: 'Marketing',
    description: 'Campaign planning and assets',
    color: 'var(--accent-primary)',
    stats: { tasks: 42, notes: 18, canvas: 4, agents: 2 },
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'space-2',
    name: 'Product',
    description: 'Feature specs and delivery',
    color: 'var(--indigo-500)',
    stats: { tasks: 73, notes: 25, canvas: 6, agents: 3 },
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'space-3',
    name: 'Research',
    description: 'Insights, studies, and analysis',
    color: 'var(--purple-500)',
    stats: { tasks: 15, notes: 40, canvas: 3, agents: 1 },
    createdAt: new Date('2024-02-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const useSpacesStore = create<SpacesStore>()(
  persist(
    (set, get) => ({
      spaces: defaultSpaces,
      
      addSpace: (spaceData) => {
        const newSpace: Space = {
          ...spaceData,
          id: `space-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          spaces: [newSpace, ...state.spaces],
        }));
      },
      
      updateSpace: (id, updates) => {
        set((state) => ({
          spaces: state.spaces.map((space) =>
            space.id === id
              ? { ...space, ...updates, updatedAt: new Date().toISOString() }
              : space
          ),
        }));
      },
      
      deleteSpace: (id) => {
        set((state) => ({
          spaces: state.spaces.filter((space) => space.id !== id),
        }));
      },
      
      getSpace: (id) => {
        return get().spaces.find((space) => space.id === id);
      },
    }),
    {
      name: 'spaces-storage',
      version: 2,
    }
  )
);
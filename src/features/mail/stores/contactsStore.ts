import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { contactsService } from '../services/contactsService';
import { useMailStore } from './mailStore';

export interface Contact {
  id: string;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  notes?: string;
  source?: 'gmail' | 'manual' | 'imported';
}

interface ContactsState {
  contacts: Contact[];
  recentContacts: Contact[];
  isLoading: boolean;
  lastSync: Date | null;
  
  // Actions
  setContacts: (contacts: Contact[]) => void;
  addContact: (contact: Contact) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  searchContacts: (query: string) => Contact[];
  addRecentContact: (contact: Contact) => void;
  syncGmailContacts: () => Promise<void>;
  clearContacts: () => void;
}

export const useContactsStore = create<ContactsState>()(
  persist(
    (set, get) => ({
      contacts: [],
      recentContacts: [],
      isLoading: false,
      lastSync: null,

      setContacts: (contacts) => set({ contacts }),

      addContact: (contact) =>
        set((state) => ({
          contacts: [...state.contacts, contact],
        })),

      updateContact: (id, updates) =>
        set((state) => ({
          contacts: state.contacts.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      deleteContact: (id) =>
        set((state) => ({
          contacts: state.contacts.filter((c) => c.id !== id),
        })),

      searchContacts: (query) => {
        const { contacts, recentContacts } = get();
        const searchTerm = query.toLowerCase().trim();
        
        // Filter out any mock data that might have been cached
        const validContacts = contacts.filter(c => 
          !c.email.includes('example.com') && 
          !c.email.includes('company.com') &&
          c.name !== 'John Doe' &&
          c.name !== 'Jane Smith' &&
          c.name !== 'Bob Johnson'
        );
        
        if (!searchTerm) {
          // Return recent contacts when no query
          return recentContacts.filter(c => 
            !c.email.includes('example.com') && 
            !c.email.includes('company.com')
          ).slice(0, 5);
        }

        // Search in valid contacts only
        const results = validContacts.filter((contact) => {
          const searchableText = `${contact.name} ${contact.email} ${contact.company || ''}`.toLowerCase();
          return searchableText.includes(searchTerm);
        });

        // Sort alphabetically
        return results.sort((a, b) => a.name.localeCompare(b.name))
          .slice(0, 10); // Limit to 10 suggestions
      },

      addRecentContact: (contact) =>
        set((state) => {
          const existing = state.recentContacts.findIndex(c => c.email === contact.email);
          let newRecent = [...state.recentContacts];
          
          if (existing >= 0) {
            // Move to front if already exists
            newRecent.splice(existing, 1);
          }
          
          newRecent.unshift(contact);
          // Keep only last 20 recent contacts
          newRecent = newRecent.slice(0, 20);
          
          // Update in main contacts
          const updatedContacts = state.contacts;
          
          return {
            recentContacts: newRecent,
            contacts: updatedContacts,
          };
        }),

      syncGmailContacts: async () => {
        console.log('[ContactsStore] Starting sync...');
        set({ isLoading: true });
        try {
          // Get current account from mail store
          const mailStore = useMailStore.getState();
          const currentAccount = mailStore.getCurrentAccount();
          
          console.log('[ContactsStore] Current account:', currentAccount);
          
          if (!currentAccount) {
            console.warn('[ContactsStore] No account selected, skipping sync');
            set({ isLoading: false });
            return;
          }

          // Fetch contacts from Gmail API
          console.log('[ContactsStore] Calling fetchGmailContacts with account:', currentAccount.id);
          const gmailContacts = await contactsService.fetchGmailContacts(
            currentAccount.id,
            500 // Fetch up to 500 contacts
          );

          console.log('[ContactsStore] Received contacts:', gmailContacts);

          // Merge with existing contacts
          const existingContacts = get().contacts;
          const mergedContacts = contactsService.mergeContacts(
            existingContacts,
            gmailContacts
          );

          set({ 
            contacts: mergedContacts,
            lastSync: new Date(),
            isLoading: false,
          });
          
          console.log(`[ContactsStore] Synced ${gmailContacts.length} contacts from Gmail, total now: ${mergedContacts.length}`);
        } catch (error) {
          console.error('[ContactsStore] Failed to sync contacts:', error);
          set({ isLoading: false });
        }
      },

      clearContacts: () => {
        // Clear localStorage completely
        if (typeof window !== 'undefined') {
          localStorage.removeItem('contacts-storage');
        }
        set({
          contacts: [],
          recentContacts: [],
          lastSync: null,
        });
      },
    }),
    {
      name: 'contacts-storage',
      partialize: (state) => ({
        contacts: state.contacts,
        recentContacts: state.recentContacts.slice(0, 10), // Only persist last 10 recent
        lastSync: state.lastSync,
      }),
    }
  )
);
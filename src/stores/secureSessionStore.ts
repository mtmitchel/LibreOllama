/**
 * Secure Session Store
 * 
 * This store manages session state without exposing sensitive account data
 * to localStorage. Only a session ID is persisted, and all account data
 * is rehydrated from secure storage on startup.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { invoke } from '@tauri-apps/api/core';
import { logger } from '../core/lib/logger';

export interface SessionState {
  // Non-sensitive session data
  sessionId: string | null;
  currentAccountId: string | null;
  isAuthenticated: boolean;
  lastActivityTime: number | null;
  
  // Session management
  initializeSession: () => Promise<void>;
  setCurrentAccount: (accountId: string | null) => void;
  clearSession: () => void;
  updateActivity: () => void;
  
  // Account data (NOT persisted, loaded from secure storage)
  accounts: Map<string, {
    email: string;
    name: string;
    picture?: string;
  }>;
  
  // Helper to get current account data
  getCurrentAccountData: () => { email: string; name: string; picture?: string } | null;
}

export const useSecureSessionStore = create<SessionState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      sessionId: null,
      currentAccountId: null,
      isAuthenticated: false,
      lastActivityTime: null,
      accounts: new Map(),
      
      // Initialize session on app startup
      initializeSession: async () => {
        try {
          logger.info('[SecureSession] Initializing session');
          
          // Generate or retrieve session ID
          let sessionId = get().sessionId;
          if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            set(state => {
              state.sessionId = sessionId;
            });
          }
          
          // Load account data from secure storage
          // Use a default user ID for now - in production, this should come from user authentication
          const userId = 'default_user';
          const storedAccounts = await invoke('get_gmail_accounts_secure', { userId }) as Array<{
            id: string;
            email: string;
            name: string;
            picture?: string;
          }>;
          
          const accountsMap = new Map();
          storedAccounts.forEach(account => {
            accountsMap.set(account.id, {
              email: account.email,
              name: account.name,
              picture: account.picture
            });
          });
          
          set(state => {
            state.accounts = accountsMap;
            state.isAuthenticated = accountsMap.size > 0;
            
            // Validate current account ID
            if (state.currentAccountId && !accountsMap.has(state.currentAccountId)) {
              state.currentAccountId = null;
            }
            
            // Set first account as current if none selected
            if (!state.currentAccountId && accountsMap.size > 0) {
              state.currentAccountId = Array.from(accountsMap.keys())[0];
            }
          });
          
          logger.info('[SecureSession] Session initialized', {
            sessionId,
            accountCount: accountsMap.size,
            currentAccountId: get().currentAccountId
          });
        } catch (error) {
          logger.error('[SecureSession] Failed to initialize session', error);
        }
      },
      
      // Set current account
      setCurrentAccount: (accountId: string | null) => {
        set(state => {
          if (accountId && !state.accounts.has(accountId)) {
            logger.warn('[SecureSession] Attempted to set invalid account as current', { accountId });
            return;
          }
          
          state.currentAccountId = accountId;
          state.lastActivityTime = Date.now();
          
          logger.info('[SecureSession] Current account changed', { accountId });
        });
      },
      
      // Clear session
      clearSession: () => {
        set(state => {
          state.sessionId = null;
          state.currentAccountId = null;
          state.isAuthenticated = false;
          state.lastActivityTime = null;
          state.accounts.clear();
          
          logger.info('[SecureSession] Session cleared');
        });
      },
      
      // Update activity timestamp
      updateActivity: () => {
        set(state => {
          state.lastActivityTime = Date.now();
        });
      },
      
      // Get current account data
      getCurrentAccountData: () => {
        const state = get();
        if (!state.currentAccountId) return null;
        
        return state.accounts.get(state.currentAccountId) || null;
      }
    })),
    {
      name: 'libre-ollama-session',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist non-sensitive session data
        sessionId: state.sessionId,
        currentAccountId: state.currentAccountId,
        lastActivityTime: state.lastActivityTime
        // Note: accounts, isAuthenticated are NOT persisted
      })
    }
  )
);
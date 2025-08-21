import React, { useEffect, useState } from 'react';
import { initializeMailStore, useMailStore } from '../stores/mailStore';
import { initializeGoogleCalendarStore } from '../../../stores/googleCalendarStore';
// Tasks are now managed through unified task store
import { gmailAutoSync } from '../../../services/gmailAutoSync';
import { googleCalendarAutoSync } from '../../../services/googleCalendarAutoSync';
import { logger } from '../../../core/lib/logger';

interface MailStoreProviderProps {
  children: React.ReactNode;
}

export function MailStoreProvider({ children }: MailStoreProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const isHydrated = useMailStore((state) => state.isHydrated);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        logger.debug('🔄 [PROVIDER] Initializing all Google stores...');
        // Initialize all stores in parallel
        await Promise.all([
          initializeMailStore(),
          initializeGoogleCalendarStore(),
          // Tasks initialization handled by unified store
        ]);
        if (mounted) {
          setIsInitialized(true);
          logger.debug('✅ [PROVIDER] All stores initialized');
          
          // Auto-sync is automatically started by the services when authentication is detected
          logger.debug('🔄 [PROVIDER] Auto-sync services ready');
        }
      } catch (error) {
        logger.error('❌ [PROVIDER] Failed to initialize stores:', error);
        if (mounted) {
          setIsInitialized(true); // Still set to true to avoid infinite loading
        }
      }
    }

    // Only initialize once
    if (!isInitialized && !isHydrated) {
      initialize();
    } else if (isHydrated) {
      setIsInitialized(true);
    }

    return () => {
      mounted = false;
      // Cleanup is handled by the window beforeunload event in the sync services
    };
  }, [isInitialized, isHydrated]);

  // Show loading state while initializing
  if (!isInitialized || !isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 size-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
import React, { useEffect, useState } from 'react';
import { RefreshCw, Check, AlertCircle } from 'lucide-react';
import { useMailStore } from '../features/mail/stores/mailStore';
import { useGoogleCalendarStore } from '../stores/googleCalendarStore';
import { gmailAutoSync } from '../services/gmailAutoSync';
import { googleCalendarAutoSync } from '../services/googleCalendarAutoSync';
import { logger } from '../core/lib/logger';

interface SyncStatusProps {
  className?: string;
  showDetails?: boolean;
}

export function SyncStatus({ className = '', showDetails = true }: SyncStatusProps) {
  const [syncStatus, setSyncStatus] = useState({
    gmail: { isRunning: false, lastSync: null as Date | null },
    calendar: { isRunning: false, lastSync: null as Date | null },
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Get last sync times from stores
  const mailLastSync = useMailStore((state) => state.lastSyncTime);
  const calendarLastSync = useGoogleCalendarStore((state) => state.lastSyncAt);
  const isMailLoading = useMailStore((state) => state.isLoadingMessages);
  const isCalendarLoading = useGoogleCalendarStore((state) => state.isLoading);

  useEffect(() => {
    // Update sync status
    const updateStatus = () => {
      const gmailStatus = gmailAutoSync.getStatus();
      const calendarStatus = googleCalendarAutoSync.getStatus();
      
      setSyncStatus({
        gmail: {
          isRunning: gmailStatus.isRunning,
          lastSync: mailLastSync,
        },
        calendar: {
          isRunning: calendarStatus.isRunning,
          lastSync: calendarLastSync,
        },
      });
      
      setIsSyncing(isMailLoading || isCalendarLoading);
    };

    updateStatus();
    
    // Update every second when syncing, every 10 seconds otherwise
    const interval = setInterval(updateStatus, isSyncing ? 1000 : 10000);
    
    return () => clearInterval(interval);
  }, [mailLastSync, calendarLastSync, isMailLoading, isCalendarLoading, isSyncing]);

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getLastSyncTime = () => {
    const times = [mailLastSync, calendarLastSync]
      .filter(Boolean)
      .map(t => t instanceof Date ? t : t ? new Date(t) : null)
      .filter((t): t is Date => t !== null);
    if (times.length === 0) return null;
    return new Date(Math.max(...times.map(t => t.getTime())));
  };

  const lastSync = getLastSyncTime();
  const hasError = false; // Could add error detection logic here

  if (!showDetails) {
    // Simple icon-only view
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {isSyncing ? (
          <RefreshCw size={16} className="animate-spin text-accent-primary" />
        ) : hasError ? (
          <AlertCircle size={16} className="text-error" />
        ) : (
          <Check size={16} className="text-success" />
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 asana-text-sm ${className}`}>
      {isSyncing ? (
        <>
          <RefreshCw size={16} className="animate-spin text-accent-primary" />
          <span className="text-secondary">Syncing...</span>
        </>
      ) : (
        <>
          <Check size={16} className="text-success" />
          <span className="text-secondary">
            Last sync: {formatLastSync(lastSync)}
          </span>
        </>
      )}
    </div>
  );
}

export default SyncStatus;
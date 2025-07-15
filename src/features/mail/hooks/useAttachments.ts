import { useState, useEffect, useCallback } from 'react';
import { 
  GmailAttachment, 
  AttachmentDownload, 
  AttachmentPreview,
  AttachmentCache,
  AttachmentStorageStats,
  AttachmentStorageConfig 
} from '../types/attachments';
import { attachmentService } from '../services/attachmentService';

export interface UseAttachmentsOptions {
  autoCleanup?: boolean;
  enableCaching?: boolean;
  generateThumbnails?: boolean;
}

export interface UseAttachmentsReturn {
  // Download state
  downloads: Map<string, AttachmentDownload>;
  activeDownloads: AttachmentDownload[];
  
  // Cache state
  cacheEntries: AttachmentCache[];
  storageStats: AttachmentStorageStats | null;
  
  // Previews
  previews: Map<string, AttachmentPreview>;
  
  // Loading states
  isLoading: boolean;
  isDownloading: (attachmentId: string) => boolean;
  
  // Actions
  downloadAttachment: (accountId: string, messageId: string, attachmentId: string, options?: { forceDownload?: boolean; generateThumbnail?: boolean }) => Promise<AttachmentDownload>;
  cancelDownload: (downloadId: string) => void;
  previewAttachment: (attachmentId: string) => Promise<AttachmentPreview | null>;
  getCachedAttachment: (attachmentId: string) => AttachmentCache | undefined;
  clearCache: () => Promise<void>;
  cleanupExpired: () => Promise<void>;
  
  // Configuration
  updateConfig: (config: Partial<AttachmentStorageConfig>) => void;
  getConfig: () => AttachmentStorageConfig;
  
  // Statistics
  refreshStats: () => Promise<void>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

export const useAttachments = (options: UseAttachmentsOptions = {}): UseAttachmentsReturn => {
  const {
    autoCleanup = true,
    enableCaching = true,
    generateThumbnails = true,
  } = options;

  const [downloads, setDownloads] = useState<Map<string, AttachmentDownload>>(new Map());
  const [previews, setPreviews] = useState<Map<string, AttachmentPreview>>(new Map());
  const [cacheEntries, setCacheEntries] = useState<AttachmentCache[]>([]);
  const [storageStats, setStorageStats] = useState<AttachmentStorageStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get active downloads
  const activeDownloads = Array.from(downloads.values()).filter(d => 
    d.status === 'downloading' || d.status === 'pending'
  );

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        
        // Load cache entries
        const cache = attachmentService.getCacheEntries();
        setCacheEntries(cache);
        
        // Load storage stats
        const stats = await attachmentService.getStorageStats();
        setStorageStats(stats);
        
        // Load active downloads
        const activeDownloads = attachmentService.getAllDownloads();
        const downloadsMap = new Map();
        activeDownloads.forEach(download => {
          downloadsMap.set(download.id, download);
        });
        setDownloads(downloadsMap);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load attachment data');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Set up event listeners
  useEffect(() => {
    const handleDownloadEvent = (event: any) => {
      if (event.data?.download) {
        setDownloads(prev => new Map(prev.set(event.attachmentId, event.data.download)));
      }
    };

    const handleCacheUpdate = (event: any) => {
      if (event.data?.cacheEntry) {
        setCacheEntries(prev => {
          const updated = [...prev];
          const index = updated.findIndex(entry => entry.attachmentId === event.attachmentId);
          if (index >= 0) {
            updated[index] = event.data.cacheEntry;
          } else {
            updated.push(event.data.cacheEntry);
          }
          return updated;
        });
      }
    };

    const handleStorageClean = (event: any) => {
      // Refresh cache and stats after cleanup
      refreshStats();
      const cache = attachmentService.getCacheEntries();
      setCacheEntries(cache);
    };

    attachmentService.addEventListener('download_started', handleDownloadEvent);
    attachmentService.addEventListener('download_progress', handleDownloadEvent);
    attachmentService.addEventListener('download_completed', handleDownloadEvent);
    attachmentService.addEventListener('download_failed', handleDownloadEvent);
    attachmentService.addEventListener('cache_updated', handleCacheUpdate);
    attachmentService.addEventListener('storage_cleaned', handleStorageClean);

    return () => {
      attachmentService.removeEventListener('download_started', handleDownloadEvent);
      attachmentService.removeEventListener('download_progress', handleDownloadEvent);
      attachmentService.removeEventListener('download_completed', handleDownloadEvent);
      attachmentService.removeEventListener('download_failed', handleDownloadEvent);
      attachmentService.removeEventListener('cache_updated', handleCacheUpdate);
      attachmentService.removeEventListener('storage_cleaned', handleStorageClean);
    };
  }, []);

  // Auto cleanup if enabled
  useEffect(() => {
    if (autoCleanup) {
      const cleanup = () => {
        attachmentService.cleanupExpiredFiles();
      };

      // Cleanup on mount
      cleanup();

      // Cleanup every hour
      const interval = setInterval(cleanup, 60 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [autoCleanup]);

  const downloadAttachment = useCallback(async (
    accountId: string,
    messageId: string,
    attachmentId: string,
    options: { forceDownload?: boolean; generateThumbnail?: boolean } = {}
  ): Promise<AttachmentDownload> => {
    try {
      setError(null);
      
      const download = await attachmentService.downloadAttachment(
        accountId,
        messageId,
        attachmentId,
        {
          forceDownload: options.forceDownload,
          generateThumbnail: options.generateThumbnail ?? generateThumbnails,
        }
      );

      setDownloads(prev => new Map(prev.set(download.id, download)));
      
      return download;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Download failed';
      setError(errorMessage);
      throw err;
    }
  }, [generateThumbnails]);

  const cancelDownload = useCallback((downloadId: string) => {
    attachmentService.cancelDownload(downloadId);
    setDownloads(prev => {
      const updated = new Map(prev);
      const download = updated.get(downloadId);
      if (download) {
        download.status = 'cancelled';
        updated.set(downloadId, download);
      }
      return updated;
    });
  }, []);

  const previewAttachment = useCallback(async (attachmentId: string): Promise<AttachmentPreview | null> => {
    try {
      setError(null);
      
      const preview = await attachmentService.generatePreview(attachmentId);
      if (preview) {
        setPreviews(prev => new Map(prev.set(attachmentId, preview)));
      }
      
      return preview;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Preview generation failed';
      setError(errorMessage);
      return null;
    }
  }, []);

  const getCachedAttachment = useCallback((attachmentId: string): AttachmentCache | undefined => {
    return attachmentService.getCachedAttachment(attachmentId);
  }, []);

  const clearCache = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      
      // Clear all cache entries
      const cacheIds = cacheEntries.map(entry => entry.attachmentId);
      for (const attachmentId of cacheIds) {
        // This would need to be implemented in the service
        // await attachmentService.removeFromCache(attachmentId);
      }
      
      setCacheEntries([]);
      await refreshStats();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear cache';
      setError(errorMessage);
    }
  }, [cacheEntries]);

  const cleanupExpired = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      
      await attachmentService.cleanupExpiredFiles();
      
      // Refresh cache entries and stats
      const cache = attachmentService.getCacheEntries();
      setCacheEntries(cache);
      await refreshStats();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Cleanup failed';
      setError(errorMessage);
    }
  }, []);

  const updateConfig = useCallback((config: Partial<AttachmentStorageConfig>) => {
    attachmentService.updateConfig(config);
  }, []);

  const getConfig = useCallback((): AttachmentStorageConfig => {
    return attachmentService.getConfig();
  }, []);

  const refreshStats = useCallback(async (): Promise<void> => {
    try {
      const stats = await attachmentService.getStorageStats();
      setStorageStats(stats);
    } catch (err) {
      console.error('Failed to refresh storage stats:', err);
    }
  }, []);

  const isDownloading = useCallback((attachmentId: string): boolean => {
    return Array.from(downloads.values()).some(download => 
      download.attachmentId === attachmentId && 
      (download.status === 'downloading' || download.status === 'pending')
    );
  }, [downloads]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    downloads,
    activeDownloads,
    cacheEntries,
    storageStats,
    previews,
    isLoading,
    isDownloading,
    
    // Actions
    downloadAttachment,
    cancelDownload,
    previewAttachment,
    getCachedAttachment,
    clearCache,
    cleanupExpired,
    
    // Configuration
    updateConfig,
    getConfig,
    
    // Statistics
    refreshStats,
    
    // Error handling
    error,
    clearError,
  };
}; 

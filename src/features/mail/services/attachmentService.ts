import { invoke } from '@tauri-apps/api/core';
import { 
  GmailAttachment, 
  AttachmentDownload, 
  AttachmentCache, 
  AttachmentStorageConfig, 
  AttachmentStorageStats,
  AttachmentDownloadProgress,
  AttachmentError,
  AttachmentSecurity,
  AttachmentPreview,
  AttachmentEvent,
  AttachmentEventType,
  getFileTypeInfo,
  canPreviewFile,
  isSecureFileType,
  formatFileSize
} from '../types/attachments';
import { handleGmailError } from './gmailErrorHandler';

// Configuration defaults
const DEFAULT_CONFIG: AttachmentStorageConfig = {
  maxFileSize: 100 * 1024 * 1024, // 100 MB
  maxTotalStorage: 1 * 1024 * 1024 * 1024, // 1 GB
  retentionDays: 30,
  enableEncryption: true,
  enableCompression: true,
  enableThumbnails: true,
  allowedMimeTypes: [
    'image/*',
    'text/*',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.*',
    'audio/*',
    'video/*'
  ],
  blockedMimeTypes: [
    'application/x-executable',
    'application/x-msdownload',
    'application/x-msdos-program',
    'application/javascript',
    'text/javascript'
  ],
  enableVirusScanning: true,
  downloadTimeout: 300, // 5 minutes
};

type AttachmentEventListener = (event: AttachmentEvent) => void;

export class AttachmentService {
  private config: AttachmentStorageConfig;
  private downloads: Map<string, AttachmentDownload> = new Map();
  private cache: Map<string, AttachmentCache> = new Map();
  private eventListeners: Map<AttachmentEventType, Set<AttachmentEventListener>> = new Map();
  private downloadAbortControllers: Map<string, AbortController> = new Map();

  constructor(config: Partial<AttachmentStorageConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      // TODO: Enable when backend attachment commands are implemented
      // Initialize backend storage
      // await invoke('init_attachment_storage', { config: this.config });
      
      // Load existing cache entries
      await this.loadCacheFromStorage();
      
      // Schedule cleanup
      this.scheduleCleanup();
      
      console.log('AttachmentService initialized successfully (backend commands disabled)');
    } catch (error) {
      console.error('Failed to initialize AttachmentService:', error);
    }
  }

  // Configuration management
  updateConfig(newConfig: Partial<AttachmentStorageConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // TODO: Enable when backend attachment commands are implemented
    // invoke('update_attachment_config', { config: this.config }).catch(console.error);
  }

  getConfig(): AttachmentStorageConfig {
    return { ...this.config };
  }

  // Download management
  async downloadAttachment(
    accountId: string,
    messageId: string,
    attachmentId: string,
    options: { forceDownload?: boolean; generateThumbnail?: boolean } = {}
  ): Promise<AttachmentDownload> {
    const { forceDownload = false, generateThumbnail = true } = options;

    // Check if already cached
    if (!forceDownload) {
      const cached = this.getCachedAttachment(attachmentId);
      if (cached) {
        await this.updateCacheAccess(attachmentId);
        const download: AttachmentDownload = {
          id: `download-${Date.now()}`,
          attachmentId,
          messageId,
          accountId,
          filename: cached.filename,
          mimeType: cached.mimeType,
          size: cached.size,
          status: 'completed',
          progress: 100,
          downloadedSize: cached.size,
          localPath: cached.localPath,
          thumbnailPath: cached.thumbnailPath,
          startedAt: new Date(),
          completedAt: new Date(),
        };
        return download;
      }
    }

    // Get attachment metadata from Gmail
    const attachmentInfo = await this.getAttachmentInfo(accountId, messageId, attachmentId);
    
    // Validate attachment
    this.validateAttachment(attachmentInfo);

    // Create download record
    const downloadId = `download-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const download: AttachmentDownload = {
      id: downloadId,
      attachmentId,
      messageId,
      accountId,
      filename: attachmentInfo.filename,
      mimeType: attachmentInfo.mimeType,
      size: attachmentInfo.size,
      status: 'pending',
      progress: 0,
      downloadedSize: 0,
      startedAt: new Date(),
    };

    this.downloads.set(downloadId, download);
    this.emitEvent('download_started', attachmentId, { download });

    try {
      // Start download
      await this.performDownload(download, generateThumbnail);
      return download;
    } catch (error) {
      console.error('Failed to download attachment:', error);
      throw handleGmailError(error, {
        operation: 'download_attachment_fallback',
      });
    }
  }

  private async performDownload(
    download: AttachmentDownload,
    generateThumbnail: boolean
  ): Promise<void> {
    const abortController = new AbortController();
    this.downloadAbortControllers.set(download.id, abortController);

    try {
      download.status = 'downloading';
      this.updateDownload(download);

      // Download from backend with progress tracking
      // TODO: Enable when backend attachment commands are implemented
      // const result = await invoke<{
      //   localPath: string;
      //   thumbnailPath?: string;
      //   checksum: string;
      // }>('download_gmail_attachment', {
      //   accountId: download.accountId,
      //   messageId: download.messageId,
      //   attachmentId: download.attachmentId,
      //   generateThumbnail: generateThumbnail && canPreviewFile(download.mimeType),
      //   signal: abortController.signal,
      // });
      
      // Mock result for now
      const result = {
        localPath: `temp/${download.filename}`,
        thumbnailPath: undefined,
        checksum: 'mock-checksum'
      };

      download.localPath = result.localPath;
      download.thumbnailPath = result.thumbnailPath;
      download.downloadedSize = download.size;
      download.progress = 100;
      download.status = 'completed';
      download.completedAt = new Date();

      // Security scanning
      if (this.config.enableVirusScanning && !isSecureFileType(download.mimeType)) {
        await this.scanAttachment(download);
      }

      // Add to cache
      await this.addToCache(download, result.checksum);

      this.emitEvent('download_completed', download.attachmentId, { download });

    } catch (error) {
      if (abortController.signal.aborted) {
        download.status = 'cancelled';
      } else {
        download.status = 'failed';
        download.error = error instanceof Error ? error.message : 'Download failed';
      }
      throw error;
    } finally {
      this.downloadAbortControllers.delete(download.id);
      this.updateDownload(download);
    }
  }

  private async scanAttachment(download: AttachmentDownload): Promise<void> {
    if (!download.localPath) return;

    try {
      // TODO: Enable when backend attachment commands are implemented
      // const scanResult = await invoke<AttachmentSecurity>('scan_attachment', {
      //   filePath: download.localPath,
      //   filename: download.filename,
      //   mimeType: download.mimeType,
      // });
      const scanResult = { isSafe: true, isQuarantined: false } as AttachmentSecurity;

      if (!scanResult.isSafe) {
        if (scanResult.isQuarantined) {
          download.status = 'failed';
          download.error = 'File quarantined due to security threats';
          
          // Remove from local storage
          if (download.localPath) {
            // TODO: Enable when backend attachment commands are implemented
            // await invoke('delete_attachment_file', { filePath: download.localPath });
          }
          
          throw new Error('File failed security scan and was quarantined');
        }
      }

      this.emitEvent('scan_completed', download.attachmentId, { scanResult });
    } catch (error) {
      console.error('Failed to scan attachment:', error);
      // Continue without blocking download for scan failures
    }
  }

  private async addToCache(download: AttachmentDownload, checksum: string): Promise<void> {
    if (!download.localPath) return;

    const cacheEntry: AttachmentCache = {
      id: `cache-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      attachmentId: download.attachmentId,
      messageId: download.messageId,
      accountId: download.accountId,
      filename: download.filename,
      localPath: download.localPath,
      thumbnailPath: download.thumbnailPath,
      size: download.size,
      mimeType: download.mimeType,
      downloadedAt: new Date(),
      lastAccessedAt: new Date(),
      accessCount: 1,
      expiresAt: new Date(Date.now() + this.config.retentionDays * 24 * 60 * 60 * 1000),
      isSecure: isSecureFileType(download.mimeType),
      checksum,
    };

    this.cache.set(download.attachmentId, cacheEntry);
    
    // Store in backend cache
    // TODO: Enable when backend attachment commands are implemented
    // await invoke('add_attachment_to_cache', { cacheEntry });
    
    this.emitEvent('cache_updated', download.attachmentId, { cacheEntry });
  }

  // Cache management
  getCachedAttachment(attachmentId: string): AttachmentCache | undefined {
    const cached = this.cache.get(attachmentId);
    if (cached && new Date() < cached.expiresAt) {
      return cached;
    } else if (cached) {
      // Expired, remove from cache
      this.removeFromCache(attachmentId);
    }
    return undefined;
  }

  private async updateCacheAccess(attachmentId: string): Promise<void> {
    const cached = this.cache.get(attachmentId);
    if (cached) {
      cached.lastAccessedAt = new Date();
      cached.accessCount++;
      
      // TODO: Enable when backend attachment commands are implemented
      // await invoke('update_cache_access', {
      //   attachmentId,
      //   lastAccessedAt: cached.lastAccessedAt.toISOString(),
      //   accessCount: cached.accessCount,
      // });
    }
  }

  private async removeFromCache(attachmentId: string): Promise<void> {
    const cached = this.cache.get(attachmentId);
    if (cached) {
      // Delete local files
      // TODO: Enable when backend attachment commands are implemented
      // if (cached.localPath) {
      //   await invoke('delete_attachment_file', { filePath: cached.localPath });
      // }
      // if (cached.thumbnailPath) {
      //   await invoke('delete_attachment_file', { filePath: cached.thumbnailPath });
      // }
      
      // Remove from cache
      this.cache.delete(attachmentId);
      // TODO: Enable when backend attachment commands are implemented
      // await invoke('remove_from_cache', { attachmentId });
    }
  }

  // Preview generation
  async generatePreview(attachmentId: string): Promise<AttachmentPreview | null> {
    const cached = this.getCachedAttachment(attachmentId);
    if (!cached) {
      throw new Error('Attachment not cached, download first');
    }

    const fileTypeInfo = getFileTypeInfo(cached.mimeType);
    
    if (!fileTypeInfo.canPreview) {
      return {
        attachmentId,
        type: fileTypeInfo.category,
        canPreview: false,
        requiresDownload: true,
      };
    }

    try {
      // TODO: Enable when backend attachment commands are implemented
      // const preview = await invoke<AttachmentPreview>('generate_attachment_preview', {
      //   filePath: cached.localPath,
      //   mimeType: cached.mimeType,
      //   filename: cached.filename,
      // });
      
      // Return mock preview for now
      const preview: AttachmentPreview = {
        attachmentId,
        type: fileTypeInfo.category,
        canPreview: false,
        requiresDownload: true,
      };

      return {
        ...preview,
        attachmentId,
        type: fileTypeInfo.category,
        canPreview: true,
        requiresDownload: false,
      };
    } catch (error) {
      console.error('Failed to generate preview:', error);
      return {
        attachmentId,
        type: fileTypeInfo.category,
        canPreview: false,
        requiresDownload: true,
      };
    }
  }

  // Download progress tracking
  onDownloadProgress(downloadId: string, callback: (progress: AttachmentDownloadProgress) => void): void {
    // This would be called by the backend during download
    // Implementation depends on backend progress reporting mechanism
  }

  // Attachment info
  private async getAttachmentInfo(
    accountId: string,
    messageId: string,
    attachmentId: string
  ): Promise<GmailAttachment> {
    try {
      // TODO: Enable when backend attachment commands are implemented
      // const attachment = await invoke<GmailAttachment>('get_gmail_attachment_info', {
      //   accountId,
      //   messageId,
      //   attachmentId,
      // });
      // return attachment;
      
      // Return mock attachment for now
      return {
        id: attachmentId,
        messageId: messageId,
        filename: 'mock-attachment.pdf',
        mimeType: 'application/pdf',
        size: 1024 * 1024, // 1MB
        isInline: false,
        data: ''
      } as GmailAttachment;
    } catch (error) {
      throw handleGmailError(error, {
        operation: 'get_attachment_info',
        messageId,
      });
    }
  }

  // Validation
  private validateAttachment(attachment: GmailAttachment): void {
    // Check file size
    if (attachment.size > this.config.maxFileSize) {
      throw new Error(`File size ${formatFileSize(attachment.size)} exceeds maximum allowed size ${formatFileSize(this.config.maxFileSize)}`);
    }

    // Check MIME type
    const isBlocked = this.config.blockedMimeTypes.some(blocked => {
      if (blocked.includes('*')) {
        const pattern = blocked.replace('*', '.*');
        return new RegExp(pattern).test(attachment.mimeType);
      }
      return attachment.mimeType === blocked;
    });

    if (isBlocked) {
      throw new Error(`File type ${attachment.mimeType} is not allowed`);
    }

    // Check if allowed
    const isAllowed = this.config.allowedMimeTypes.some(allowed => {
      if (allowed.includes('*')) {
        const pattern = allowed.replace('*', '.*');
        return new RegExp(pattern).test(attachment.mimeType);
      }
      return attachment.mimeType === allowed;
    });

    if (!isAllowed) {
      throw new Error(`File type ${attachment.mimeType} is not in allowed types`);
    }
  }

  // Storage management
  async getStorageStats(): Promise<AttachmentStorageStats> {
    try {
      // TODO: Enable when backend attachment commands are implemented
      // const stats = await invoke<AttachmentStorageStats>('get_attachment_storage_stats');
      // return stats;
      
      // Return calculated stats for now
      return {
        totalFiles: this.cache.size,
        totalSize: Array.from(this.cache.values()).reduce((sum, c) => sum + c.size, 0),
        availableSpace: this.config.maxTotalStorage,
        cacheHitRate: 0,
        downloadCount: 0,
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        totalFiles: this.cache.size,
        totalSize: Array.from(this.cache.values()).reduce((sum, c) => sum + c.size, 0),
        availableSpace: this.config.maxTotalStorage,
        cacheHitRate: 0,
        downloadCount: 0,
      };
    }
  }

  async cleanupExpiredFiles(): Promise<void> {
    try {
      const expiredIds: string[] = [];
      const now = new Date();

      for (const [attachmentId, cached] of this.cache) {
        if (now > cached.expiresAt) {
          expiredIds.push(attachmentId);
        }
      }

      for (const attachmentId of expiredIds) {
        await this.removeFromCache(attachmentId);
      }

      // Backend cleanup
      // TODO: Enable when backend attachment commands are implemented
      // await invoke('cleanup_expired_attachments');
      
      this.emitEvent('storage_cleaned', '', { cleanedCount: expiredIds.length });
    } catch (error) {
      console.error('Failed to cleanup expired files:', error);
    }
  }

  private scheduleCleanup(): void {
    // Cleanup every hour
    setInterval(() => {
      this.cleanupExpiredFiles();
    }, 60 * 60 * 1000);

    // Initial cleanup after 5 minutes
    setTimeout(() => {
      this.cleanupExpiredFiles();
    }, 5 * 60 * 1000);
  }

  // Download control
  cancelDownload(downloadId: string): void {
    const abortController = this.downloadAbortControllers.get(downloadId);
    if (abortController) {
      abortController.abort();
    }

    const download = this.downloads.get(downloadId);
    if (download) {
      download.status = 'cancelled';
      this.updateDownload(download);
    }
  }

  pauseDownload(downloadId: string): void {
    // Implementation depends on backend support for pause/resume
    const download = this.downloads.get(downloadId);
    if (download && download.status === 'downloading') {
      // For now, just cancel - full pause/resume would require backend support
      this.cancelDownload(downloadId);
    }
  }

  // Utility methods
  private updateDownload(download: AttachmentDownload): void {
    this.downloads.set(download.id, download);
  }

  private async loadCacheFromStorage(): Promise<void> {
    try {
      // TODO: Enable when backend attachment commands are implemented
      // const cacheEntries = await invoke<AttachmentCache[]>('get_attachment_cache');
      // for (const entry of cacheEntries) {
      //   this.cache.set(entry.attachmentId, entry);
      // }
    } catch (error) {
      console.error('Failed to load cache from storage:', error);
    }
  }

  getActiveDownloads(): AttachmentDownload[] {
    return Array.from(this.downloads.values()).filter(d => 
      d.status === 'downloading' || d.status === 'pending'
    );
  }

  getDownload(downloadId: string): AttachmentDownload | undefined {
    return this.downloads.get(downloadId);
  }

  getAllDownloads(): AttachmentDownload[] {
    return Array.from(this.downloads.values());
  }

  getCacheEntries(): AttachmentCache[] {
    return Array.from(this.cache.values());
  }

  // Event system
  addEventListener(type: AttachmentEventType, listener: AttachmentEventListener): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)!.add(listener);
  }

  removeEventListener(type: AttachmentEventType, listener: AttachmentEventListener): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  private emitEvent(type: AttachmentEventType, attachmentId: string, data?: any): void {
    const event: AttachmentEvent = {
      type,
      attachmentId,
      data,
      timestamp: new Date(),
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in attachment event listener for ${type}:`, error);
        }
      });
    }
  }

  // Cleanup
  async cleanup(): Promise<void> {
    // Cancel all active downloads
    for (const [downloadId] of this.downloadAbortControllers) {
      this.cancelDownload(downloadId);
    }

    // Clear listeners
    this.eventListeners.clear();

    // Backend cleanup
    // TODO: Enable when backend attachment commands are implemented
    // await invoke('cleanup_attachment_service').catch(console.error);
  }
}

// Singleton instance
export const attachmentService = new AttachmentService(); 
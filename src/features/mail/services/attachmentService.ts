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
import { logger } from '../../../core/lib/logger';

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
  cleanupIntervalMinutes: 60, // Run cleanup every 60 minutes by default
};

type AttachmentEventListener = (event: AttachmentEvent) => void;

export class AttachmentService {
  private config: AttachmentStorageConfig;
  private downloads: Map<string, AttachmentDownload> = new Map();
  private cache: Map<string, AttachmentCache> = new Map();
  private eventListeners: Map<AttachmentEventType, Set<AttachmentEventListener>> = new Map();
  private downloadAbortControllers: Map<string, AbortController> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<AttachmentStorageConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      // Future Enhancement: Backend attachment commands (e.g., init_attachment_storage) will be implemented in Phase 3.x
      // For now, this service operates primarily on frontend logic and mocks.
      // await invoke('init_attachment_storage', { config: this.config });
      
      // Load existing cache entries
      await this.loadCacheFromStorage();
      
      // Schedule cleanup
      this.scheduleCleanup();
      
      logger.log('AttachmentService initialized successfully (backend commands disabled)');
    } catch (error) {
      logger.error('Failed to initialize AttachmentService:', error);
    }
  }

  // Configuration management
  updateConfig(newConfig: Partial<AttachmentStorageConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // Future Enhancement: Backend attachment commands (e.g., update_attachment_config) will be implemented in Phase 3.x
    // invoke('update_attachment_config', { config: this.config }).catch(logger.error);
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
          expiresAt: cached.expiresAt,
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
      expiresAt: new Date(Date.now() + this.config.downloadTimeout * 1000), // Add expiresAt for new downloads
    };

    this.downloads.set(downloadId, download);
    this.emitEvent('download_started', attachmentId, { download });

    try {
      // Start download
      await this.performDownload(download, generateThumbnail);
      return download;
    } catch (error) {
      logger.error('Failed to download attachment:', error);
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

      // Future Enhancement: Backend attachment commands (e.g., download_attachment) will be implemented in Phase 3.x
      // This will integrate with Tauri backend to perform actual file downloads.
      throw new Error('Attachment download functionality is not yet implemented. Backend integration required.');

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
      // Future Enhancement: Backend attachment commands (e.g., scan_attachment) will be implemented in Phase 3.x
      // This will integrate with Tauri backend for security scanning.
      // const scanResult = await invoke<AttachmentSecurity>('scan_attachment', {
      //   filePath: download.localPath,
      //   filename: download.filename,
      //   mimeType: download.mimeType,
      // });
      const scanResult: AttachmentSecurity = { 
        attachmentId: download.attachmentId,
        scanStatus: 'clean',
        isQuarantined: false,
        isSafe: true,
      };

      if (!scanResult.isSafe) {
        if (scanResult.isQuarantined) {
          download.status = 'failed';
          download.error = 'File quarantined due to security threats';
          
          // Remove from local storage
          if (download.localPath) {
            // Future Enhancement: Backend attachment commands (e.g., delete_attachment_file) will be implemented in Phase 3.x
            // await invoke('delete_attachment_file', { filePath: download.localPath });
          }
          
          throw new Error('File failed security scan and was quarantined');
        }
      }

      this.emitEvent('scan_completed', download.attachmentId, { scanResult });
    } catch (error) {
      logger.error('Failed to scan attachment:', error);
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
    
    // Future Enhancement: Backend attachment commands (e.g., save_attachment_cache) will be implemented in Phase 3.x
    // This will persist cache metadata on the backend.
    // await invoke('save_attachment_cache', { cacheEntry });
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
      // Future Enhancement: Backend attachment commands (e.g., update_attachment_cache_access) will be implemented in Phase 3.x
      // await invoke('update_attachment_cache_access', {
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
      // Future Enhancement: Backend attachment commands (e.g., delete_attachment_file) will be implemented in Phase 3.x
      // if (cached.localPath) {
      //   await invoke('delete_attachment_file', { filePath: cached.localPath });
      // }
      // if (cached.thumbnailPath) {
      //   await invoke('delete_attachment_file', { filePath: cached.thumbnailPath });
      // }
      
      // Remove from cache
      this.cache.delete(attachmentId);
      // Future Enhancement: Backend attachment commands (e.g., remove_from_cache) will be implemented in Phase 3.x
      // await invoke('remove_from_cache', { attachmentId });
    }
  }

  // Preview generation
  async generatePreview(attachmentId: string): Promise<AttachmentPreview | null> {
    const cached = this.getCachedAttachment(attachmentId);
    if (!cached || !cached.localPath) return null;

    // Future Enhancement: Backend attachment commands (e.g., generate_attachment_preview) will be implemented in Phase 3.x
    // This will use backend capabilities for image/document previews.
    // const previewResult = await invoke<AttachmentPreview>('generate_attachment_preview', { filePath: cached.localPath, mimeType: cached.mimeType });
    // return previewResult;
    return null; // Return null for now as functionality is not implemented
  }

  // Download progress tracking
  onDownloadProgress(downloadId: string, callback: (progress: AttachmentDownloadProgress) => void): void {
    // Future Enhancement: Backend attachment command progress events will be integrated in Phase 3.x
    // This will listen to backend events for download progress.
    // Add listener to backend events for progress updates
    // const unlisten = await listen('attachment-download-progress', event => {
    //   if (event.payload.downloadId === downloadId) {
    //     callback(event.payload);
    //   }
    // });
    // return () => unlisten();
  }

  // Attachment info
  private async getAttachmentInfo(
    accountId: string,
    messageId: string,
    attachmentId: string
  ): Promise<GmailAttachment> {
    // Future Enhancement: Backend attachment commands (e.g., get_attachment_metadata) will be implemented in Phase 3.x
    // This will fetch metadata from the backend/Gmail API.
    throw new Error('Getting attachment info is not yet implemented. Backend integration required.');
  }

  // Validation
  private validateAttachment(attachment: GmailAttachment): void {
    // Basic validation for MVP - future enhancement with more robust checks
    if (!attachment.filename || !attachment.mimeType || attachment.size === undefined) {
      throw new Error('Invalid attachment metadata');
    }
    // Future Enhancement: More comprehensive attachment validation (e.g., dangerous file types, size limits) will be implemented in Phase 3.x
  }

  // Storage management
  async getStorageStats(): Promise<AttachmentStorageStats> {
    // Future Enhancement: Integrate with backend to get actual storage stats
    // For now, provide mock data or derive from frontend cache
    return {
      totalFiles: this.cache.size,
      totalSize: Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0),
      availableSpace: this.config.maxTotalStorage - Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0),
      cacheHitRate: 0, // Placeholder
      downloadCount: this.downloads.size, // Placeholder
      oldestFile: undefined, // Placeholder
      newestFile: undefined, // Placeholder
      cleanupDate: undefined, // Placeholder
    };
  }

  async cleanupExpiredFiles(): Promise<void> {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && entry.expiresAt.getTime() < now) {
        // Future Enhancement: Backend attachment commands (e.g., delete_attachment_file) will be implemented in Phase 3.x
        // await invoke('delete_attachment_file', { filePath: entry.localPath });
        this.cache.delete(key);
      }
    }
  }

  private scheduleCleanup(): void {
    // Schedule cleanup based on config
    if (this.config.retentionDays > 0 && this.config.cleanupIntervalMinutes) {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
      }
      this.cleanupInterval = setInterval(() => this.cleanupExpiredFiles(), this.config.cleanupIntervalMinutes * 60 * 1000);
      logger.log(`Attachment cleanup scheduled every ${this.config.cleanupIntervalMinutes} minutes.`);
    } else {
      logger.log('Attachment cleanup is disabled.');
    }
  }

  // Download control
  cancelDownload(downloadId: string): void {
    const controller = this.downloadAbortControllers.get(downloadId);
    if (controller) {
      controller.abort();
      this.downloads.get(downloadId)!.status = 'cancelled';
      this.updateDownload(this.downloads.get(downloadId)!);
    }
  }

  pauseDownload(downloadId: string): void {
    // Future Enhancement: Backend attachment commands (e.g., pause_attachment_download) will be implemented in Phase 3.x
    logger.warn('Pause download not implemented.');
  }

  resumeDownload(downloadId: string): void {
    // Future Enhancement: Backend attachment commands (e.g., resume_attachment_download) will be implemented in Phase 3.x
    logger.warn('Resume download not implemented.');
  }

  // Utility methods
  private updateDownload(download: AttachmentDownload): void {
    this.downloads.set(download.id, { ...this.downloads.get(download.id), ...download });
    this.emitEvent('download_updated', download.attachmentId, { download });
  }

  private async loadCacheFromStorage(): Promise<void> {
    // Future Enhancement: Backend attachment commands (e.g., load_attachment_cache) will be implemented in Phase 3.x
    // const cachedEntries = await invoke<AttachmentCache[]>('load_attachment_cache');
    // cachedEntries.forEach(entry => this.cache.set(entry.attachmentId, entry));
  }

  getActiveDownloads(): AttachmentDownload[] {
    return Array.from(this.downloads.values()).filter(d => d.status === 'pending' || d.status === 'downloading');
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
    if (this.eventListeners.has(type)) {
      this.eventListeners.get(type)!.delete(listener);
    }
  }

  private emitEvent(type: AttachmentEventType, attachmentId: string, data?: any): void {
    const event: AttachmentEvent = { type, attachmentId, data, timestamp: new Date() };
    this.eventListeners.get(type)?.forEach(listener => listener(event));
  }

  // Cleanup
  async cleanup(): Promise<void> {
    // Future Enhancement: Backend attachment commands (e.g., cleanup_attachment_storage) will be implemented in Phase 3.x
    // await invoke('cleanup_attachment_storage');
    this.downloads.clear();
    this.cache.clear();
    this.eventListeners.clear();
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Singleton instance
export const attachmentService = new AttachmentService(); 

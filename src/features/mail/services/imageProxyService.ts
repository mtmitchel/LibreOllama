import { invoke } from '@tauri-apps/api/core';
import { logger } from '../../../core/lib/logger';

interface ProxyImageResponse {
  data: string; // Base64 encoded image data
  content_type: string;
}

class ImageProxyService {
  private proxyCache = new Map<string, string>();

  /**
   * Proxy an external image through our backend to bypass CORS/referrer restrictions
   */
  async proxyImage(url: string): Promise<string> {
    // Check local cache first
    if (this.proxyCache.has(url)) {
      logger.debug(`Using cached proxy for: ${url}`);
      return this.proxyCache.get(url)!;
    }

    try {
      logger.info(`🔄 Proxying image: ${url}`);
      // Call Tauri backend to proxy the image
      const response = await invoke<ProxyImageResponse>('proxy_image_cached', { url });
      
      // Convert to data URL
      const dataUrl = `data:${response.content_type};base64,${response.data}`;
      
      logger.info(`Successfully proxied image, data URL length: ${dataUrl.length}`);
      
      // Cache locally
      this.proxyCache.set(url, dataUrl);
      
      // Limit cache size
      if (this.proxyCache.size > 100) {
        const firstKey = this.proxyCache.keys().next().value;
        if (firstKey) {
          this.proxyCache.delete(firstKey);
        }
      }
      
      return dataUrl;
    } catch (error: any) {
      logger.error(`❌ Failed to proxy image ${url}:`, error?.message || error);
      
      // Check if it's specific CDN issues
      if (url.includes('cloudfront') || url.includes('d1zi9vf8w50o75')) {
        logger.info('📍 Cloudfront CDN detected - likely Instacart/marketing email');
      }
      if (url.includes('fbcdn')) {
        logger.info('📍 Facebook CDN detected');
      }
      if (url.includes('twimg')) {
        logger.info('📍 Twitter CDN detected');
      }
      
      // If it's a 403/401, the image requires authentication we don't have
      // Return the original URL so at least the browser can try
      if (error?.message?.includes('403') || error?.message?.includes('401') || 
          error?.message?.includes('Forbidden') || error?.message?.includes('Unauthorized')) {
        logger.warn(`⚠️ Protected image (${error?.message}) - returning original URL`);
        return url; // Let the browser try to load it directly
      }
      
      // For other errors, return a transparent 1x1 pixel to preserve layout
      logger.debug('🔲 Returning transparent pixel for failed image');
      return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    }
  }

  /**
   * Process HTML content to proxy external images
   */
  async proxyImagesInHtml(html: string): Promise<string> {
    logger.debug('Starting image proxy processing for HTML content');
    
    let processedHtml = html;
    let proxiedCount = 0;
    
    // 1. Process <img> tags
    const imgRegex = /<img([^>]*?)src\s*=\s*["']([^"']+)["']([^>]*?)>/gi;
    const imgMatches = Array.from(html.matchAll(imgRegex));
    
    logger.debug(`Found ${imgMatches.length} <img> tags to check`);
    
    for (const match of imgMatches) {
      const [fullMatch, beforeSrc, originalSrc, afterSrc] = match;
      
      // Proxy ALL external images to ensure they load
      if (originalSrc.startsWith('http://') || originalSrc.startsWith('https://')) {
        logger.debug(`Proxying <img> src: ${originalSrc}`);
        try {
          const proxiedUrl = await this.proxyImage(originalSrc);
          const newImg = `<img${beforeSrc}src="${proxiedUrl}" data-original-src="${originalSrc}"${afterSrc}>`;
          processedHtml = processedHtml.replace(fullMatch, newImg);
          proxiedCount++;
        } catch (error) {
          logger.error(`Failed to proxy <img>: ${originalSrc}`, error);
        }
      }
    }
    
    // 2. Process CSS background-image URLs
    const bgRegex = /background(?:-image)?:\s*url\(['"]?([^'")]+)['"]?\)/gi;
    const bgMatches = Array.from(html.matchAll(bgRegex));
    
    logger.debug(`Found ${bgMatches.length} background-image URLs to check`);
    
    for (const match of bgMatches) {
      const [fullMatch, originalUrl] = match;
      
      if (originalUrl.startsWith('http://') || originalUrl.startsWith('https://')) {
        logger.debug(`Proxying background-image: ${originalUrl}`);
        try {
          const proxiedUrl = await this.proxyImage(originalUrl);
          const newBg = fullMatch.replace(originalUrl, proxiedUrl);
          processedHtml = processedHtml.replace(fullMatch, newBg);
          proxiedCount++;
        } catch (error) {
          logger.error(`Failed to proxy background-image: ${originalUrl}`, error);
        }
      }
    }
    
    // 3. Process style attribute background URLs
    const styleBgRegex = /style\s*=\s*["']([^"']*background(?:-image)?:\s*url\(['"]?([^'")]+)['"]?\)[^"']*)/gi;
    const styleBgMatches = Array.from(html.matchAll(styleBgRegex));
    
    logger.debug(`Found ${styleBgMatches.length} inline style background URLs`);
    
    for (const match of styleBgMatches) {
      const [fullMatch, fullStyle, originalUrl] = match;
      
      if (originalUrl.startsWith('http://') || originalUrl.startsWith('https://')) {
        logger.debug(`Proxying inline style background: ${originalUrl}`);
        try {
          const proxiedUrl = await this.proxyImage(originalUrl);
          const newStyle = fullStyle.replace(originalUrl, proxiedUrl);
          const newMatch = fullMatch.replace(fullStyle, newStyle);
          processedHtml = processedHtml.replace(fullMatch, newMatch);
          proxiedCount++;
        } catch (error) {
          logger.error(`Failed to proxy style background: ${originalUrl}`, error);
        }
      }
    }
    
    logger.info(`Proxied ${proxiedCount} total images (img src + backgrounds)`);
    return processedHtml;
  }

  /**
   * Check if an image is likely to have CORS/referrer issues
   */
  private isProblematicImage(imgTag: string, src: string): boolean {
    const tag = imgTag.toLowerCase();
    const url = src.toLowerCase();
    
    return (
      // Has restrictive attributes
      tag.includes('crossorigin') ||
      tag.includes('referrerpolicy') ||
      // Small dimensions (likely footer icons)
      (tag.includes('width="') && parseInt(tag.match(/width="(\d+)"/)?.[1] || '100') <= 32) ||
      (tag.includes('height="') && parseInt(tag.match(/height="(\d+)"/)?.[1] || '100') <= 32) ||
      // Known problematic CDNs
      url.includes('cloudfront') ||
      url.includes('fbcdn') ||
      url.includes('twimg') ||
      url.includes('instacart') ||
      url.includes('carrot') ||
      // Tracking pixels
      url.includes('pixel') ||
      url.includes('track') ||
      url.includes('beacon') ||
      // Social media icons
      url.includes('facebook') ||
      url.includes('twitter') ||
      url.includes('instagram') ||
      url.includes('linkedin') ||
      url.includes('youtube')
    );
  }

  /**
   * Clear all caches
   */
  async clearCache(): Promise<void> {
    this.proxyCache.clear();
    try {
      await invoke('clear_image_proxy_cache');
    } catch (error) {
      logger.error('Failed to clear backend image cache:', error);
    }
  }
}

export const imageProxyService = new ImageProxyService();
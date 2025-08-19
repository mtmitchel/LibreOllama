import React from 'react';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Youtube,
  Mail,
  Phone,
  MapPin,
  Globe,
  ShoppingBag,
  Package,
  CreditCard,
  Smartphone,
  Download,
  ExternalLink
} from 'lucide-react';

// Map of common social/app icon patterns to design system icons
export const socialIconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  // Social media
  facebook: Facebook,
  fb: Facebook,
  twitter: Twitter,
  x: Twitter, // X (formerly Twitter)
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
  
  // Contact
  email: Mail,
  mail: Mail,
  phone: Phone,
  tel: Phone,
  location: MapPin,
  address: MapPin,
  
  // E-commerce/Apps
  shop: ShoppingBag,
  store: ShoppingBag,
  instacart: ShoppingBag,
  cart: ShoppingBag,
  order: Package,
  delivery: Package,
  payment: CreditCard,
  app: Smartphone,
  download: Download,
  
  // Generic
  website: Globe,
  web: Globe,
  link: ExternalLink,
};

/**
 * Detect which icon to use based on image URL or alt text
 */
export function detectIconType(src: string, alt: string): string | null {
  const combined = `${src} ${alt}`.toLowerCase();
  
  // Check each pattern
  for (const [pattern, _icon] of Object.entries(socialIconMap)) {
    if (combined.includes(pattern)) {
      return pattern;
    }
  }
  
  // Additional pattern matching for common CDN/tracking URLs
  if (combined.includes('fbcdn') || combined.includes('facebook.com')) return 'facebook';
  if (combined.includes('twimg') || combined.includes('twitter.com')) return 'twitter';
  if (combined.includes('instagram.com') || combined.includes('cdninstagram')) return 'instagram';
  if (combined.includes('linkedin.com')) return 'linkedin';
  if (combined.includes('youtube.com') || combined.includes('ytimg')) return 'youtube';
  if (combined.includes('apple.com') || combined.includes('app-store')) return 'app';
  if (combined.includes('google.com/play') || combined.includes('play-store')) return 'app';
  if (combined.includes('instacart') || combined.includes('carrot-logo') || combined.includes('carrot')) return 'instacart';
  if (combined.includes('asana')) return 'website'; // Asana logos
  if (combined.includes('d1zi9vf8w50o75')) return 'shop'; // Specific CDN from your example
  if (combined.includes('cloudfront')) return 'website'; // Generic cloudfront
  
  // If we can't detect specific type but it's a tiny image, return generic
  return 'website';
}

/**
 * Create a React element for the fallback icon
 */
export function createIconFallback(
  iconType: string | null, 
  width: number = 20, 
  height: number = 20,
  className: string = ''
): React.ReactElement | null {
  if (!iconType || !socialIconMap[iconType]) {
    // Return a generic placeholder
    return (
      <span 
        className={`inline-block bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded ${className}`}
        style={{ width, height }}
        aria-hidden="true"
      />
    );
  }
  
  const Icon = socialIconMap[iconType];
  const size = Math.min(width, height);
  
  return (
    <span 
      className={`inline-flex items-center justify-center text-[var(--text-tertiary)] ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    >
      <Icon size={size * 0.7} />
    </span>
  );
}

/**
 * Create a DOM element for runtime injection
 */
export function createIconFallbackElement(
  src: string,
  alt: string,
  width: number = 20,
  height: number = 20
): HTMLElement {
  const iconType = detectIconType(src, alt);
  const wrapper = document.createElement('span');
  wrapper.className = 'icon-fallback inline-flex items-center justify-center';
  wrapper.style.width = `${width}px`;
  wrapper.style.height = `${height}px`;
  wrapper.style.display = 'inline-block';
  wrapper.style.verticalAlign = 'middle';
  wrapper.setAttribute('aria-hidden', 'true');
  
  if (iconType && socialIconMap[iconType]) {
    // Add a data attribute for the icon type
    wrapper.setAttribute('data-icon-type', iconType);
    wrapper.style.color = 'var(--text-tertiary)';
    
    // For runtime DOM injection, we'll use Unicode symbols as a fallback
    // since we can't directly render React components
    const iconSymbols: Record<string, string> = {
      facebook: 'f',
      twitter: '𝕏',
      instagram: '◉',
      linkedin: 'in',
      youtube: '▶',
      email: '✉',
      phone: '☎',
      location: '📍',
      shop: '🛍',
      instacart: '🛒',
      cart: '🛒',
      store: '🏪',
      app: '📱',
      website: '🌐',
    };
    
    wrapper.textContent = iconSymbols[iconType] || '•';
    wrapper.style.fontSize = `${Math.min(width, height) * 0.8}px`;
    wrapper.style.lineHeight = '1';
    wrapper.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  } else {
    // Generic placeholder
    wrapper.style.background = 'var(--bg-secondary)';
    wrapper.style.border = '1px solid var(--border-default)';
    wrapper.style.borderRadius = '4px';
  }
  
  return wrapper;
}

/**
 * Process a container element to replace failed images with icons
 */
export function replaceFailedImagesWithIcons(container: HTMLElement): void {
  const images = container.querySelectorAll('img');
  
  images.forEach(img => {
    // Check if image is tiny (likely an icon)
    const width = Number(img.getAttribute('width') || img.naturalWidth || 0);
    const height = Number(img.getAttribute('height') || img.naturalHeight || 0);
    
    if (width <= 32 || height <= 32) {
      // Add error handler
      img.addEventListener('error', function handleError() {
        const src = img.src || img.getAttribute('data-src') || '';
        const alt = img.alt || '';
        
        const fallback = createIconFallbackElement(src, alt, width || 20, height || 20);
        
        // Replace the image with the fallback
        if (img.parentNode) {
          img.parentNode.replaceChild(fallback, img);
        }
      });
      
      // If image is already broken (complete but naturalWidth is 0)
      if (img.complete && img.naturalWidth === 0) {
        img.dispatchEvent(new Event('error'));
      }
    }
  });
}

// CID URL cache for blob URLs
const cidCache = new Map<string, string>();

/**
 * Cache a resolved CID to blob URL mapping
 */
export function cacheCidUrl(cid: string, blobUrl: string): void {
  cidCache.set(cid, blobUrl);
}

/**
 * Get cached blob URL for a CID
 */
export function getCachedCidUrl(cid: string): string | undefined {
  return cidCache.get(cid);
}

/**
 * Clear the CID cache (call on unmount or message change)
 */
export function clearCidCache(): void {
  // Revoke all blob URLs to free memory
  cidCache.forEach(blobUrl => {
    try {
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      // Ignore errors
    }
  });
  cidCache.clear();
}
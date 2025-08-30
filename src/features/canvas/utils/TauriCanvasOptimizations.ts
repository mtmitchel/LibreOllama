/**
 * PHASE 3: Tauri WebView2 Canvas Optimizations
 * Configure WebView2 for maximum canvas performance
 */

// Check if running in Tauri
const isTauri = typeof (window as any).__TAURI__ !== 'undefined';

// WebView2 performance configuration
interface WebViewConfig {
  gpuAcceleration: boolean;
  hardwareDecoding: boolean;
  performanceMode: 'high-performance' | 'balanced' | 'power-saving';
  memoryLimit: number;
  cacheSize: number;
}

const optimalWebViewConfig: WebViewConfig = {
  gpuAcceleration: true,
  hardwareDecoding: true,
  performanceMode: 'high-performance',
  memoryLimit: 1024, // 1GB memory limit
  cacheSize: 256, // 256MB cache size
};

// EMERGENCY: WebView2 optimization for canvas performance
export const optimizeTauriCanvas = async (): Promise<void> => {
  console.log('🚀 Starting Tauri Canvas Optimizations');
  
  if (!isTauri) {
    console.log('⚠️ Not running in Tauri, skipping Tauri-specific optimizations');
    // Still apply web optimizations
    applyWebCanvasOptimizations();
    return;
  }

  try {
    // Import Tauri APIs dynamically
    const { invoke } = await import('@tauri-apps/api/core');
    const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
    
    // Set high-performance GPU preference
    try {
      await invoke('set_webview_performance_mode', {
        mode: optimalWebViewConfig.performanceMode,
        gpuAcceleration: optimalWebViewConfig.gpuAcceleration,
        hardwareDecoding: optimalWebViewConfig.hardwareDecoding,
        memoryLimit: optimalWebViewConfig.memoryLimit,
        cacheSize: optimalWebViewConfig.cacheSize,
      });
      
      console.log('✅ WebView2 performance mode configured');
    } catch (error) {
      console.warn('⚠️ Failed to configure WebView2 performance mode:', error);
    }
    
    // Configure WebView window for optimal canvas performance
    const currentWindow = WebviewWindow.getCurrent();
    
    if (currentWindow) {
      try {
        // Set high DPI awareness
        await currentWindow.setResizable(true);
        
        // Optimize for canvas rendering
        await invoke('optimize_webview_for_canvas');
        
        console.log('✅ WebView window optimized for canvas');
      } catch (error) {
        console.warn('⚠️ Failed to optimize WebView window:', error);
      }
    }
    
    // Set process priority for canvas operations
    try {
      await invoke('set_canvas_process_priority', { priority: 'high' });
      console.log('✅ Canvas process priority set to high');
    } catch (error) {
      console.warn('⚠️ Failed to set canvas process priority:', error);
    }
    
    // Enable hardware-accelerated compositing
    try {
      await invoke('enable_hardware_acceleration');
      console.log('✅ Hardware acceleration enabled');
    } catch (error) {
      console.warn('⚠️ Failed to enable hardware acceleration:', error);
    }
    
  } catch (error) {
    console.error('❌ Failed to apply Tauri optimizations:', error);
  }
  
  // Apply web-based optimizations regardless of Tauri success
  applyWebCanvasOptimizations();
  
  // Apply Windows-specific optimizations if available
  if (navigator.platform.includes('Win')) {
    applyWindowsOptimizations();
  }
};

// EMERGENCY: Web-based canvas optimizations
const applyWebCanvasOptimizations = (): void => {
  console.log('🌐 Applying web canvas optimizations');
  
  // Track context creation to avoid log spam
  let context2DCount = 0;
  let contextWebGLCount = 0;
  
  // Set optimal canvas context attributes globally
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  
  HTMLCanvasElement.prototype.getContext = function(
    contextType: string,
    contextAttributes?: any
  ) {
    if (contextType === '2d') {
      const optimizedAttributes = {
        alpha: false, // Disable alpha for better performance
        desynchronized: true, // Allow asynchronous rendering
        willReadFrequently: false, // Optimize for writing
        powerPreference: 'high-performance',
        // Override any provided attributes with our optimizations
        ...contextAttributes,
        // Force critical performance settings
        alpha: false,
        desynchronized: true,
      };
      
      // Only log first few context creations to avoid spam
      context2DCount++;
      if (context2DCount <= 3) {
        console.log(`🎨 Creating optimized 2D canvas context (#${context2DCount})`);
      } else if (context2DCount === 4) {
        console.log('🎨 Canvas context optimization active (further logs suppressed)');
      }
      
      return originalGetContext.call(this, contextType, optimizedAttributes);
    }
    
    if (contextType === 'webgl' || contextType === 'webgl2') {
      const optimizedAttributes = {
        alpha: false,
        antialias: false, // Disable antialiasing for performance
        depth: false,
        failIfMajorPerformanceCaveat: false,
        powerPreference: 'high-performance',
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
        stencil: false,
        desynchronized: true,
        ...contextAttributes,
        // Force critical performance settings
        powerPreference: 'high-performance',
        antialias: false,
      };
      
      contextWebGLCount++;
      if (contextWebGLCount <= 3) {
        console.log(`🎮 Creating optimized WebGL context (#${contextWebGLCount})`);
      } else if (contextWebGLCount === 4) {
        console.log('🎮 WebGL context optimization active (further logs suppressed)');
      }
      
      return originalGetContext.call(this, contextType, optimizedAttributes);
    }
    
    return originalGetContext.call(this, contextType, contextAttributes);
  };
  
  // Optimize requestAnimationFrame
  const originalRAF = window.requestAnimationFrame;
  window.requestAnimationFrame = (callback: FrameRequestCallback) => {
    return originalRAF((timestamp) => {
      // Ensure we're not in emergency mode before executing
      if (!(window as any).CANVAS_EMERGENCY_MODE) {
        callback(timestamp);
      }
    });
  };
  
  // Set page visibility optimizations
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Pause non-essential canvas operations when page is hidden
      (window as any).CANVAS_PAGE_HIDDEN = true;
    } else {
      (window as any).CANVAS_PAGE_HIDDEN = false;
    }
  });
  
  console.log('✅ Web canvas optimizations applied');
};

// Windows-specific optimizations
const applyWindowsOptimizations = (): void => {
  console.log('🪟 Applying Windows-specific optimizations');
  
  // Request high-performance GPU on Windows
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl', { 
    powerPreference: 'high-performance',
    failIfMajorPerformanceCaveat: false 
  });
  
  if (gl) {
    // Check GPU vendor for specific optimizations
    const renderer = gl.getParameter(gl.RENDERER);
    console.log(`🎮 Detected GPU: ${renderer}`);
    
    // NVIDIA-specific optimizations
    if (renderer.includes('NVIDIA')) {
      (window as any).CANVAS_GPU_VENDOR = 'nvidia';
      // Enable NVIDIA-specific features
      console.log('🟢 NVIDIA GPU detected, applying optimizations');
    }
    
    // AMD-specific optimizations
    if (renderer.includes('AMD') || renderer.includes('Radeon')) {
      (window as any).CANVAS_GPU_VENDOR = 'amd';
      console.log('🔴 AMD GPU detected, applying optimizations');
    }
    
    // Intel-specific optimizations
    if (renderer.includes('Intel')) {
      (window as any).CANVAS_GPU_VENDOR = 'intel';
      // More conservative settings for Intel GPUs
      (window as any).CANVAS_CONSERVATIVE_MODE = true;
      console.log('🔵 Intel GPU detected, applying conservative optimizations');
    }
  }
  
  // Set Windows-specific performance flags
  try {
    // Enable Windows hardware scheduling if available
    (navigator as any).hardwareAcceleration = true;
  } catch (error) {
    console.warn('Hardware acceleration setting not available');
  }
};

// EMERGENCY: Canvas context optimization
export const optimizeCanvasContext = (canvas: HTMLCanvasElement): void => {
  console.log('🎨 Optimizing canvas context for maximum performance');
  
  // Get all available context types and optimize them
  const context2d = canvas.getContext('2d', {
    alpha: false,
    desynchronized: true,
    willReadFrequently: false,
    powerPreference: 'high-performance'
  });
  
  if (context2d) {
    // Apply 2D context optimizations
    context2d.imageSmoothingEnabled = false; // Disable smoothing for performance
    
    // Set optimal composite operation
    context2d.globalCompositeOperation = 'source-over';
    
    // Disable shadows by default for performance
    context2d.shadowBlur = 0;
    context2d.shadowOffsetX = 0;
    context2d.shadowOffsetY = 0;
    
    console.log('✅ 2D context optimized');
  }
  
  // Try to get WebGL context for hardware acceleration detection
  const webglContext = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    powerPreference: 'high-performance'
  });
  
  if (webglContext) {
    console.log('✅ WebGL hardware acceleration available');
    (window as any).CANVAS_WEBGL_AVAILABLE = true;
  } else {
    console.warn('⚠️ WebGL not available, using software rendering');
    (window as any).CANVAS_WEBGL_AVAILABLE = false;
  }
  
  // Set canvas-specific optimizations
  canvas.style.imageRendering = 'pixelated'; // Fastest rendering
  canvas.style.willChange = 'contents'; // Hint for browser optimization
  
  // Apply size optimizations
  const dpr = window.devicePixelRatio || 1;
  if (dpr > 1 && !(window as any).CANVAS_CONSERVATIVE_MODE) {
    // Enable high-DPI only if not in conservative mode
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    if (context2d) {
      context2d.scale(dpr, dpr);
    }
    
    console.log(`✅ High-DPI optimization applied (${dpr}x)`);
  } else {
    console.log('🔒 High-DPI disabled for performance');
  }
};

// Memory usage monitoring for Tauri
export const startTauriMemoryMonitoring = (): void => {
  console.log('🧠 Starting Tauri memory monitoring');
  
  let lastMemoryWarning = 0;
  
  const checkMemory = async () => {
    try {
      // Check browser memory
      if ((performance as any).memory) {
        const memInfo = (performance as any).memory;
        const usedMB = memInfo.usedJSHeapSize / (1024 * 1024);
        const totalMB = memInfo.totalJSHeapSize / (1024 * 1024);
        const limitMB = memInfo.jsHeapSizeLimit / (1024 * 1024);
        
        // Warning if memory usage > 80%
        if (usedMB / limitMB > 0.8) {
          const now = Date.now();
          if (now - lastMemoryWarning > 30000) { // Throttle warnings
            console.warn(`🧠 High memory usage: ${usedMB.toFixed(1)}MB / ${limitMB.toFixed(1)}MB`);
            lastMemoryWarning = now;
            
            // Trigger garbage collection if available
            if ((window as any).gc) {
              (window as any).gc();
              console.log('🗑️ Forced garbage collection');
            }
          }
        }
      }
      
      // Check Tauri process memory if available
      if (isTauri) {
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          const processMemory = await invoke('get_process_memory_usage');
          
          if (processMemory && typeof processMemory === 'number') {
            const processMB = processMemory / (1024 * 1024);
            
            if (processMB > 1024) { // 1GB warning threshold
              console.warn(`🧠 High process memory usage: ${processMB.toFixed(1)}MB`);
            }
          }
        } catch (error) {
          // Tauri memory monitoring not available
        }
      }
      
    } catch (error) {
      console.warn('Memory monitoring error:', error);
    }
  };
  
  // Check memory every 5 seconds
  setInterval(checkMemory, 5000);
  
  // Initial check
  checkMemory();
};

// Get optimization status
export const getOptimizationStatus = () => {
  return {
    isTauri: isTauri,
    webGLAvailable: (window as any).CANVAS_WEBGL_AVAILABLE,
    gpuVendor: (window as any).CANVAS_GPU_VENDOR,
    conservativeMode: (window as any).CANVAS_CONSERVATIVE_MODE,
    highPerformanceMode: (window as any).CANVAS_HIGH_PERFORMANCE_MODE,
    drawingMode: (window as any).CANVAS_DRAWING_MODE,
    emergencyMode: (window as any).CANVAS_EMERGENCY_MODE,
    pageHidden: (window as any).CANVAS_PAGE_HIDDEN,
  };
};

// Emergency canvas reset
export const emergencyResetCanvas = async (): Promise<void> => {
  console.error('🔄 Performing emergency canvas reset');
  
  // Remove all canvas elements
  const canvases = document.querySelectorAll('canvas');
  canvases.forEach(canvas => {
    canvas.remove();
  });
  
  // Clear global flags
  (window as any).CANVAS_EMERGENCY_MODE = false;
  (window as any).CANVAS_HIGH_PERFORMANCE_MODE = false;
  
  // Force garbage collection
  if ((window as any).gc) {
    (window as any).gc();
  }
  
  // Re-apply optimizations
  setTimeout(() => {
    optimizeTauriCanvas();
  }, 1000);
};
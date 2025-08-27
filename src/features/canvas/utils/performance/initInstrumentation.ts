// Lightweight helpers to annotate canvas initialization phases

const DEBUG = process.env.NODE_ENV === 'development';

export const markInit = (name: string) => {
  try {
    performance.mark(name);
    if (DEBUG) {
      console.log(`⏱️ [Performance Mark] ${name} at ${performance.now().toFixed(2)}ms`);
    }
  } catch {}
};

export const measureInit = (name: string, start: string, end: string) => {
  try {
    performance.measure(name, start, end);
    const measures = performance.getEntriesByName(name, 'measure');
    if (measures.length > 0 && DEBUG) {
      const measure = measures[measures.length - 1];
      console.log(`⏱️ [Performance Measure] ${name}: ${measure.duration.toFixed(2)}ms`);
    }
  } catch {}
};

// Specific initialization phase markers
export const initMarkers = {
  // Store initialization
  STORE_HYDRATION_START: 'store-hydration-start',
  STORE_HYDRATION_END: 'store-hydration-end',
  
  // Layer initialization
  LAYER_MANAGER_MOUNT_START: 'layer-manager-mount-start',
  LAYER_MANAGER_MOUNT_END: 'layer-manager-mount-end',
  
  // Tool initialization  
  TOOL_INIT_START: 'tool-init-start',
  TOOL_INIT_END: 'tool-init-end',
  
  // Font loading
  FONT_LOAD_START: 'font-load-start',
  FONT_LOAD_END: 'font-load-end',
  
  // Image loading
  IMAGE_LOAD_START: 'image-load-start', 
  IMAGE_LOAD_END: 'image-load-end',
  
  // Canvas stage
  CANVAS_STAGE_INIT_START: 'canvas-stage-init-start',
  CANVAS_STAGE_INIT_END: 'canvas-stage-init-end',
} as const;

// Helper to measure initialization phases
export const measureInitPhase = (phase: keyof typeof initMarkers) => {
  const baseName = phase.replace(/_START$|_END$/, '');
  const startMarker = initMarkers[`${baseName}_START` as keyof typeof initMarkers];
  const endMarker = initMarkers[`${baseName}_END` as keyof typeof initMarkers];
  
  if (startMarker && endMarker) {
    measureInit(`${baseName.toLowerCase().replace(/_/g, '-')}-duration`, startMarker, endMarker);
  }
};

import Konva from 'konva';

// Screen <-> World conversion relative to the Konva Stage
// Single source of truth for coordinate transformations

export function worldToScreen(stage: Konva.Stage, p: { x: number; y: number }) {
  // 🔥 PERPLEXITY RECOMMENDATION: Layer-aware coordinate conversion with validation
  const mainLayer = stage.findOne('.main-layer') || stage.getLayers().find(l => l.name() === 'main-layer');

  console.log('[coords] worldToScreen - input:', p);
  console.log('[coords] worldToScreen - mainLayer found:', !!mainLayer, mainLayer?.name());

  if (mainLayer) {
    // Get the layer's absolute transform (includes all ancestor transforms)
    const layerTransform = mainLayer.getAbsoluteTransform();

    // Validate transform before use
    if (isNaN(layerTransform.m[0]) || isNaN(layerTransform.m[4])) {
      console.warn('[coords] Invalid layer transform detected, using fallback');
      return fallbackCoordinateConversion(stage, mainLayer, p);
    }

    const result = layerTransform.point(p);
    console.log('[coords] worldToScreen - mainLayer transform result:', result);

    // Validate result
    if (result && !isNaN(result.x) && !isNaN(result.y)) {
      return result;
    }

    console.warn('[coords] Invalid transform result, using fallback');
    return fallbackCoordinateConversion(stage, mainLayer, p);
  }

  // Fallback to stage transform if no main layer
  const t = stage.getAbsoluteTransform();
  const result = t.point(p);
  console.log('[coords] worldToScreen - stage transform fallback result:', result);
  return result;
}

function fallbackCoordinateConversion(stage: Konva.Stage, layer: Konva.Layer, worldPos: { x: number; y: number }) {
  // Manual calculation when getAbsoluteTransform fails
  const layerPos = layer.position() || { x: 0, y: 0 };
  const layerScale = layer.scale() || { x: 1, y: 1 };

  console.log('[coords] fallbackCoordinateConversion - layerPos:', layerPos, 'layerScale:', layerScale);

  return {
    x: (worldPos.x * layerScale.x) + layerPos.x,
    y: (worldPos.y * layerScale.y) + layerPos.y
  };
}

export function screenToWorld(stage: Konva.Stage, p: { x: number; y: number }) {
  // 🔥 PERPLEXITY RECOMMENDATION: Layer-aware screen to world conversion with robust fallbacks
  const mainLayer = stage.getLayers().find(l => l.name() === 'main-layer');

  console.log('[coords] screenToWorld - input:', p);

  if (mainLayer) {
    // Try Konva's built-in method first
    const relativePos = mainLayer.getRelativePointerPosition();
    console.log('[coords] screenToWorld - getRelativePointerPosition():', relativePos);

    if (relativePos && !isNaN(relativePos.x) && !isNaN(relativePos.y)) {
      return relativePos;
    }

    // Fallback: Manual calculation with layer transform
    const layerTransform = mainLayer.getAbsoluteTransform();

    if (!isNaN(layerTransform.m[0]) && !isNaN(layerTransform.m[4])) {
      const inverseTransform = layerTransform.copy().invert();
      const result = inverseTransform.point(p);

      console.log('[coords] screenToWorld - layer transform result:', result);

      if (result && !isNaN(result.x) && !isNaN(result.y)) {
        return result;
      }
    }

    // Manual fallback calculation
    return manualScreenToWorld(stage, mainLayer, p);
  }

  // Final fallback: Use stage transform
  console.log('[coords] screenToWorld - using stage transform fallback');
  const t = stage.getAbsoluteTransform().copy();
  t.invert();
  const result = t.point(p);
  console.log('[coords] screenToWorld - stage fallback result:', result);
  return result;
}

function manualScreenToWorld(stage: Konva.Stage, layer: Konva.Layer, screenPos: { x: number; y: number }) {
  // Manual calculation when Konva methods fail
  const layerPos = layer.position() || { x: 0, y: 0 };
  const layerScale = layer.scale() || { x: 1, y: 1 };

  console.log('[coords] manualScreenToWorld - layerPos:', layerPos, 'layerScale:', layerScale);

  return {
    x: (screenPos.x - layerPos.x) / layerScale.x,
    y: (screenPos.y - layerPos.y) / layerScale.y
  };
}
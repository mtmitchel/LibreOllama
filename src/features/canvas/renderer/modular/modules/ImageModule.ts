import Konva from 'konva';
import { RendererModule, ModuleContext, CanvasSnapshot } from '../types';
import { ShapesModule } from '../../../services/modules/ShapesModule';
import { ImageElement } from '../../../types/enhanced.types';

/**
 * ImageModule handles image element rendering and interaction.
 * This module follows the modular renderer pattern and manages async image loading,
 * caching, and Konva.Image node creation within Groups for proper hit detection.
 */
export class ImageModule implements RendererModule {
  private ctx!: ModuleContext;
  private shapesHelper!: ShapesModule;
  private nodeMap = new Map<string, Konva.Group>();
  private imageCache = new Map<string, HTMLImageElement>();
  private loadingImages = new Map<string, Promise<HTMLImageElement>>();
  private bound = false;

  init(ctx: ModuleContext): void {
    this.ctx = ctx;
    if (this.bound) return;
    this.bound = true;

    // Initialize ShapesModule helper for group creation with hit areas
    const layers = this.ctx.konva.getLayers();
    this.shapesHelper = new ShapesModule(
      this.nodeMap as Map<string, Konva.Node>,
      {
        background: layers.background!,
        main: layers.main!,
        preview: layers.preview!,
        overlay: layers.overlay!
      },
      (id: string, updates: Record<string, unknown>) => this.updateElementCallback(id, updates),
      (layer: 'main' | 'overlay' | 'preview') => this.scheduleDraw(layer),
      (elId: string) => this.refreshTransformer(elId),
      null, // currentEditingId
      undefined, // currentEditorWrapper
      undefined, // currentEditorPad
      this.ctx.konva.getStage(),
      () => 0, // getCirclePadPx - not used for images
      () => 0, // getBaselineOffsetPx - not used for images
      () => ({}) // getDebug - not used for images
    );
  }

  sync(snapshot: CanvasSnapshot): void {
    const mainLayer = this.ctx.konva.getLayers().main;
    if (!mainLayer) return;

    // Process all image elements in the snapshot
    snapshot.elements.forEach((element, id) => {
      if (element.type === 'image') {
        const imageElement = element as ImageElement;
        const existingNode = this.nodeMap.get(id);

        if (existingNode) {
          // Update existing image
          this.updateImage(existingNode, imageElement);
        } else {
          // Create new image
          const group = this.createImage(imageElement);
          this.nodeMap.set(id, group);
          mainLayer.add(group);
        }
      }
    });

    // Remove images that no longer exist in the snapshot
    const nodesToRemove: string[] = [];
    this.nodeMap.forEach((node, id) => {
      if (!snapshot.elements.has(id) || snapshot.elements.get(id)?.type !== 'image') {
        node.destroy();
        nodesToRemove.push(id);
      }
    });
    nodesToRemove.forEach(id => this.nodeMap.delete(id));

    // Redraw main layer if changes were made
    if (nodesToRemove.length > 0 || snapshot.elements.size > 0) {
      mainLayer.batchDraw();
    }
  }

  destroy(): void {
    // Clear all nodes
    this.nodeMap.forEach(node => node.destroy());
    this.nodeMap.clear();

    // Clear image cache and loading promises
    this.imageCache.clear();
    this.loadingImages.clear();

    this.bound = false;
  }

  /**
   * Creates a new image group following the same pattern as CanvasRendererV2.createImage
   */
  private createImage(el: ImageElement): Konva.Group {
    const id = String(el.id);
    const w = Math.max(1, el.width || 100);
    const h = Math.max(1, el.height || 100);

    // Create group with hit area using ShapesModule utility
    const group = this.shapesHelper.createGroupWithHitArea(id, w, h);
    group.name('image');
    group.position({ x: el.x || 0, y: el.y || 0 });

    // Apply rotation if specified
    if (el.rotation) {
      group.rotation(el.rotation);
    }

    // Create the Konva.Image node
    const imageNode = new Konva.Image({
    } as any);

    // Load and set the image
    if (el.imageUrl) {
      this.loadImageForNode(el.imageUrl, imageNode, group);
    }

    group.add(imageNode);
    return group;
  }

  /**
   * Updates an existing image group following the same pattern as CanvasRendererV2.updateImage
   */
  private updateImage(group: Konva.Group, el: ImageElement): void {
    const w = Math.max(1, el.width || 100);
    const h = Math.max(1, el.height || 100);

    // Update group position and hit area
    group.position({ x: el.x || 0, y: el.y || 0 });

    // Apply rotation if specified
    group.rotation(el.rotation || 0);

    this.shapesHelper.ensureHitAreaSize(group, w, h);

    // Update the image node
    const imageNode = group.findOne<Konva.Image>('.image-content');
    if (imageNode) {
      imageNode.width(w);
      imageNode.height(h);
      imageNode.opacity(el.opacity || 1);

      // Update image source if changed
      const currentImage = imageNode.image() as HTMLImageElement;
      if (el.imageUrl && (!currentImage || currentImage.src !== el.imageUrl)) {
        this.loadImageForNode(el.imageUrl, imageNode, group);
      }
    }
  }

  /**
   * Loads an image and sets it on the Konva.Image node with caching
   */
  private loadImageForNode(imageUrl: string, imageNode: Konva.Image, group: Konva.Group): void {
    // Check cache first
    const cachedImage = this.imageCache.get(imageUrl);
    if (cachedImage && cachedImage.complete) {
      imageNode.image(cachedImage);
      group.getLayer()?.batchDraw();
      return;
    }

    // Check if already loading
    const existingLoad = this.loadingImages.get(imageUrl);
    if (existingLoad) {
      existingLoad.then(img => {
        imageNode.image(img);
        group.getLayer()?.batchDraw();
      }).catch(() => {
        // Handle loading error - could set a placeholder or just ignore
        console.warn(`Failed to load image: ${imageUrl}`);
      });
      return;
    }

    // Start new load
    const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const imgElement = new Image();

      imgElement.onload = () => {
        // Cache the loaded image
        this.imageCache.set(imageUrl, imgElement);
        this.loadingImages.delete(imageUrl);
        resolve(imgElement);
      };

      imgElement.onerror = () => {
        this.loadingImages.delete(imageUrl);
        reject(new Error(`Failed to load image: ${imageUrl}`));
      };

      // Handle CORS for cross-origin images
      imgElement.crossOrigin = 'anonymous';
      imgElement.src = imageUrl;
    });

    this.loadingImages.set(imageUrl, loadPromise);

    // Set the image when loaded
    loadPromise.then(img => {
      imageNode.image(img);
      group.getLayer()?.batchDraw();
    }).catch(() => {
      // Handle loading error silently
      console.warn(`Failed to load image: ${imageUrl}`);
    });
  }

  /**
   * Helper method to update element via store callback
   */
  private updateElementCallback(id: string, updates: Record<string, unknown>): void {
    try {
      const store = (window as any).__UNIFIED_CANVAS_STORE__;
      store?.getState?.().updateElement?.(id, updates);
    } catch {
      // Ignore store errors
    }
  }

  /**
   * Helper method to schedule layer redraw
   */
  private scheduleDraw(layer: 'main' | 'overlay' | 'preview'): void {
    try {
      const layers = this.ctx.konva.getLayers();
      const targetLayer = layers[layer];
      if (targetLayer) {
        targetLayer.batchDraw();
      }
    } catch {
      // Ignore draw errors
    }
  }

  /**
   * Helper method to refresh transformer for selected elements
   */
  private refreshTransformer(elId: string): void {
    try {
      const store = (window as any).__UNIFIED_CANVAS_STORE__;
      const currentSelection = store?.getState?.().selection;
      if (currentSelection?.has?.(elId)) {
        // Selection module will handle transformer refresh
        store?.getState?.().selectElement?.(elId, true);
      }
    } catch {
      // Ignore transformer errors
    }
  }
}
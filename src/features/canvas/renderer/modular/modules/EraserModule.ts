import Konva from 'konva';
import { RendererModule, ModuleContext, CanvasSnapshot, CanvasEvent } from '../types';
import { useUnifiedCanvasStore, UnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';

/**
 * EraserModule handles eraser tool functionality including visual preview,
 * hit-testing, and element deletion. This module matches the exact behavior
 * of the monolithic CanvasRendererV2 eraser functionality.
 */
export class EraserModule implements RendererModule {
    private ctx!: ModuleContext;
    private eraserCircle: Konva.Circle | null = null;
    private _isErasing: boolean = false;
    private erasePath: Konva.Vector2d[] = [];
    private unsubscribeStore: (() => void) | null = null;
    private store: UnifiedCanvasStore;

    // Debug getter/setter to track unexpected isErasing changes
    private get isErasing(): boolean {
        return this._isErasing;
    }

    private set isErasing(value: boolean) {
        this._isErasing = value;
    }

    constructor() {
        this.store = useUnifiedCanvasStore.getState();
        this.unsubscribeStore = useUnifiedCanvasStore.subscribe(
            (state) => {
                this.store = state;
            }
        );

        // Initialize eraser preview circle
        this.createEraserPreview();
    }

    init(ctx: ModuleContext): void {
        this.ctx = ctx;

        // Add eraser preview to overlay layer
        const overlayLayer = this.ctx.konva.getLayers().overlay;

        if (overlayLayer && this.eraserCircle) {
            overlayLayer.add(this.eraserCircle);
            overlayLayer.batchDraw();
        } else {
            console.error('[EraserModule] Failed to add eraser circle to overlay layer');
        }

        this.bindEvents();
    }

    sync(snapshot: CanvasSnapshot): void {
        // Update eraser size based on current stroke config
        if (this.eraserCircle && snapshot) {
            const eraserSize = this.store.strokeConfig?.eraser?.size || 20;
            const stage = this.ctx?.konva?.getStage();
            const scale = stage?.scaleX() || 1;
            this.eraserCircle.radius(eraserSize / 2 / scale);

            // Show/hide eraser preview based on selected tool
            if (this.store.selectedTool === 'eraser') {
                if (!this.eraserCircle.visible()) {
                    this.eraserCircle.show();
                    this.ctx.konva.getLayers().overlay?.batchDraw();
                }
            } else {
                if (this.eraserCircle.visible()) {
                    this.eraserCircle.hide();
                    this.ctx.konva.getLayers().overlay?.batchDraw();
                }
            }
        }
    }

    onEvent(evt: CanvasEvent, snapshot: CanvasSnapshot): boolean {
        // For now, eraser events are handled directly via stage event binding
        // This method is reserved for future centralized event system integration
        return false;
    }

    private bindEvents() {
        const stage = this.ctx.konva.getStage();
        if (!stage) return;

        stage.on('pointerdown mousedown', this.handlePointerDown);
        stage.on('pointermove mousemove', this.handlePointerMove);
        stage.on('pointerup mouseup', this.handlePointerUp);
        // These content events are for preventing default browser behavior on canvas content
        stage.on('contentMousedown', this.handleContentMouseDown);
        stage.on('contentMousemove', this.handleContentMouseMove);
        stage.on('contentMouseup', this.handleContentMouseUp);
    }

    private handlePointerDown = (e: Konva.KonvaEventObject<PointerEvent | MouseEvent>) => {
        try {
            if (this.store.selectedTool === 'eraser') {
                this.isErasing = true;
                this.erasePath = [];
                this.updateEraserPreview(e.evt.clientX, e.evt.clientY);

                if (this.eraserCircle) {
                    this.eraserCircle.show();
                }

                this.ctx.konva.getLayers().overlay?.batchDraw();
                e.evt.preventDefault();
            }
        } catch (error) {
            console.error('[EraserModule] Error handling pointer down:', error);
        }
    };

    private handlePointerMove = (e: Konva.KonvaEventObject<PointerEvent | MouseEvent>) => {
        try {
            if (this.store.selectedTool === 'eraser') {
                this.updateEraserPreview(e.evt.clientX, e.evt.clientY);

                // Show eraser preview when hovering with eraser tool
                if (this.eraserCircle && !this.eraserCircle.visible()) {
                    this.eraserCircle.show();
                }

                if (this.isErasing) {
                    const pointerPosition = this.ctx.konva.getStage()?.getPointerPosition();
                    if (pointerPosition) {
                        this.erasePath.push(pointerPosition);
                        this.eraseAtPoint(pointerPosition);
                    }
                }

                this.ctx.konva.getLayers().overlay?.batchDraw();
                e.evt.preventDefault();
            } else {
                // Hide eraser preview when not using eraser tool
                if (this.eraserCircle && this.eraserCircle.visible()) {
                    this.eraserCircle.hide();
                    this.ctx.konva.getLayers().overlay?.batchDraw();
                }
            }
        } catch (error) {
            console.error('[EraserModule] Error handling pointer move:', error);
        }
    };

    private handlePointerUp = (e: Konva.KonvaEventObject<PointerEvent | MouseEvent>) => {
        try {
            if (this.store.selectedTool === 'eraser' && this.isErasing) {
                this.isErasing = false;

                if (this.eraserCircle) {
                    this.eraserCircle.hide();
                }

                this.ctx.konva.getLayers().overlay?.batchDraw();

                // Reset the erase path - incremental erasing already handled during move
                this.erasePath = [];

                e.evt.preventDefault();
            }
        } catch (error) {
            console.error('[EraserModule] Error handling pointer up:', error);
        }
    };

    private handleContentMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (this.store.selectedTool === 'eraser') {
            e.evt.preventDefault();
        }
    };

    private handleContentMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (this.store.selectedTool === 'eraser') {
            e.evt.preventDefault();
        }
    };

    private handleContentMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (this.store.selectedTool === 'eraser') {
            e.evt.preventDefault();
        }
    };

    private updateEraserPreview(clientX: number, clientY: number): void {
        try {
            const stage = this.ctx.konva.getStage();
            if (!stage || !this.eraserCircle) {
                return;
            }

            // Try multiple methods to get mouse position
            let pointerPosition = stage.getPointerPosition();

            // Fallback: calculate position from client coordinates
            if (!pointerPosition && clientX !== undefined && clientY !== undefined) {
                const rect = stage.container().getBoundingClientRect();
                const scaleX = stage.scaleX();
                const scaleY = stage.scaleY();
                const x = stage.x();
                const y = stage.y();

                pointerPosition = {
                    x: ((clientX - rect.left) / scaleX) - (x / scaleX),
                    y: ((clientY - rect.top) / scaleY) - (y / scaleY)
                };
            }

            if (pointerPosition) {
                const scale = stage.scaleX();
                const eraserSize = this.store.strokeConfig?.eraser?.size || 20;
                const radius = eraserSize / 2 / scale;

                this.eraserCircle.radius(radius);
                this.eraserCircle.position(pointerPosition);

                // Force layer to redraw
                this.ctx.konva.getLayers().overlay?.batchDraw();
            }
        } catch (error) {
            console.error('[EraserModule] Error updating eraser preview:', error);
        }
    }

    private eraseAtPoint(point: Konva.Vector2d): void {
        try {
            const eraserSize = this.store.strokeConfig?.eraser?.size || 20;
            this.ctx.store.eraseAtPoint(point.x, point.y, eraserSize);
        } catch (error) {
            console.error('[EraserModule] Error erasing at point:', error);
        }
    }

    private eraseInPath(path: Konva.Vector2d[]): void {
        try {
            const eraserSize = this.store.strokeConfig?.eraser?.size || 20;
            const flatPath = path.flatMap(p => [p.x, p.y]);
            this.ctx.store.eraseInPath(flatPath, eraserSize);
        } catch (error) {
            console.error('[EraserModule] Error erasing in path:', error);
        }
    }

    destroy(): void {
        // Unbind stage events
        const stage = this.ctx?.konva?.getStage();
        if (stage) {
            stage.off('pointerdown mousedown', this.handlePointerDown);
            stage.off('pointermove mousemove', this.handlePointerMove);
            stage.off('pointerup mouseup', this.handlePointerUp);
            stage.off('contentMousedown', this.handleContentMouseDown);
            stage.off('contentMousemove', this.handleContentMouseMove);
            stage.off('contentMouseup', this.handleContentMouseUp);
        }

        // Destroy Konva nodes
        if (this.eraserCircle) {
            this.eraserCircle.destroy();
            this.eraserCircle = null;
        }

        // Clean up store subscription
        if (this.unsubscribeStore) {
            this.unsubscribeStore();
            this.unsubscribeStore = null;
        }

        // Reset state
        this._isErasing = false;
        this.erasePath = [];
    }

    // ===========================================
    // Private Implementation
    // ===========================================

    private createEraserPreview(): void {
        try {
            const eraserSize = this.store.strokeConfig?.eraser?.size || 20;

            this.eraserCircle = new Konva.Circle({
                radius: eraserSize / 2,
                stroke: 'red',
                strokeWidth: 2,
                dash: [5, 5],
                visible: false,
                listening: false,
                perfectDrawEnabled: false
            });
        } catch (error) {
            console.error('[EraserModule] Failed to create eraser preview:', error);
        }
    }
}
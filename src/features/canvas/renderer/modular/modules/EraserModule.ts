import Konva from 'konva';
import { RendererModule, ModuleContext, CanvasSnapshot } from '../types';
import { useUnifiedCanvasStore, UnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';

export class EraserModule implements RendererModule {
    private ctx!: ModuleContext;
    private eraserCircle: Konva.Circle;
    private isErasing: boolean = false;
    private erasePath: Konva.Vector2d[] = [];
    private unsubscribeStore: () => void;
    private store: UnifiedCanvasStore;

    constructor() {
        this.store = useUnifiedCanvasStore.getState();
        this.unsubscribeStore = useUnifiedCanvasStore.subscribe(
            (state) => (this.store = state)
        );

        this.eraserCircle = new Konva.Circle({
            radius: this.store.strokeConfig.eraser.size / 2,
            stroke: 'red',
            strokeWidth: 2,
            dash: [5, 5],
            visible: false,
            listening: false,
            perfectDrawEnabled: false,
        });
    }

    init(ctx: ModuleContext) {
        this.ctx = ctx;
        this.ctx.konva.getLayers().overlay?.add(this.eraserCircle);
        this.bindEvents();
    }

    sync(snapshot: CanvasSnapshot): void {
        // No direct rendering sync needed for eraser preview, it's event-driven
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
        if (this.store.ui.selectedTool === 'eraser') {
            this.isErasing = true;
            this.erasePath = [];
            this.updateEraserPreview(e.evt.clientX, e.evt.clientY);
            this.eraserCircle.show();
            this.ctx.konva.getLayers().overlay?.batchDraw();
            e.evt.preventDefault();
        }
    };

    private handlePointerMove = (e: Konva.KonvaEventObject<PointerEvent | MouseEvent>) => {
        if (this.store.ui.selectedTool === 'eraser') {
            this.updateEraserPreview(e.evt.clientX, e.evt.clientY);
            if (this.isErasing) {
                const pointerPosition = this.ctx.konva.getStage()?.getPointerPosition();
                if (pointerPosition) {
                    this.erasePath.push(pointerPosition);
                    this.eraseAtPoint(pointerPosition);
                }
            }
            this.ctx.konva.getLayers().overlay?.batchDraw();
            e.evt.preventDefault();
        }
    };

    private handlePointerUp = (e: Konva.KonvaEventObject<PointerEvent | MouseEvent>) => {
        if (this.store.ui.selectedTool === 'eraser' && this.isErasing) {
            this.isErasing = false;
            this.eraserCircle.hide();
            this.ctx.konva.getLayers().overlay?.batchDraw();
            if (this.erasePath.length > 0) {
                this.eraseInPath(this.erasePath);
            }
            e.evt.preventDefault();
        }
    };

    private handleContentMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (this.store.ui.selectedTool === 'eraser') {
            e.evt.preventDefault();
        }
    };

    private handleContentMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (this.store.ui.selectedTool === 'eraser') {
            e.evt.preventDefault();
        }
    };

    private handleContentMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (this.store.ui.selectedTool === 'eraser') {
            e.evt.preventDefault();
        }
    };

    private updateEraserPreview(clientX: number, clientY: number) {
        const stage = this.ctx.konva.getStage();
        if (!stage) return;

        const pointerPosition = stage.getPointerPosition();
        if (pointerPosition) {
            const scale = stage.scaleX();
            const eraserSize = this.store.strokeConfig.eraser.size;
            this.eraserCircle.radius(eraserSize / 2 / scale);
            this.eraserCircle.position(pointerPosition);
        }
    }

    private eraseAtPoint(point: Konva.Vector2d) {
        const eraserSize = this.store.strokeConfig.eraser.size;
        this.store.eraseAtPoint(point.x, point.y, eraserSize);
    }

    private eraseInPath(path: Konva.Vector2d[]) {
        const eraserSize = this.store.strokeConfig.eraser.size;
        const flatPath = path.flatMap(p => [p.x, p.y]);
        this.store.eraseInPath(flatPath, eraserSize);
    }

    destroy() {
        const stage = this.ctx.konva.getStage();
        if (stage) {
            stage.off('pointerdown mousedown', this.handlePointerDown);
            stage.off('pointermove mousemove', this.handlePointerMove);
            stage.off('pointerup mouseup', this.handlePointerUp);
            stage.off('contentMousedown', this.handleContentMouseDown);
            stage.off('contentMousemove', this.handleContentMouseMove);
            stage.off('contentMouseup', this.handleContentMouseUp);
        }
        this.eraserCircle.destroy();
        this.unsubscribeStore();
    }
}
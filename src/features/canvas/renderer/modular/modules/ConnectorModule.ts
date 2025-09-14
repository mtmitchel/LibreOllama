import Konva from 'konva';
import { RendererModule, ModuleContext, CanvasSnapshot } from '../types';
import { useUnifiedCanvasStore, UnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';
import { EdgeElement, ElementId, PortKind } from '../../../types/canvas-elements';
import { CanvasElement, isRectangularElement, isCircleElement } from '../../../types/enhanced.types';
import { updateEdgeGeometry } from '../../../utils/routing'; // Assuming routing utils exist
import { getPortWorldCoordinates } from '../../../utils/ports';

export class ConnectorModule implements RendererModule {
    private ctx!: ModuleContext;
    private unsubscribeStore: () => void;
    private store: UnifiedCanvasStore;
    private edgeMap: Map<ElementId, Konva.Line | Konva.Arrow> = new Map();
    private draftLine: Konva.Line | null = null;
    private snapIndicator: Konva.Rect | null = null; // For visual port indicators

    constructor() {
        this.store = useUnifiedCanvasStore.getState();
        this.unsubscribeStore = useUnifiedCanvasStore.subscribe(
            (state) => (this.store = state)
        );
    }

    init(ctx: ModuleContext) {
        this.ctx = ctx;
        this.ctx.konva.getLayers().overlay?.add(this.createDraftLine());
        this.ctx.konva.getLayers().overlay?.add(this.createSnapIndicator());
    }

    sync(snapshot: CanvasSnapshot): void {
        const currentEdges = new Set(snapshot.edges?.keys() || []);
        const renderedEdges = new Set(this.edgeMap.keys());

        // Remove old edges
        for (const id of renderedEdges) {
            if (!currentEdges.has(id)) {
                this.edgeMap.get(id)?.destroy();
                this.edgeMap.delete(id);
            }
        }

        // Add/Update new/existing edges
        snapshot.edges?.forEach((edge: EdgeElement, id: string) => {
            const elementId = id as ElementId; // Cast to branded type
            const existing = this.edgeMap.get(elementId);
            if (existing) {
                this.updateKonvaEdge(existing, edge);
            } else {
                this.addKonvaEdge(edge);
            }
        });

        // Update draft line
        this.updateDraftLine(snapshot.draft);

        // Update snap indicator
        this.updateSnapIndicator(snapshot.draft);

        this.ctx.konva.getLayers().main?.batchDraw();
        this.ctx.konva.getLayers().overlay?.batchDraw();
    }

    private createDraftLine(): Konva.Line {
        this.draftLine = new Konva.Line({
            stroke: '#6b7280',
            strokeWidth: 2,
            lineCap: 'round',
            lineJoin: 'round',
            dash: [5, 5],
            visible: false,
            listening: false,
            perfectDrawEnabled: false,
        });
        return this.draftLine;
    }

    private updateDraftLine(draft: any) {
        if (!this.draftLine) return;

        if (draft && draft.from && draft.pointer) {
            const sourceElement = this.store.elements.get(draft.from.elementId);
            if (!sourceElement) {
                this.draftLine.visible(false);
                return;
            }

            const getElementDimensions = (element: CanvasElement) => {
                switch (element.type) {
                    case 'rectangle':
                    case 'sticky-note':
                    case 'table':
                    case 'image':
                    case 'group':
                    case 'triangle':
                        return { width: element.width, height: element.height };
                    case 'circle':
                    case 'circle-text':
                        return { width: element.radius * 2, height: element.radius * 2 };
                    case 'text':
                    case 'rich-text':
                        return { width: element.width ?? 0, height: element.height ?? 0 };
                        return { width: 0, height: 0 };
                }
            };

            const sourceDims = getElementDimensions(sourceElement);
            const sourceWorldPos = getPortWorldCoordinates(
                sourceElement,
                draft.from.portKind,
                this.store.viewport.scale
            )!;

            let targetPos = draft.pointer;
            if (draft.snapTarget) {
                const targetElement = this.store.elements.get(draft.snapTarget.elementId);
                if (targetElement) {
                    const targetDims = getElementDimensions(targetElement);
                    targetPos = getPortWorldCoordinates(
                        targetElement,
                        draft.snapTarget.portKind,
                        this.store.viewport.scale
                    )!;
                }
            }

            this.draftLine.points([sourceWorldPos.x, sourceWorldPos.y, targetPos.x, targetPos.y]);
            this.draftLine.stroke(draft.snapTarget ? '#10b981' : '#6b7280');
            this.draftLine.visible(true);
        } else {
            this.draftLine.visible(false);
        }
    }

    private addKonvaEdge(edge: EdgeElement) {
        const isArrow = edge.markerEnd === 'arrow'; // Determine if it's an arrow based on markerEnd

        const konvaEdge = isArrow
            ? new Konva.Arrow({
                points: edge.points,
                stroke: edge.stroke || '#374151',
                strokeWidth: edge.strokeWidth || 2,
                lineCap: 'round',
                lineJoin: 'round',
                listening: false,
                perfectDrawEnabled: false,
            })
            : new Konva.Line({
                points: edge.points,
                stroke: edge.stroke || '#374151',
                strokeWidth: edge.strokeWidth || 2,
                lineCap: 'round',
                lineJoin: 'round',
                listening: false,
                perfectDrawEnabled: false,
            });

        this.edgeMap.set(edge.id, konvaEdge);
        this.ctx.konva.getLayers().main?.add(konvaEdge);
    }

    private updateKonvaEdge(konvaEdge: Konva.Line | Konva.Arrow, edge: EdgeElement) {
        konvaEdge.points(edge.points);
        konvaEdge.stroke(edge.stroke || '#374151');
        konvaEdge.strokeWidth(edge.strokeWidth || 2);
        // Update other properties as needed
    }

    private createSnapIndicator(): Konva.Rect {
        this.snapIndicator = new Konva.Rect({
        });
        return this.snapIndicator;
    }

    private updateSnapIndicator(draft: any) {
        if (!this.snapIndicator) return;

        if (draft?.snapTarget) {
            const portCoords = this.store.elements.get(draft.snapTarget.elementId);
            if (portCoords) {
                // TODO: Use getPortWorldCoordinates to get exact port position
                this.snapIndicator.position(getPortWorldCoordinates(portCoords, draft.snapTarget.portKind, this.store.viewport.scale)!);
                this.snapIndicator.visible(true);
            } else {
                this.snapIndicator.visible(false);
            }
        } else {
            this.snapIndicator.visible(false);
        }
    }

    destroy() {
        this.unsubscribeStore();
        this.edgeMap.forEach(edge => edge.destroy());
        this.edgeMap.clear();
        this.draftLine?.destroy();
        this.draftLine = null;
        this.snapIndicator?.destroy();
        this.snapIndicator = null;
    }
}
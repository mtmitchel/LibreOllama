import React, { useMemo, useState, useCallback } from 'react';
import { Group, Rect, Circle, Line, Text, Image as KonvaImage, Path } from 'react-konva';
import { Html } from 'react-konva-utils';
import { CanvasElement, ElementType } from '../../types/canvas';
import { ResizeHandles, TableResizeHandles } from './ResizeHandles';
import { ConnectionPoints } from './ConnectionPoints';
import { RichTextEditor } from '../Elements/RichTextEditor';
import { TableEditor } from '../Elements/TableEditor';
import { useCanvasStore } from '../../store/canvasStore';
import { useTextTool } from '../../store/toolStore';

interface ElementRendererProps {
  element: CanvasElement;
  isSelected: boolean;
  isHovered: boolean;
  onSelect?: (id: string) => void;
  onDoubleClick?: (id: string) => void;
}

// Rich Text Element Implementation
const RichTextElement: React.FC<{ element: CanvasElement; [key: string]: any }> = ({ 
  element, 
  ...props 
}) => {
  const { updateElement } = useCanvasStore();
  const { textEditingState } = useTextTool();
  const [isEditing, setIsEditing] = useState(false);
  
  const data = element.data as any;
  const content = data?.content || [{ type: 'paragraph', children: [{ text: 'Text' }] }];

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleContentChange = useCallback((newContent: any) => {
    updateElement(element.id, {
      data: { ...data, content: newContent },
      modifiedAt: Date.now()
    });
  }, [element.id, data, updateElement]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
  }, []);

  if (isEditing || textEditingState?.elementId === element.id) {
    return (
      <Group {...props}>
        <Rect
          width={element.width}
          height={element.height}
          fill="transparent"
          stroke="none"
        />
        <Html
          divProps={{
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              width: element.width,
              height: element.height,
              zIndex: 1000
            }
          }}
        >
          <RichTextEditor
            value={content}
            onChange={handleContentChange}
            onBlur={handleBlur}
            autoFocus
            className="w-full h-full"
            style={{
              fontSize: data?.fontSize || 16,
              fontFamily: data?.fontFamily || 'Inter',
              color: data?.color || '#000000'
            }}
          />
        </Html>
      </Group>
    );
  }

  return (
    <Group {...props} onDblClick={handleDoubleClick}>
      <Rect
        width={element.width}
        height={element.height}
        fill={data?.backgroundColor || 'transparent'}
        stroke={data?.borderColor || 'transparent'}
        strokeWidth={data?.borderWidth || 0}
        cornerRadius={data?.borderRadius || 0}
      />
      <Text
        text={data?.text || 'Text'}
        fontSize={data?.fontSize || 16}
        fontFamily={data?.fontFamily || 'Inter'}
        fill={data?.color || '#000000'}
        width={element.width}
        height={element.height}
        align={data?.textAlign || 'left'}
        verticalAlign={data?.verticalAlign || 'top'}
        padding={data?.padding || 8}
      />
    </Group>
  );
};

// Sticky Note Element
const StickyNoteElement: React.FC<{ element: CanvasElement; [key: string]: any }> = ({ 
  element, 
  ...props 
}) => {
  const { updateElement } = useCanvasStore();
  const [isEditing, setIsEditing] = useState(false);
  
  const data = element.data as any;
  const backgroundColor = data?.backgroundColor || '#fef3c7';
  const textColor = data?.textColor || '#92400e';

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleTextChange = useCallback((newText: string) => {
    updateElement(element.id, {
      data: { ...data, text: newText },
      modifiedAt: Date.now()
    });
  }, [element.id, data, updateElement]);

  return (
    <Group {...props} onDblClick={handleDoubleClick}>
      {/* Shadow */}
      <Rect
        x={3}
        y={3}
        width={element.width}
        height={element.height}
        fill="#00000020"
        cornerRadius={8}
      />
      {/* Main body */}
      <Rect
        width={element.width}
        height={element.height}
        fill={backgroundColor}
        stroke="#00000030"
        strokeWidth={1}
        cornerRadius={8}
      />
      {/* Fold effect */}
      <Path
        data={`M ${element.width - 20} 0 L ${element.width} 0 L ${element.width} 20 Z`}
        fill="#00000010"
      />
      {isEditing ? (
        <Html
          divProps={{
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              width: element.width,
              height: element.height,
              zIndex: 1000
            }
          }}
        >
          <textarea
            value={data?.text || ''}
            onChange={(e) => handleTextChange(e.target.value)}
            onBlur={() => setIsEditing(false)}
            autoFocus
            className="w-full h-full p-3 bg-transparent border-none outline-none resize-none"
            style={{
              color: textColor,
              fontSize: '14px',
              fontFamily: 'Inter'
            }}
            placeholder="Type your note..."
          />
        </Html>
      ) : (
        <Text
          text={data?.text || 'Sticky note'}
          x={12}
          y={12}
          width={element.width - 24}
          height={element.height - 24}
          fontSize={14}
          fontFamily="Inter"
          fill={textColor}
          align="left"
          verticalAlign="top"
        />
      )}
    </Group>
  );
};

// Missing element components
const SymbolElement: React.FC<{ element: CanvasElement; [key: string]: any }> = ({ 
  element, 
  ...props 
}) => {
  const data = element.data as any;
  return (
    <Group {...props}>
      <Rect
        width={element.width}
        height={element.height}
        fill={data?.fill || '#fef3c7'}
        stroke={data?.stroke || '#f59e0b'}
        strokeWidth={2}
        cornerRadius={8}
      />
      <Text
        text={data?.symbol || '★'}
        fontSize={Math.min(element.width, element.height) * 0.6}
        fill={data?.color || '#f59e0b'}
        width={element.width}
        height={element.height}
        align="center"
        verticalAlign="middle"
      />
    </Group>
  );
};

const MediaElement: React.FC<{ element: CanvasElement; [key: string]: any }> = ({ 
  element, 
  ...props 
}) => {
  const data = element.data as any;
  return (
    <Group {...props}>
      <Rect
        width={element.width}
        height={element.height}
        fill="#1f2937"
        stroke="#374151"
        strokeWidth={1}
        cornerRadius={8}
      />
      <Text
        text={data?.type === 'video' ? '▶️' : '🎵'}
        fontSize={32}
        fill="#9ca3af"
        width={element.width}
        height={element.height}
        align="center"
        verticalAlign="middle"
      />
    </Group>
  );
};

const GroupElement: React.FC<{ element: CanvasElement; [key: string]: any }> = ({ 
  element, 
  ...props 
}) => {
  return (
    <Group {...props}>
      <Rect
        width={element.width}
        height={element.height}
        stroke="#6366f1"
        strokeWidth={1}
        dash={[5, 5]}
        fill="transparent"
      />
    </Group>
  );
};

const FrameElement: React.FC<{ element: CanvasElement; [key: string]: any }> = ({ 
  element, 
  ...props 
}) => {
  const data = element.data as any;
  return (
    <Group {...props}>
      <Rect
        width={element.width}
        height={element.height}
        fill={data?.fill || 'transparent'}
        stroke={data?.stroke || '#374151'}
        strokeWidth={data?.strokeWidth || 2}
        cornerRadius={data?.cornerRadius || 0}
      />
      {data?.title && (
        <Text
          text={data.title}
          x={8}
          y={-24}
          fontSize={14}
          fontFamily="Inter"
          fill="#374151"
          fontStyle="bold"
        />
      )}
    </Group>
  );
};

export const ElementRenderer: React.FC<ElementRendererProps> = ({
  element,
  isSelected,
  isHovered,
  onSelect,
  onDoubleClick
}) => {
  const [isEditingText, setIsEditingText] = useState(false);
  const { updateElement } = useCanvasStore();
  const { startTextEditing, endTextEditing } = useTextTool();

  const handleClick = (e: any) => {
    e.cancelBubble = true;
    onSelect?.(element.id);
  };

  const handleDoubleClick = (e: any) => {
    e.cancelBubble = true;
    onDoubleClick?.(element.id);
    
    // Start text editing for text elements
    if (element.type === ElementType.TEXT || element.type === ElementType.STICKY_NOTE) {
      setIsEditingText(true);
      startTextEditing(element.id, element.data);
    }
  };

  const handleTextChange = useCallback((content: any) => {
    updateElement(element.id, {
      data: { ...element.data, content },
      modifiedAt: Date.now()
    });
  }, [element.id, element.data, updateElement]);

  const handleTextBlur = useCallback(() => {
    setIsEditingText(false);
    endTextEditing();
  }, [endTextEditing]);

  const commonProps = {
    id: element.id,
    x: element.x,
    y: element.y,
    rotation: element.rotation,
    opacity: element.opacity,
    visible: element.visible,
    onClick: handleClick,
    onDblClick: handleDoubleClick,
    listening: !element.locked,
    draggable: false // Dragging is handled by the canvas stage
  };

  const renderElement = () => {
    switch (element.type) {
      case ElementType.RECTANGLE:
        return <RectangleElement element={element} {...commonProps} />;
      case ElementType.CIRCLE:
        return <CircleElement element={element} {...commonProps} />;
      case ElementType.TRIANGLE:
        return <TriangleElement element={element} {...commonProps} />;
      case ElementType.TEXT:
        return (
          <TextElement 
            element={element} 
            isEditing={isEditingText}
            onTextChange={handleTextChange}
            onTextBlur={handleTextBlur}
            {...commonProps} 
          />
        );
      case ElementType.STICKY_NOTE:
        return (
          <StickyNoteElement 
            element={element} 
            isEditing={isEditingText}
            onTextChange={handleTextChange}
            onTextBlur={handleTextBlur}
            {...commonProps} 
          />
        );
      case ElementType.TABLE:
        return (
          <TableEditor
            element={element}
            isSelected={isSelected}
            onCellEdit={(row, col, content) => {
              // Handle cell edit
            }}
          />
        );
      case ElementType.LINE:
        return <LineElement element={element} {...commonProps} />;
      case ElementType.ARROW:
        return <ArrowElement element={element} {...commonProps} />;
      case ElementType.CONNECTOR:
        return <ConnectorElement element={element} {...commonProps} />;
      case ElementType.FREEFORM:
        return <FreeformElement element={element} {...commonProps} />;
      case ElementType.IMAGE:
        return <ImageElement element={element} {...commonProps} />;
      case ElementType.SECTION:
        return <SectionElement element={element} {...commonProps} />;
      case ElementType.CUSTOM_SHAPE:
        return <CustomShapeElement element={element} {...commonProps} />;
      case ElementType.SYMBOL:
        return <SymbolElement element={element} {...commonProps} />;
      case ElementType.MEDIA:
        return <MediaElement element={element} {...commonProps} />;
      case ElementType.GROUP:
        return <GroupElement element={element} {...commonProps} />;
      case ElementType.FRAME:
        return <FrameElement element={element} {...commonProps} />;
      default:
        return null;
    }
  };

  const renderSelectionIndicators = () => {
    if (!isSelected) return null;

    return (
      <>
        <Rect
          x={element.x - 2}
          y={element.y - 2}
          width={element.width + 4}
          height={element.height + 4}
          stroke="#0066ff"
          strokeWidth={2}
          dash={[5, 5]}
          listening={false}
          perfectDrawEnabled={false}
        />
        {element.type === ElementType.TABLE ? (
          <TableResizeHandles
            element={element}
            onResize={(newBounds) => {
              updateElement(element.id, { 
                ...newBounds, 
                modifiedAt: Date.now() 
              });
            }}
            onRowResize={(rowIndex, newHeight) => {
              // Handle row resize
            }}
            onColumnResize={(colIndex, newWidth) => {
              // Handle column resize
            }}
          />
        ) : (
          <ResizeHandles
            element={element}
            onResize={(newBounds) => {
              updateElement(element.id, { 
                ...newBounds, 
                modifiedAt: Date.now() 
              });
            }}
          />
        )}
      </>
    );
  };

  return (
    <Group>
      {renderElement()}
      {renderSelectionIndicators()}
      
      {/* Hover indicators */}
      {isHovered && !isSelected && (
        <Rect
          x={element.x - 1}
          y={element.y - 1}
          width={element.width + 2}
          height={element.height + 2}
          stroke="#0066ff"
          strokeWidth={1}
          listening={false}
          perfectDrawEnabled={false}
        />
      )}
      
      {/* Connection points for connectors */}
      {(isSelected || isHovered) && element.type !== ElementType.TABLE && (
        <ConnectionPoints
          element={element}
          visible={isSelected || isHovered}
        />
      )}
    </Group>
  );
};

// Individual element renderers
const RectangleElement: React.FC<{ element: CanvasElement } & any> = ({ element, ...props }) => {
  const data = element.data as any;
  const style = element.style;
  
  return (
    <Rect
      {...props}
      width={element.width}
      height={element.height}
      fill={style?.fill || '#ffffff'}
      stroke={style?.stroke || '#000000'}
      strokeWidth={style?.strokeWidth || 1}
      cornerRadius={data?.cornerRadius || style?.borderRadius || 0}
      dash={style?.strokeDashArray}
      shadowColor={style?.shadow?.color}
      shadowBlur={style?.shadow?.blur}
      shadowOffset={{
        x: style?.shadow?.offsetX || 0,
        y: style?.shadow?.offsetY || 0
      }}
      perfectDrawEnabled={false}
    />
  );
};

const CircleElement: React.FC<{ element: CanvasElement } & any> = ({ element, ...props }) => {
  const style = element.style;
  const radius = Math.min(element.width, element.height) / 2;
  
  return (
    <Circle
      {...props}
      x={element.x + element.width / 2}
      y={element.y + element.height / 2}
      radius={radius}
      fill={style?.fill || '#ffffff'}
      stroke={style?.stroke || '#000000'}
      strokeWidth={style?.strokeWidth || 1}
      dash={style?.strokeDashArray}
      shadowColor={style?.shadow?.color}
      shadowBlur={style?.shadow?.blur}
      shadowOffset={{
        x: style?.shadow?.offsetX || 0,
        y: style?.shadow?.offsetY || 0
      }}
      perfectDrawEnabled={false}
    />
  );
};

const TriangleElement: React.FC<{ element: CanvasElement } & any> = ({ element, ...props }) => {
  const style = element.style;
  const points = [
    element.width / 2, 0,
    0, element.height,
    element.width, element.height
  ];
  
  return (
    <Line
      {...props}
      points={points}
      closed={true}
      fill={style?.fill || '#ffffff'}
      stroke={style?.stroke || '#000000'}
      strokeWidth={style?.strokeWidth || 1}
      dash={style?.strokeDashArray}
      shadowColor={style?.shadow?.color}
      shadowBlur={style?.shadow?.blur}
      shadowOffset={{
        x: style?.shadow?.offsetX || 0,
        y: style?.shadow?.offsetY || 0
      }}
      perfectDrawEnabled={false}
    />
  );
};

const TextElement: React.FC<{ element: CanvasElement } & any> = ({ element, ...props }) => {
  const data = element.data as any;
  
  // Convert Slate.js content to plain text for Konva
  const getText = (content: any): string => {
    if (Array.isArray(content)) {
      return content.map(node => {
        if (node.children) {
          return getText(node.children);
        }
        return node.text || '';
      }).join('\n');
    }
    return content?.text || 'Type here...';
  };
  
  const text = getText(data?.content);
  
  return (
    <Text
      {...props}
      width={element.width}
      height={element.height}
      text={text}
      fontSize={data?.fontSize || 16}
      fontFamily={data?.fontFamily || 'Inter'}
      fontStyle={`${data?.fontWeight || 'normal'} ${data?.fontStyle || 'normal'}`}
      fill={data?.color || '#000000'}
      align={data?.textAlign || 'left'}
      verticalAlign="top"
      padding={data?.padding || 0}
      lineHeight={data?.lineHeight || 1.2}
      letterSpacing={data?.letterSpacing || 0}
      wrap="word"
      ellipsis={true}
      perfectDrawEnabled={false}
    />
  );
};

// Duplicate StickyNoteElement removed - using the one defined earlier

const TableElement: React.FC<{ element: CanvasElement } & any> = ({ element, ...props }) => {
  const data = element.data as any;
  const rows = data?.rows || 3;
  const cols = data?.cols || 3;
  const cellWidth = element.width / cols;
  const cellHeight = element.height / rows;
  
  const cells = [];
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * cellWidth;
      const y = row * cellHeight;
      
      cells.push(
        <Group key={`${row}-${col}`}>
          <Rect
            x={x}
            y={y}
            width={cellWidth}
            height={cellHeight}
            fill={data?.backgroundColor || '#ffffff'}
            stroke={data?.borderColor || '#cccccc'}
            strokeWidth={data?.borderWidth || 1}
            perfectDrawEnabled={false}
          />
          <Text
            x={x + 5}
            y={y + 5}
            width={cellWidth - 10}
            height={cellHeight - 10}
            text={`Cell ${row + 1},${col + 1}`}
            fontSize={12}
            fontFamily="Inter"
            fill="#333"
            align="left"
            verticalAlign="middle"
            wrap="word"
            perfectDrawEnabled={false}
          />
        </Group>
      );
    }
  }
  
  return <Group {...props}>{cells}</Group>;
};

const LineElement: React.FC<{ element: CanvasElement } & any> = ({ element, ...props }) => {
  const data = element.data as any;
  const style = element.style;
  
  const points = data?.points ? 
    data.points.flatMap((p: any) => [p.x, p.y]) : 
    [0, 0, element.width, element.height];
  
  return (
    <Line
      {...props}
      points={points}
      stroke={style?.stroke || data?.strokeColor || '#000000'}
      strokeWidth={style?.strokeWidth || data?.strokeWidth || 2}
      dash={style?.strokeDashArray || data?.strokeDashArray}
      lineCap="round"
      lineJoin="round"
      perfectDrawEnabled={false}
    />
  );
};

const ArrowElement: React.FC<{ element: CanvasElement } & any> = ({ element, ...props }) => {
  const data = element.data as any;
  const style = element.style;
  
  const startPoint = data?.startPoint || { x: 0, y: element.height / 2 };
  const endPoint = data?.endPoint || { x: element.width, y: element.height / 2 };
  
  return (
    <Group {...props}>
      <Line
        points={[startPoint.x, startPoint.y, endPoint.x, endPoint.y]}
        stroke={style?.stroke || '#000000'}
        strokeWidth={style?.strokeWidth || 2}
        perfectDrawEnabled={false}
      />
      {/* Arrow head */}
      <Line
        points={[
          endPoint.x - 10, endPoint.y - 5,
          endPoint.x, endPoint.y,
          endPoint.x - 10, endPoint.y + 5
        ]}
        stroke={style?.stroke || '#000000'}
        strokeWidth={style?.strokeWidth || 2}
        fill={style?.stroke || '#000000'}
        closed={true}
        perfectDrawEnabled={false}
      />
    </Group>
  );
};

const ConnectorElement: React.FC<{ element: CanvasElement } & any> = ({ element, ...props }) => {
  const data = element.data as any;
  const style = element.style;
  
  const points = data?.points ? 
    data.points.flatMap((p: any) => [p.x, p.y]) : 
    [0, 0, element.width, element.height];
  
  return (
    <Line
      {...props}
      points={points}
      stroke={style?.stroke || '#000000'}
      strokeWidth={style?.strokeWidth || 2}
      dash={style?.strokeDashArray}
      lineCap="round"
      lineJoin="round"
      perfectDrawEnabled={false}
    />
  );
};

const FreeformElement: React.FC<{ element: CanvasElement } & any> = ({ element, ...props }) => {
  const data = element.data as any;
  
  if (!data?.points || data.points.length < 2) {
    return null;
  }
  
  const points = data.points.flatMap((p: any) => [p.x, p.y]);
  
  return (
    <Line
      {...props}
      points={points}
      stroke={data?.strokeColor || '#000000'}
      strokeWidth={data?.strokeWidth || 2}
      lineCap="round"
      lineJoin="round"
      tension={data?.smoothing || 0.5}
      perfectDrawEnabled={false}
    />
  );
};

const ImageElement: React.FC<{ element: CanvasElement } & any> = ({ element, ...props }) => {
  // For now, we'll render a placeholder rectangle
  // In a real implementation, you'd load and render the actual image
  return (
    <Group {...props}>
      <Rect
        width={element.width}
        height={element.height}
        fill="#f0f0f0"
        stroke="#ccc"
        strokeWidth={1}
        dash={[5, 5]}
        perfectDrawEnabled={false}
      />
      <Text
        x={element.width / 2}
        y={element.height / 2}
        text="Image"
        fontSize={14}
        fontFamily="Inter"
        fill="#666"
        align="center"
        offsetX={20}
        offsetY={7}
        perfectDrawEnabled={false}
      />
    </Group>
  );
};

const SectionElement: React.FC<{ element: CanvasElement } & any> = ({ element, ...props }) => {
  const data = element.data as any;
  
  return (
    <Group {...props}>
      <Rect
        width={element.width}
        height={element.height}
        fill="transparent"
        stroke={data?.color || '#0066ff'}
        strokeWidth={2}
        dash={[10, 5]}
        cornerRadius={8}
        perfectDrawEnabled={false}
      />
      <Text
        x={10}
        y={10}
        text={data?.title || 'Section'}
        fontSize={16}
        fontFamily="Inter"
        fontStyle="bold"
        fill={data?.color || '#0066ff'}
        perfectDrawEnabled={false}
      />
    </Group>
  );
};

const CustomShapeElement: React.FC<{ element: CanvasElement } & any> = ({ element, ...props }) => {
  const data = element.data as any;
  const style = element.style;
  
  if (!data?.path) {
    // Fallback to rectangle if no path data
    return (
      <Rect
        {...props}
        width={element.width}
        height={element.height}
        fill={style?.fill || '#ffffff'}
        stroke={style?.stroke || '#000000'}
        strokeWidth={style?.strokeWidth || 1}
        perfectDrawEnabled={false}
      />
    );
  }
  
  return (
    <Path
      {...props}
      data={data.path}
      fill={style?.fill || '#ffffff'}
      stroke={style?.stroke || '#000000'}
      strokeWidth={style?.strokeWidth || 1}
      perfectDrawEnabled={false}
    />
  );
};

export default ElementRenderer;

import React, { useRef, useState } from 'react';
import { Stage, Layer, Line } from 'react-konva';

export const MinimalCanvas: React.FC = () => {
  const [lines, setLines] = useState<any[]>([]);
  const isDrawing = useRef(false);

  const handleMouseDown = (e: any) => {
    const pos = e.target.getStage().getPointerPosition();
    isDrawing.current = true;
    setLines([...lines, { points: [pos.x, pos.y] }]);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing.current) return;
    
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const lastLine = lines[lines.length - 1];
    
    if (lastLine) {
      lastLine.points = lastLine.points.concat([point.x, point.y]);
      setLines([...lines.slice(0, lines.length - 1), lastLine]);
    }
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  return (
    <div style={{ border: '1px solid black', width: '100%', height: '500px' }}>
      <h3>Minimal Canvas Test</h3>
      <Stage
        width={800}
        height={400}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
      >
        <Layer>
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke="#000"
              strokeWidth={2}
              tension={0}
              lineCap="round"
              lineJoin="round"
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};
export interface BoundingBox { x:number; y:number; width:number; height:number }

export function getStrokeBoundingBox(points:number[]): BoundingBox {
  if (!points || points.length < 4) {
    const x = points?.[0] ?? 0;
    const y = points?.[1] ?? 0;
    return { x, y, width:1, height:1 };
  }
  let minX = points[0];
  let maxX = points[0];
  let minY = points[1];
  let maxY = points[1];
  for (let i=0;i<points.length;i+=2){
    const x = points[i];
    const y = points[i+1];
    if (x<minX) minX=x;
    if (x>maxX) maxX=x;
    if (y<minY) minY=y;
    if (y>maxY) maxY=y;
  }
  return { x:minX, y:minY, width:maxX-minX, height:maxY-minY };
} 
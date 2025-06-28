/**
 * Connector Manager - Subscribes to element changes and keeps connectors updated.
 * 
 * Part of LibreOllama Canvas Coordinate System Fixes - Priority 2
 */
import React, { useEffect, useCallback } from 'react';
import { Line } from 'react-konva';
import { useUnifiedCanvasStore, canvasSelectors } from '../../../../stores';
import type { ConnectorElement, Coordinates, CanvasElement, SectionId } from '../../types/enhanced.types';

export const ConnectorManager: React.FC<{ connectors: ConnectorElement[] }> = ({ connectors }) => {
  const elements = useUnifiedCanvasStore(canvasSelectors.elements);
  const sections = useUnifiedCanvasStore(canvasSelectors.sections);
  const updateElement = useUnifiedCanvasStore(state => state.updateElement);  // Get element's absolute position, considering parent sections
  const getElementAbsolutePosition = useCallback((element: CanvasElement | { x: number; y: number; sectionId?: SectionId | null }): Coordinates => {
    let pos = { x: element.x, y: element.y };
    
    if (element.sectionId && sections) {
      const section = sections.get(element.sectionId);
      if (section) {
        // Recursively find parent position (sections can be nested)
        const sectionPos = getElementAbsolutePosition(section);
        pos = { 
          x: pos.x + sectionPos.x, 
          y: pos.y + sectionPos.y 
        };
      }
    }
    
    return pos;
  }, [sections]);

  // Calculate connection point on element (center, edge, etc.)
  const getConnectionPoint = useCallback((element: CanvasElement, anchorPoint?: string): Coordinates => {
    const absPos = getElementAbsolutePosition(element);
    
    // Default to center if no anchor specified
    let offsetX = 0;
    let offsetY = 0;
    
    // Calculate element dimensions for offset
    if ('width' in element && 'height' in element) {
      const width = element.width as number;
      const height = element.height as number;
      
      switch (anchorPoint) {
        case 'top':
          offsetX = width / 2;
          offsetY = 0;
          break;
        case 'bottom':
          offsetX = width / 2;
          offsetY = height;
          break;
        case 'left':
          offsetX = 0;
          offsetY = height / 2;
          break;
        case 'right':
          offsetX = width;
          offsetY = height / 2;
          break;
        default: // center
          offsetX = width / 2;
          offsetY = height / 2;
      }
    } else if ('radius' in element) {
      const radius = element.radius as number;
      offsetX = radius;
      offsetY = radius;
    }
    
    return {
      x: absPos.x + offsetX,
      y: absPos.y + offsetY
    };
  }, [getElementAbsolutePosition]);

  // Update a connector's path based on its connected elements
  const updateConnectorPath = useCallback((connector: ConnectorElement) => {
    let startPoint = connector.startPoint;
    let endPoint = connector.endPoint;      // Update start point if connected to an element
    if (connector.startElementId) {
      const startElement = elements.get(connector.startElementId);
      if (startElement) {
        startPoint = getConnectionPoint(startElement, 'center');
      }
    }
    
    // Update end point if connected to an element
    if (connector.endElementId) {
      const endElement = elements.get(connector.endElementId);
      if (endElement) {
        endPoint = getConnectionPoint(endElement, 'center');
      }
    }
    
    // Calculate intermediate points for bent/curved connectors
    let intermediatePoints: { x: number; y: number }[] = [];
    if (connector.subType === 'bent') {
      // Simple L-shaped connector
      const midX = (startPoint.x + endPoint.x) / 2;
      intermediatePoints = [
        { x: midX, y: startPoint.y },
        { x: midX, y: endPoint.y }
      ];
    } else if (connector.subType === 'curved') {
      // Bezier curve approximation
      const controlPoint1 = {
        x: startPoint.x + (endPoint.x - startPoint.x) * 0.3,
        y: startPoint.y
      };
      const controlPoint2 = {
        x: startPoint.x + (endPoint.x - startPoint.x) * 0.7,
        y: endPoint.y
      };
      intermediatePoints = [controlPoint1, controlPoint2];
    }
    
    // Update the connector if points have changed
    const hasChanged = 
      connector.startPoint.x !== startPoint.x ||
      connector.startPoint.y !== startPoint.y ||
      connector.endPoint.x !== endPoint.x ||
      connector.endPoint.y !== endPoint.y ||
      JSON.stringify(connector.intermediatePoints) !== JSON.stringify(intermediatePoints);    if (hasChanged) {
      updateElement(connector.id, {
        startPoint,
        endPoint,
        intermediatePoints
      });
    }
  }, [elements, getConnectionPoint, updateElement]);
  // Subscribe to element changes and update all connectors with debouncing
  useEffect(() => {
    // Debounce updates to avoid excessive recalculation
    const timeoutId = setTimeout(() => {
      connectors.forEach(updateConnectorPath);
    }, 16); // ~60fps
    
    return () => clearTimeout(timeoutId);
  }, [elements, sections, connectors, updateConnectorPath]);
  return (
    <>
      {connectors.map(connector => (
        <Line
          key={connector.id}
          points={[
            connector.startPoint.x, connector.startPoint.y,
            connector.endPoint.x, connector.endPoint.y
          ]}
          stroke={connector.stroke || '#333'}
          strokeWidth={connector.strokeWidth || 2}
          lineCap="round"
          lineJoin="round"
        />
      ))}
    </>
  );
};

export default ConnectorManager;

import React from 'react';
import { useUnifiedCanvasStore } from '../stores/unifiedCanvasStore';

export const CanvasDebugInfo: React.FC = () => {
  const elements = useUnifiedCanvasStore(state => state.elements);
  const selectedElementIds = useUnifiedCanvasStore(state => state.selectedElementIds);
  const selectedTool = useUnifiedCanvasStore(state => state.selectedTool);
  const textEditingElementId = useUnifiedCanvasStore(state => state.textEditingElementId);
  const selectElement = useUnifiedCanvasStore(state => state.selectElement);
  const clearSelection = useUnifiedCanvasStore(state => state.clearSelection);
  
  const textElements = Array.from(elements.values()).filter(el => el.type === 'text');
  const selectedElements = Array.from(selectedElementIds);
  
  // Test function to manually select text elements
  const testSelectTextElement = (elementId: string) => {
    console.log('🧪 [DebugInfo] Manually selecting text element:', elementId);
    selectElement(elementId, false);
  };
  
  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      right: 10,
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '11px',
      fontFamily: 'monospace',
      maxWidth: '350px',
      zIndex: 9999,
      border: '1px solid #333'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#3B82F6' }}>Canvas Debug Info</div>
      <div>Tool: <span style={{color: '#10B981'}}>{selectedTool}</span></div>
      <div>Total Elements: <span style={{color: '#F59E0B'}}>{elements.size}</span></div>
      <div>Text Elements: <span style={{color: '#EF4444'}}>{textElements.length}</span></div>
      <div>Selected: <span style={{color: '#8B5CF6'}}>{selectedElements.join(', ') || 'none'}</span></div>
      <div>Editing: <span style={{color: '#EC4899'}}>{textEditingElementId || 'none'}</span></div>
      
      <hr style={{ margin: '8px 0', opacity: 0.3, border: 'none', height: '1px', background: '#333' }} />
      
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Text Elements:</div>
      {textElements.length === 0 ? (
        <div style={{ color: '#666', fontStyle: 'italic' }}>No text elements found</div>
      ) : (
        textElements.map(el => (
          <div key={el.id} style={{ 
            marginLeft: '8px',
            marginBottom: '4px',
            padding: '4px',
            background: selectedElementIds.has(el.id) ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            fontSize: '10px'
          }}>
            <div style={{ color: selectedElementIds.has(el.id) ? '#3B82F6' : 'white' }}>
              ID: {el.id.substring(0, 12)}...
            </div>
            <div>Text: "{(el as any).text}"</div>
            <div>Pos: ({el.x}, {el.y})</div>
            <button
              onClick={() => testSelectTextElement(el.id)}
              style={{
                marginTop: '2px',
                padding: '2px 6px',
                fontSize: '9px',
                background: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              Select
            </button>
          </div>
        ))
      )}
      
      <hr style={{ margin: '8px 0', opacity: 0.3, border: 'none', height: '1px', background: '#333' }} />
      
      <div style={{ fontSize: '10px' }}>
        <button
          onClick={() => {
            console.log('🧪 [DebugInfo] Clearing all selections');
            clearSelection();
          }}
          style={{
            padding: '4px 8px',
            fontSize: '10px',
            background: '#EF4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '4px'
          }}
        >
          Clear Selection
        </button>
        
        <button
          onClick={() => {
            console.log('🧪 [DebugInfo] Store state:', {
              elements: Array.from(elements.entries()),
              selectedElementIds: Array.from(selectedElementIds),
              textElements: textElements
            });
          }}
          style={{
            padding: '4px 8px',
            fontSize: '10px',
            background: '#10B981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Log Store
        </button>
      </div>
    </div>
  );
};

export default CanvasDebugInfo; 
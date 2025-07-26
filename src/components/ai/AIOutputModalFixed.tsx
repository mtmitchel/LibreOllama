import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

interface AIOutputModalFixedProps {
  isOpen: boolean;
  onClose: () => void;
  output: string;
  isLoading?: boolean;
}

export function AIOutputModalFixed({ 
  isOpen, 
  onClose, 
  output, 
  isLoading 
}: AIOutputModalFixedProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Force focus to modal
    if (modalRef.current) {
      modalRef.current.focus();
    }

    // Global escape handler with highest priority
    const handleGlobalEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('ESCAPE KEY PRESSED - FORCE CLOSING MODAL');
        onClose();
      }
    };

    // Add to window with capture phase to intercept all events
    window.addEventListener('keydown', handleGlobalEscape, true);
    
    // Also add to document for redundancy
    document.addEventListener('keydown', handleGlobalEscape, true);
    
    // Prevent body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleGlobalEscape, true);
      document.removeEventListener('keydown', handleGlobalEscape, true);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('BACKDROP CLICKED - CLOSING MODAL');
    onClose();
  };

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  const handleCloseClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('CLOSE BUTTON CLICKED - CLOSING MODAL');
    onClose();
  };

  // Create portal content
  const modalContent = (
    <div
      ref={modalRef}
      tabIndex={-1}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2147483647, // Max z-index
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        cursor: 'pointer'
      }}
      onClick={handleBackdropClick}
      onMouseDown={handleBackdropClick}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          cursor: 'default',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          position: 'relative'
        }}
        onClick={handleModalClick}
        onMouseDown={handleModalClick}
      >
        {/* Close button with multiple click handlers */}
        <button
          onClick={handleCloseClick}
          onMouseDown={handleCloseClick}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '32px',
            height: '32px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            color: '#666',
            zIndex: 10
          }}
          aria-label="Close modal"
          type="button"
        >
          ✕
        </button>

        <h2 style={{ marginTop: 0, marginBottom: '16px', paddingRight: '40px' }}>
          AI Response
        </h2>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '18px', color: '#666' }}>Processing...</div>
          </div>
        ) : (
          <div style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '16px', 
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            <pre style={{ 
              margin: 0, 
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: '14px'
            }}>
              {output || 'No response'}
            </pre>
          </div>
        )}

        {/* Bottom close button for extra redundancy */}
        <div style={{ textAlign: 'right', marginTop: '16px' }}>
          <button
            onClick={handleCloseClick}
            onMouseDown={handleCloseClick}
            style={{
              padding: '8px 16px',
              backgroundColor: '#e5e5e5',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  // Use ReactDOM.createPortal directly
  return ReactDOM.createPortal(modalContent, document.body);
}
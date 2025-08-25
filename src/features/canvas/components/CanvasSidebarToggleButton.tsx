import React from 'react';

interface CanvasSidebarToggleProps {
  isOpen: boolean;
  onToggle: () => void;
}

const CanvasSidebarToggle: React.FC<CanvasSidebarToggleProps> = ({ isOpen, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className="canvas-sidebar-toggle"
      title={isOpen ? 'Hide Canvas Sidebar' : 'Show Canvas Sidebar'}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d={isOpen ? "M19 12H5M12 19l-7-7 7-7" : "M5 12h14M12 5l7 7-7 7"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};

export default CanvasSidebarToggle;
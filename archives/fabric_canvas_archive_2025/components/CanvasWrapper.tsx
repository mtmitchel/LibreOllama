import React, { useState, useEffect, useRef } from 'react';
import ModernFabricCanvas from '../pages/ModernFabricCanvas';

const CanvasWrapper: React.FC = () => {
  const [mountKey, setMountKey] = useState(0);
  const [useSimpleCanvas, setUseSimpleCanvas] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !hasInitialized.current) {
      hasInitialized.current = true;
      // Prevent double mounting in StrictMode
      const timer = setTimeout(() => {
        setMountKey(1); // Only increment once
      }, 50);
      return () => clearTimeout(timer);
    }
  }, []);

  // Using the modern, fully-featured canvas implementation
  return <ModernFabricCanvas key={mountKey} />;
};

export default CanvasWrapper;
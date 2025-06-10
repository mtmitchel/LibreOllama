import React, { useState, useEffect, useRef } from 'react';
import Canvas from '../pages/Canvas'; // Adjust path if Canvas.tsx is elsewhere

const CanvasWrapper: React.FC = () => {
  const [mountKey, setMountKey] = useState(0);
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

  return <Canvas key={mountKey} />;
};

export default CanvasWrapper;

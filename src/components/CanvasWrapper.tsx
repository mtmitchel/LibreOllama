import React, { useState, useEffect, useRef } from 'react';
import Canvas from '../pages/Canvas'; // Adjust path if Canvas.tsx is elsewhere

const CanvasWrapper: React.FC = () => {
  const [mountKey, setMountKey] = useState(0);
  const initialized = useRef(false);

  useEffect(() => {
    // Enhanced StrictMode handling with stable reference pattern
    // This prevents multiple initialization cycles in React 18 StrictMode
    if (!initialized.current && process.env.NODE_ENV === 'development') {
      initialized.current = true;
      const timer = setTimeout(() => {
        console.log('CanvasWrapper: Forcing re-mount of Canvas with new key to stabilize after StrictMode.');
        setMountKey(prev => prev + 1);
      }, 100); // Slightly longer delay to ensure StrictMode cycle completion
      return () => clearTimeout(timer);
    }
  }, []);

  // In production, or if not in development, mountKey remains 0, so Canvas mounts normally once.
  return <Canvas key={mountKey} />;
};

export default CanvasWrapper;

import React, { useEffect, useState } from 'react';

const FabricLoadTest: React.FC = () => {
  const [status, setStatus] = useState<any>({
    windowFabric: false,
    importFabric: false,
    fabricVersion: null,
    error: null
  });

  useEffect(() => {
    // Test 1: Check if fabric exists on window
    const windowCheck = (window as any).fabric;
    
    // Test 2: Try dynamic import
    import('fabric').then((module) => {
      setStatus({
        windowFabric: !!windowCheck,
        importFabric: true,
        fabricVersion: module.version || 'unknown',
        moduleKeys: Object.keys(module).join(', '),
        error: null
      });
    }).catch(error => {
      setStatus({
        windowFabric: !!windowCheck,
        importFabric: false,
        fabricVersion: null,
        error: error.toString()
      });
    });
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Fabric.js Load Test</h1>
      <pre style={{ 
        backgroundColor: '#f0f0f0', 
        padding: '20px', 
        borderRadius: '8px',
        border: '1px solid #ccc'
      }}>
{JSON.stringify(status, null, 2)}
      </pre>
      
      <div style={{ marginTop: '20px' }}>
        <h2>What this means:</h2>
        <ul>
          <li>windowFabric: {status.windowFabric ? '✅ Fabric is available globally' : '❌ Fabric NOT on window object'}</li>
          <li>importFabric: {status.importFabric ? '✅ ES6 import successful' : '❌ ES6 import failed'}</li>
          <li>version: {status.fabricVersion || 'Not detected'}</li>
        </ul>
      </div>

      {status.error && (
        <div style={{ 
          marginTop: '20px', 
          padding: '10px', 
          backgroundColor: '#fee', 
          border: '1px solid #fcc',
          borderRadius: '4px'
        }}>
          <strong>Error:</strong> {status.error}
        </div>
      )}
    </div>
  );
};

export default FabricLoadTest;
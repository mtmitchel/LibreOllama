import React, { useRef, useEffect, useState } from 'react';

const DiagnosticCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [logs, setLogs] = useState<string[]>(['🔍 Starting diagnostic...']);
  const [fabricCanvas, setFabricCanvas] = useState<any>(null);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    const runDiagnostic = async () => {
      try {
        addLog('📋 Step 1: Checking Fabric.js availability...');
        
        // Check if fabric is imported
        const fabricModule = await import('fabric');
        addLog(`✅ Step 1 PASSED: Fabric.js imported - ${typeof fabricModule}`);
        
        addLog('📋 Step 2: Checking Fabric constructors...');
        const { Canvas, Rect, IText } = fabricModule;
        addLog(`✅ Step 2 PASSED: Canvas=${typeof Canvas}, Rect=${typeof Rect}, IText=${typeof IText}`);
        
        addLog('📋 Step 3: Checking canvas element...');
        if (!canvasRef.current) {
          addLog('❌ Step 3 FAILED: Canvas element not found');
          return;
        }
        addLog(`✅ Step 3 PASSED: Canvas element found - ${canvasRef.current.tagName}`);
        
        addLog('📋 Step 4: Getting canvas element properties...');
        const canvasElement = canvasRef.current;
        addLog(`📊 Canvas ID: ${canvasElement.id}`);
        addLog(`📊 Canvas dimensions: ${canvasElement.width}x${canvasElement.height}`);
        addLog(`📊 Canvas in DOM: ${document.contains(canvasElement)}`);
        
        addLog('📋 Step 5: Attempting Fabric canvas creation...');
        const fabricInstance = new Canvas(canvasElement, {
          width: 800,
          height: 600,
          backgroundColor: '#ffffff',
          selection: true
        });
        
        addLog(`✅ Step 5 PASSED: Fabric canvas created - ${typeof fabricInstance}`);
        setFabricCanvas(fabricInstance);
        
        addLog('📋 Step 6: Testing basic canvas operations...');
        addLog(`📊 Canvas width: ${fabricInstance.getWidth()}`);
        addLog(`📊 Canvas height: ${fabricInstance.getHeight()}`);
        addLog(`📊 Canvas zoom: ${fabricInstance.getZoom()}`);
        
        addLog('📋 Step 7: Adding test rectangle...');
        const testRect = new Rect({
          left: 100,
          top: 100,
          width: 150,
          height: 100,
          fill: '#ff0000',
          stroke: '#000000',
          strokeWidth: 2
        });
        
        fabricInstance.add(testRect);
        addLog(`✅ Step 7 PASSED: Rectangle added`);
        
        addLog('📋 Step 8: Adding test text...');
        const testText = new IText('DIAGNOSTIC TEST', {
          left: 300,
          top: 150,
          fontSize: 24,
          fill: '#0000ff',
          fontWeight: 'bold'
        });
        
        fabricInstance.add(testText);
        addLog(`✅ Step 8 PASSED: Text added`);
        
        addLog('📋 Step 9: Rendering canvas...');
        fabricInstance.renderAll();
        addLog(`✅ Step 9 PASSED: Canvas rendered`);
        
        addLog('📋 Step 10: Final validation...');
        const objectCount = fabricInstance.getObjects().length;
        addLog(`📊 Final object count: ${objectCount}`);
        
        if (objectCount === 2) {
          addLog('🎉 SUCCESS: All diagnostic steps passed! Canvas should be working.');
        } else {
          addLog(`⚠️ WARNING: Expected 2 objects, found ${objectCount}`);
        }
        
      } catch (error: any) {
        addLog(`❌ DIAGNOSTIC FAILED: ${error.message}`);
        addLog(`❌ Error stack: ${error.stack}`);
      }
    };

    // Run diagnostic after a short delay to ensure DOM is ready
    const timer = setTimeout(runDiagnostic, 500);
    return () => clearTimeout(timer);
  }, []);

  const clearLogs = () => {
    setLogs(['🔍 Logs cleared...']);
  };

  const retryDiagnostic = () => {
    setLogs(['🔄 Retrying diagnostic...']);
    window.location.reload();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">🔬 Canvas Diagnostic Tool</h1>
        <p className="text-gray-600">
          This tool runs a step-by-step diagnostic to identify exactly where canvas initialization fails.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Canvas Area */}
        <div className="bg-white rounded-lg border p-4">
          <h2 className="text-xl font-semibold mb-4">Canvas Output</h2>
          <div className="border-4 border-blue-500 inline-block">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="border border-gray-300"
              style={{ backgroundColor: '#ffffff' }}
            />
          </div>
          
          <div className="mt-4 space-x-2">
            <button
              onClick={clearLogs}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Clear Logs
            </button>
            <button
              onClick={retryDiagnostic}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Retry Diagnostic
            </button>
          </div>
        </div>

        {/* Diagnostic Logs */}
        <div className="bg-gray-100 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Diagnostic Log</h2>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className={`mb-1 ${
                log.includes('❌') ? 'text-red-400' : 
                log.includes('✅') ? 'text-green-400' : 
                log.includes('⚠️') ? 'text-yellow-400' : 
                log.includes('🎉') ? 'text-blue-400' : 
                'text-gray-300'
              }`}>
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Current Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Canvas Ready:</span>{' '}
            <span className={fabricCanvas ? 'text-green-600' : 'text-red-600'}>
              {fabricCanvas ? '✅ YES' : '❌ NO'}
            </span>
          </div>
          <div>
            <span className="font-medium">Object Count:</span>{' '}
            <span className="text-blue-600">
              {fabricCanvas ? fabricCanvas.getObjects?.()?.length || 0 : 'N/A'}
            </span>
          </div>
          <div>
            <span className="font-medium">Canvas Element:</span>{' '}
            <span className={canvasRef.current ? 'text-green-600' : 'text-red-600'}>
              {canvasRef.current ? '✅ Found' : '❌ Missing'}
            </span>
          </div>
          <div>
            <span className="font-medium">Total Logs:</span>{' '}
            <span className="text-gray-600">{logs.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticCanvas;

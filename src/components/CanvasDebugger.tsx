import React, { useEffect, useRef, useState } from 'react';

/**
 * Canvas Debug Component - Test hardware acceleration and canvas functionality
 * This component performs comprehensive canvas testing in the actual Tauri app
 */
const CanvasDebugger: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    const runCanvasTests = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const results: string[] = [];
      const info: any = {};

      try {
        // Test 1: 2D Context Creation
        const ctx2d = canvas.getContext('2d');
        if (ctx2d) {
          results.push('✅ 2D Canvas context created successfully');
          
          // Test basic drawing
          ctx2d.fillStyle = 'red';
          ctx2d.fillRect(10, 10, 50, 50);
          
          ctx2d.fillStyle = 'blue';
          ctx2d.fillRect(70, 10, 50, 50);          // Test image data reading
          try {
            const imageData = ctx2d.getImageData(25, 25, 1, 1);
            const redValue = imageData?.data?.[0] ?? 0;
            if (redValue > 200) {
              results.push('✅ Canvas drawing and pixel reading works');
            } else {
              results.push('❌ Canvas drawing failed - pixel data incorrect');
            }
          } catch (e) {
            results.push('❌ Canvas getImageData failed');
          }
        } else {
          results.push('❌ Failed to create 2D canvas context');
        }

        // Test 2: WebGL Context Creation  
        const webglCtx = canvas.getContext('webgl') as WebGLRenderingContext | null;
        if (webglCtx) {
          results.push('✅ WebGL context created successfully');
          
          const renderer = webglCtx.getParameter(webglCtx.RENDERER);
          const vendor = webglCtx.getParameter(webglCtx.VENDOR);
          
          info.webglRenderer = renderer;
          info.webglVendor = vendor;
          
          if (renderer && !renderer.match(/software|swiftshader/i)) {
            results.push('✅ Hardware acceleration detected');
          } else {
            results.push('⚠️ Software rendering detected - hardware acceleration may be disabled');
          }
        } else {
          results.push('❌ Failed to create WebGL context');
        }

        // Test 3: Browser Environment Check
        info.userAgent = navigator.userAgent;
        info.webview2 = navigator.userAgent.includes('WebView2');
        
        if (info.webview2) {
          results.push('✅ Running in WebView2 environment');
        } else {
          results.push('⚠️ Not running in WebView2 - may be in browser');
        }

        // Test 4: Canvas toDataURL
        try {
          const dataUrl = canvas.toDataURL();
          if (dataUrl.startsWith('data:image/png;base64,')) {
            results.push('✅ Canvas export (toDataURL) works');
          } else {
            results.push('❌ Canvas export failed');
          }
        } catch (e) {
          results.push(`❌ Canvas export failed: ${e}`);
        }

        // Test 5: Try to load Konva
        try {
          const Konva = await import('konva');
          if (Konva.default) {
            results.push('✅ Konva imported successfully');
            
            // Test Konva stage creation
            const div = document.createElement('div');
            const stage = new Konva.default.Stage({
              container: div,
              width: 200,
              height: 200,
            });
            
            if (stage) {
              results.push('✅ Konva Stage created successfully');
              stage.destroy();
            }
          }
        } catch (e) {
          results.push(`❌ Konva import failed: ${e}`);
        }

        setTestResults(results);
        setDebugInfo(info);

      } catch (error) {
        results.push(`❌ Canvas testing failed: ${error}`);
        setTestResults(results);
      }
    };

    runCanvasTests();
  }, []);

  return (
    <div className="p-6 bg-gray-100 rounded-lg m-4">
      <h2 className="text-2xl font-bold mb-4">Canvas Hardware Acceleration Debug</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Canvas Test Area */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Canvas Test</h3>
          <canvas 
            ref={canvasRef}
            width={300}
            height={200}
            className="border border-gray-400 bg-white"
          />
          <p className="text-sm text-gray-600 mt-2">
            Red and blue squares should appear if canvas drawing works
          </p>
        </div>

        {/* Test Results */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Test Results</h3>
          <div className="bg-white p-3 rounded border max-h-64 overflow-y-auto">
            {testResults.map((result, index) => (
              <div key={index} className="text-sm mb-1 font-mono">
                {result}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Debug Information */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">System Information</h3>
        <div className="bg-white p-3 rounded border">
          <pre className="text-xs text-gray-700 overflow-x-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default CanvasDebugger;

import React, { useState, useEffect } from 'react';
import { useOnboarding } from '@/hooks/use-onboarding';
import { OllamaModel } from '@/lib/types';
import { cn } from '@/lib/utils';
import { 
  Download, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  Loader2,
  HardDrive,
  Zap,
  Shield
} from 'lucide-react';

interface OllamaSetupProps {
  onNext: () => void;
  onPrevious: () => void;
}

export function OllamaSetup({ onNext, onPrevious }: OllamaSetupProps) {
  const { 
    state, 
    recommendedModels, 
    updateOllamaStatus, 
    setSelectedModels 
  } = useOnboarding();
  
  const [isChecking, setIsChecking] = useState(false);
  const [ollamaInstalled, setOllamaInstalled] = useState(false);
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>(['llama3.2:1b']);
  const [downloadingModels, setDownloadingModels] = useState<Set<string>>(new Set());
  const [downloadedModels, setDownloadedModels] = useState<Set<string>>(new Set());

  // Check Ollama installation status
  useEffect(() => {
    checkOllamaInstallation();
  }, []);

  const checkOllamaInstallation = async () => {
    setIsChecking(true);
    updateOllamaStatus('checking');
    
    try {
      // Simulate checking Ollama installation
      // In real implementation, this would call a Tauri command
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, assume Ollama is not installed initially
      const installed = Math.random() > 0.7; // 30% chance it's already installed
      setOllamaInstalled(installed);
      
      if (installed) {
        updateOllamaStatus('completed');
        // Check which models are already downloaded
        const alreadyDownloaded = recommendedModels
          .filter(() => Math.random() > 0.5)
          .map(m => m.name);
        setDownloadedModels(new Set(alreadyDownloaded));
      } else {
        updateOllamaStatus('not-started');
      }
    } catch (error) {
      updateOllamaStatus('error');
    } finally {
      setIsChecking(false);
    }
  };

  const handleInstallOllama = async () => {
    updateOllamaStatus('installing');
    
    try {
      // Simulate installation process
      await new Promise(resolve => setTimeout(resolve, 3000));
      setOllamaInstalled(true);
      updateOllamaStatus('completed');
    } catch (error) {
      updateOllamaStatus('error');
    }
  };

  const handleModelToggle = (modelName: string) => {
    setSelectedModelIds(prev => {
      const newSelection = prev.includes(modelName)
        ? prev.filter(id => id !== modelName)
        : [...prev, modelName];
      
      setSelectedModels(newSelection);
      return newSelection;
    });
  };

  const handleDownloadModels = async () => {
    updateOllamaStatus('downloading-models');
    
    for (const modelName of selectedModelIds) {
      if (!downloadedModels.has(modelName)) {
        setDownloadingModels(prev => new Set([...prev, modelName]));
        
        // Simulate download with progress
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setDownloadingModels(prev => {
          const newSet = new Set(prev);
          newSet.delete(modelName);
          return newSet;
        });
        
        setDownloadedModels(prev => new Set([...prev, modelName]));
      }
    }
    
    updateOllamaStatus('completed');
  };

  const canProceed = ollamaInstalled && selectedModelIds.length > 0 && 
    selectedModelIds.every(id => downloadedModels.has(id));

  return (
    <div className="px-8 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Setup Local AI with Ollama
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Ollama runs AI models locally on your computer, ensuring complete privacy 
            and offline functionality. Let's get you set up with the best models for your needs.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">100% Private</h3>
            <p className="text-sm text-gray-600">
              Your conversations never leave your device
            </p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Lightning Fast</h3>
            <p className="text-sm text-gray-600">
              No internet required, instant responses
            </p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <HardDrive className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Your Hardware</h3>
            <p className="text-sm text-gray-600">
              Runs efficiently on your existing computer
            </p>
          </div>
        </div>

        {/* Ollama Installation Status */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Ollama Installation</h3>
            {isChecking ? (
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            ) : ollamaInstalled ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-orange-500" />
            )}
          </div>

          {isChecking ? (
            <div className="text-center py-4">
              <p className="text-gray-600">Checking for Ollama installation...</p>
            </div>
          ) : ollamaInstalled ? (
            <div className="flex items-center space-x-3 text-green-700 bg-green-50 p-4 rounded-lg">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Ollama is installed and ready!</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-orange-700 bg-orange-50 p-4 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <span>Ollama needs to be installed to continue</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Download and install Ollama from the official website
                  </p>
                  <a 
                    href="https://ollama.ai" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Visit ollama.ai
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </a>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={checkOllamaInstallation}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Check Again
                  </button>
                  <button
                    onClick={handleInstallOllama}
                    disabled={state.ollamaSetupStatus === 'installing'}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {state.ollamaSetupStatus === 'installing' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Installing...
                      </>
                    ) : (
                      'Install Ollama'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Model Selection */}
        {ollamaInstalled && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Choose AI Models
            </h3>
            <p className="text-gray-600 mb-6">
              Select one or more models to download. We recommend starting with smaller, 
              faster models that work well for most tasks.
            </p>

            <div className="grid gap-4">
              {recommendedModels.map((model) => {
                const isSelected = selectedModelIds.includes(model.name);
                const isDownloading = downloadingModels.has(model.name);
                const isDownloaded = downloadedModels.has(model.name);

                return (
                  <div
                    key={model.name}
                    className={cn(
                      "border-2 rounded-lg p-4 cursor-pointer transition-all",
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => !isDownloading && handleModelToggle(model.name)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center",
                          isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300"
                        )}>
                          {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">
                              {model.displayName}
                            </h4>
                            {model.isRecommended && (
                              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                                Recommended
                              </span>
                            )}
                            {model.isSmall && (
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                                Fast
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {model.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Size: {model.size}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {isDownloading && (
                          <div className="flex items-center space-x-2 text-blue-600">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Downloading...</span>
                          </div>
                        )}
                        {isDownloaded && (
                          <div className="flex items-center space-x-2 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm">Downloaded</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedModelIds.length > 0 && !selectedModelIds.every(id => downloadedModels.has(id)) && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleDownloadModels}
                  disabled={state.ollamaSetupStatus === 'downloading-models'}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {state.ollamaSetupStatus === 'downloading-models' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                      Downloading Models...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2 inline" />
                      Download Selected Models
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Success State */}
        {canProceed && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
            <h3 className="font-semibold text-green-900 mb-2">
              Setup Complete!
            </h3>
            <p className="text-green-700">
              Ollama is installed and your selected models are ready to use.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
/**
 * Gmail Tauri Test Component
 * 
 * This component provides a testing interface for validating the end-to-end
 * Gmail API integration through the new Tauri service architecture.
 */

import React, { useState, useCallback } from 'react';
import { createGmailTauriService } from '../services/gmailTauriService';
import type { GmailLabel, MessageSearchResult } from '../types';

interface TestResult {
  success: boolean;
  labels: GmailLabel[];
  messages: MessageSearchResult;
  error?: string;
  executionTime?: number;
}

interface TestComponentProps {
  accountId?: string;
  onResult?: (result: TestResult) => void;
}

export const GmailTauriTestComponent: React.FC<TestComponentProps> = ({ 
  accountId = 'test-account-id',
  onResult 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [selectedTest, setSelectedTest] = useState<'labels' | 'messages' | 'full'>('full');

  const runTest = useCallback(async () => {
    if (!accountId) {
      const result: TestResult = {
        success: false,
        labels: [],
        messages: { messages: [], next_page_token: undefined, result_size_estimate: 0 },
        error: 'No account ID provided'
      };
      setTestResult(result);
      onResult?.(result);
      return;
    }

    setIsLoading(true);
    const startTime = Date.now();
    
    try {
      const service = createGmailTauriService(accountId);
      
      let result: TestResult;
      
      switch (selectedTest) {
        case 'labels':
          console.log('🧪 Testing labels only...');
          const labels = await service.getLabels();
          result = {
            success: true,
            labels,
            messages: { messages: [], next_page_token: undefined, result_size_estimate: 0 },
            executionTime: Date.now() - startTime
          };
          break;
          
        case 'messages':
          console.log('🧪 Testing messages only...');
          const messages = await service.searchMessages(undefined, ['INBOX'], 5);
          result = {
            success: true,
            labels: [],
            messages,
            executionTime: Date.now() - startTime
          };
          break;
          
        case 'full':
        default:
          console.log('🧪 Testing full end-to-end flow...');
          const fullResult = await service.testEndToEndFlow();
          result = {
            ...fullResult,
            executionTime: Date.now() - startTime
          };
          break;
      }
      
      setTestResult(result);
      onResult?.(result);
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      const result: TestResult = {
        success: false,
        labels: [],
        messages: { messages: [], next_page_token: undefined, result_size_estimate: 0 },
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime
      };
      setTestResult(result);
      onResult?.(result);
    } finally {
      setIsLoading(false);
    }
  }, [accountId, selectedTest, onResult]);

  const resetTest = useCallback(() => {
    setTestResult(null);
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Gmail Tauri Service Test
      </h2>
      
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account ID
            </label>
            <input
              type="text"
              value={accountId}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Test Type
            </label>
            <select
              value={selectedTest}
              onChange={(e) => setSelectedTest(e.target.value as 'labels' | 'messages' | 'full')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={isLoading}
            >
              <option value="full">Full End-to-End Test</option>
              <option value="labels">Labels Only</option>
              <option value="messages">Messages Only</option>
            </select>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={runTest}
            disabled={isLoading}
            className={`px-4 py-2 rounded-md font-medium ${
              isLoading 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Running Test...' : 'Run Test'}
          </button>
          
          <button
            onClick={resetTest}
            disabled={isLoading}
            className="px-4 py-2 rounded-md font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            Reset
          </button>
        </div>
      </div>

      {testResult && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Test Results
          </h3>
          
          <div className={`p-4 rounded-md mb-4 ${
            testResult.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center space-x-2">
              <span className={`text-lg ${
                testResult.success ? 'text-green-600' : 'text-red-600'
              }`}>
                {testResult.success ? '✅' : '❌'}
              </span>
              <span className={`font-medium ${
                testResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {testResult.success ? 'Test Passed' : 'Test Failed'}
              </span>
              {testResult.executionTime && (
                <span className="text-sm text-gray-500">
                  ({testResult.executionTime}ms)
                </span>
              )}
            </div>
            
            {testResult.error && (
              <div className="mt-2 text-sm text-red-700">
                <strong>Error:</strong> {testResult.error}
              </div>
            )}
          </div>

          {testResult.success && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Labels Results */}
              {testResult.labels.length > 0 && (
                <div>
                  <h4 className="text-md font-medium mb-2 text-gray-700">
                    Labels ({testResult.labels.length})
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-md max-h-48 overflow-y-auto">
                    {testResult.labels.slice(0, 10).map((label) => (
                      <div key={label.id} className="flex justify-between items-center py-1 border-b border-gray-200 last:border-b-0">
                        <span className="text-sm text-gray-800">{label.name}</span>
                        <span className="text-xs text-gray-500">{label.id}</span>
                      </div>
                    ))}
                    {testResult.labels.length > 10 && (
                      <div className="text-xs text-gray-500 mt-2">
                        ... and {testResult.labels.length - 10} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Messages Results */}
              {testResult.messages.messages.length > 0 && (
                <div>
                  <h4 className="text-md font-medium mb-2 text-gray-700">
                    Messages ({testResult.messages.messages.length})
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-md max-h-48 overflow-y-auto">
                    {testResult.messages.messages.map((message) => (
                      <div key={message.id} className="py-2 border-b border-gray-200 last:border-b-0">
                        <div className="text-sm font-medium text-gray-800 truncate">
                          {message.parsed_content.subject || 'No Subject'}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          From: {message.parsed_content.from.email}
                        </div>
                        <div className="text-xs text-gray-400">
                          {message.id}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <h4 className="text-sm font-medium text-blue-800 mb-2">
          Test Information
        </h4>
        <p className="text-sm text-blue-700">
          This test validates the complete end-to-end flow: 
          <br />
          <strong>Frontend</strong> → <strong>Tauri Commands</strong> → <strong>GmailApiService</strong> → <strong>RateLimiter</strong> → <strong>GmailAuthService</strong> → <strong>Gmail API</strong>
        </p>
      </div>
    </div>
  );
};

export default GmailTauriTestComponent; 
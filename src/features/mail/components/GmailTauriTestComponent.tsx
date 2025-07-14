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
    <div className="mx-auto max-w-4xl rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-4 text-2xl font-bold text-primary">
        Gmail Tauri Service Test
      </h2>
      
      <div className="mb-6">
        <div className="mb-4 flex items-center space-x-4">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-primary">
              Account ID
            </label>
            <input
              type="text"
              value={accountId}
              disabled
              className="border-border-default w-full rounded-md border bg-surface px-3 py-2 text-secondary"
            />
          </div>
          
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-primary">
              Test Type
            </label>
            <select
              value={selectedTest}
              onChange={(e) => setSelectedTest(e.target.value as 'labels' | 'messages' | 'full')}
              className="border-border-default w-full rounded-md border px-3 py-2"
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
            className={`rounded-md px-4 py-2 font-medium ${
              isLoading 
                                ? 'cursor-not-allowed bg-tertiary text-secondary'
                : 'bg-accent-primary text-white hover:bg-accent-secondary'
            }`}
          >
            {isLoading ? 'Running Test...' : 'Run Test'}
          </button>
          
          <button
            onClick={resetTest}
            disabled={isLoading}
                          className="rounded-md bg-surface px-4 py-2 font-medium text-primary hover:bg-tertiary"
          >
            Reset
          </button>
        </div>
      </div>

      {testResult && (
        <div className="border-t pt-6">
          <h3 className="mb-4 text-lg font-semibold text-primary">
            Test Results
          </h3>
          
          <div className={`mb-4 rounded-md p-4 ${
            testResult.success 
              ? 'border border-green-200 bg-green-50' 
              : 'border border-error bg-error-ghost'
          }`}>
            <div className="flex items-center space-x-2">
              <span className={`text-lg ${
                testResult.success ? 'text-green-600' : 'text-error'
              }`}>
                {testResult.success ? '✅' : '❌'}
              </span>
              <span className={`font-medium ${
                testResult.success ? 'text-green-800' : 'text-error'
              }`}>
                {testResult.success ? 'Test Passed' : 'Test Failed'}
              </span>
              {testResult.executionTime && (
                <span className="text-sm text-secondary">
                  ({testResult.executionTime}ms)
                </span>
              )}
            </div>
            
            {testResult.error && (
              <div className="mt-2 text-sm text-error">
                <strong>Error:</strong> {testResult.error}
              </div>
            )}
          </div>

          {testResult.success && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Labels Results */}
              {testResult.labels.length > 0 && (
                <div>
                  <h4 className="text-md mb-2 font-medium text-primary">
                    Labels ({testResult.labels.length})
                  </h4>
                  <div className="max-h-48 overflow-y-auto rounded-md bg-surface p-3">
                    {testResult.labels.slice(0, 10).map((label) => (
                      <div key={label.id} className="border-border-default flex items-center justify-between border-b py-1 last:border-b-0">
                        <span className="text-sm text-primary">{label.name}</span>
                        <span className="text-xs text-secondary">{label.id}</span>
                      </div>
                    ))}
                    {testResult.labels.length > 10 && (
                      <div className="mt-2 text-xs text-secondary">
                        ... and {testResult.labels.length - 10} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Messages Results */}
              {testResult.messages.messages.length > 0 && (
                <div>
                  <h4 className="text-md mb-2 font-medium text-primary">
                    Messages ({testResult.messages.messages.length})
                  </h4>
                  <div className="max-h-48 overflow-y-auto rounded-md bg-surface p-3">
                    {testResult.messages.messages.map((message) => (
                      <div key={message.id} className="border-border-default border-b py-2 last:border-b-0">
                        <div className="truncate text-sm font-medium text-primary">
                          {message.parsed_content.subject || 'No Subject'}
                        </div>
                        <div className="truncate text-xs text-secondary">
                          From: {message.parsed_content.from.email}
                        </div>
                        <div className="text-xs text-muted">
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
      
      <div className="mt-6 rounded-md bg-blue-50 p-4">
        <h4 className="mb-2 text-sm font-medium text-blue-800">
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
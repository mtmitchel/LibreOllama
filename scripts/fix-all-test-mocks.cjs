#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Complete mock implementation
const completeMockImplementation = `{
      getUserProfile: vi.fn().mockResolvedValue({ email: 'test@example.com', name: 'Test User', id: 'test-id' }),
      getLabels: vi.fn().mockResolvedValue([]),
      getMessages: vi.fn().mockResolvedValue({ messages: [], nextPageToken: undefined }),
      getMessage: vi.fn().mockResolvedValue(null),
      getThread: vi.fn().mockResolvedValue({ messages: [] }),
      markAsRead: vi.fn().mockResolvedValue(undefined),
      markAsUnread: vi.fn().mockResolvedValue(undefined),
      starMessages: vi.fn().mockResolvedValue(undefined),
      unstarMessages: vi.fn().mockResolvedValue(undefined),
      archiveMessages: vi.fn().mockResolvedValue(undefined),
      deleteMessages: vi.fn().mockResolvedValue(undefined),
      refreshAttempted: false,
      accountId: 'test-account'
    } as any`;

// Fix pattern for incomplete mocks
const fixMockPattern = (content) => {
  // Pattern 1: Replace incomplete mocks with complete implementation
  content = content.replace(
    /vi\.spyOn\(gmailApiService,\s*'getGmailApiService'\)\.mockReturnValue\(\{[^}]*\}\);/gs,
    `vi.spyOn(gmailApiService, 'getGmailApiService').mockReturnValue(${completeMockImplementation});`
  );
  
  // Pattern 2: Fix mockImplementation calls
  content = content.replace(
    /vi\.spyOn\(gmailApiService,\s*'getGmailApiService'\)\.mockImplementation\(\(\)\s*=>\s*\(\{[^}]*\}\)\);/gs,
    `vi.spyOn(gmailApiService, 'getGmailApiService').mockImplementation(() => (${completeMockImplementation}));`
  );
  
  // Pattern 3: Fix specific issues with accounts arrays
  content = content.replace(/accounts:\s*\[\],/g, 'accounts: {},');
  
  return content;
};

// Find all test files
const testFiles = [
  'src/tests/integration/gmail-complete-workflow.test.tsx',
  'src/tests/integration/gmail-ui-integration.test.tsx'
];

let fixedFiles = 0;

testFiles.forEach(filePath => {
  try {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;
      
      content = fixMockPattern(content);
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Fixed test mocks in ${filePath}`);
        fixedFiles++;
      } else {
        console.log(`ℹ️ No mock issues found in ${filePath}`);
      }
    }
  } catch (error) {
    console.error(`❌ Failed to fix ${filePath}:`, error.message);
  }
});

console.log(`\n📊 Summary: Fixed ${fixedFiles} test files`); 
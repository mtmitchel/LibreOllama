#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fix Gmail API service mocks
const filePath = 'src/tests/integration/gmail-complete-workflow.test.tsx';

try {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace incomplete mock with complete mock
  const oldMock = `vi.spyOn(gmailApiService, 'getGmailApiService').mockReturnValue({
    ...gmailApiService.getGmailApiService(),
    getMessages: vi.fn().mockResolvedValue({
      messages: messages,
      nextPageToken: undefined
    }),
    getLabels: vi.fn().mockResolvedValue(labels),
  });`;
  
  const newMock = `vi.spyOn(gmailApiService, 'getGmailApiService').mockReturnValue({
    getUserProfile: vi.fn().mockResolvedValue({ email: 'test@example.com', name: 'Test User', id: 'test-id' }),
    getLabels: vi.fn().mockResolvedValue(labels),
    getMessages: vi.fn().mockResolvedValue({
      messages: messages,
      nextPageToken: undefined
    }),
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
  } as any);`;
  
  content = content.replace(oldMock, newMock);
  
  fs.writeFileSync(filePath, content);
  console.log('✅ Fixed Gmail API service mocks in gmail-complete-workflow.test.tsx');
} catch (error) {
  console.error('❌ Failed to fix test mocks:', error);
} 
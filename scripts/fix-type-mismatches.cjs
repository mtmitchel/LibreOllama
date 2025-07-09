#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fix null vs undefined type mismatches
const filePath = 'src/features/mail/stores/mailStore.ts';

try {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace all instances of accountId: targetAccountId, with accountId: targetAccountId || undefined,
  content = content.replace(/accountId: targetAccountId,/g, 'accountId: targetAccountId || undefined,');
  
  // Also fix threadId assignments if any
  content = content.replace(/threadId: threadId,/g, 'threadId: threadId || undefined,');
  
  fs.writeFileSync(filePath, content);
  console.log('✅ Fixed type mismatches in mailStore.ts');
} catch (error) {
  console.error('❌ Failed to fix type mismatches:', error);
} 
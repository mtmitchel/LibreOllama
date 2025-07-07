# Gmail Integration Guide

**Complete guide for Gmail integration in LibreOllama with production-ready security and real API implementation.**

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Security Architecture](#security-architecture)
4. [Setup Instructions](#setup-instructions)
5. [API Integration](#api-integration)
6. [Migration Guide](#migration-guide)
7. [Troubleshooting](#troubleshooting)
8. [Production Checklist](#production-checklist)
9. [Best Practices](#best-practices)

## Overview

LibreOllama's Gmail integration provides secure, real-time access to Gmail accounts with enterprise-grade security features:

### ✅ **Current Status: Production Ready**

- **🔒 Enterprise Security**: OS keyring storage, PKCE OAuth, encrypted tokens
- **📨 Real Gmail API**: Live message fetching, real-time operations, automatic sync
- **🔄 Auto-Sync**: Background synchronization every 5 minutes
- **🛡️ Error Recovery**: Automatic token refresh, comprehensive error handling
- **📱 Multi-Account**: Support for multiple Gmail accounts simultaneously

### **Key Features**

| Feature | Status | Description |
|---------|--------|-------------|
| OAuth2 with PKCE | ✅ Implemented | Secure authentication flow |
| OS Keyring Storage | ✅ Implemented | Windows Credential Manager, macOS Keychain, Linux Secret Service |
| Real Gmail API | ✅ Implemented | Live message fetching and operations |
| Auto Token Refresh | ✅ Implemented | Automatic token renewal on expiry |
| Multi-Account Support | ✅ Implemented | Multiple Gmail accounts simultaneously |
| Background Sync | ✅ Implemented | Periodic sync every 5 minutes |
| Message Operations | ✅ Implemented | Read, star, archive, delete, label management |
| Security Migration | ✅ Implemented | Automatic migration from legacy storage |

## Quick Start

### **Prerequisites**
- Google Cloud Console account
- LibreOllama development environment

### **1. Environment Setup**

Create `.env` file in `src-tauri` directory:

```bash
# src-tauri/.env
GMAIL_CLIENT_ID=your_client_id_here
GMAIL_CLIENT_SECRET=your_client_secret_here
```

**⚠️ Security Note**: Never commit the `.env` file to version control!

### **2. Google Cloud Console Setup**

1. **Create/Select Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project or select existing

2. **Enable Gmail API**:
   - Navigate to "APIs & Services" > "Library"
   - Search "Gmail API" and click "Enable"

3. **Create OAuth Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Select "Desktop application"
   - Add authorized redirect URI: `http://localhost:8080/auth/gmail/callback`

4. **Configure OAuth Consent Screen**:
   - Set application name: "LibreOllama"
   - Add required scopes:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/gmail.modify`
     - `https://www.googleapis.com/auth/gmail.compose`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`

### **3. Build and Run**

```bash
# Install dependencies
cd src-tauri
cargo add keyring argon2 rand

# Run development build
npm run tauri:dev
```

### **4. First Authentication**

1. Open LibreOllama
2. Navigate to Mail section
3. Click "Add Account" or "Connect Gmail"
4. Complete OAuth flow in external browser
5. Verify messages load automatically

## Security Architecture

### **Security Model Overview**

LibreOllama implements a **zero-trust security model** for Gmail integration:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │   OS Keyring    │
│                 │    │                  │    │                 │
│ • No secrets    │◄──►│ • OAuth handler  │◄──►│ • Encrypted     │
│ • UI only       │    │ • Token refresh  │    │   tokens        │
│ • API calls     │    │ • Client secret  │    │ • Access keys   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### **Security Features**

#### **1. OS Keyring Integration**
- **Windows**: Windows Credential Manager
- **macOS**: Keychain Services
- **Linux**: Secret Service API (libsecret)

#### **2. OAuth2 with PKCE**
- **PKCE (Proof Key for Code Exchange)**: Prevents authorization code interception
- **Backend-Only Flow**: Client secret never exposed to frontend
- **CSRF Protection**: State parameter validation
- **Secure Redirect**: Localhost server with timeout protection

#### **3. Token Encryption**
```rust
// Example secure token storage
pub struct GmailTokenSecureStorage {
    user_id: String,
    keyring: SecretService,
}

impl GmailTokenSecureStorage {
    pub fn store_tokens(&self, tokens: &GmailTokens) -> Result<EncryptedTokens> {
        // Generate random nonce for AES-GCM
        let nonce = generate_random_nonce();
        
        // Encrypt using OS keyring-derived key
        let encrypted = self.encrypt_with_keyring(tokens, &nonce)?;
        
        Ok(EncryptedTokens {
            access_token_encrypted: encrypted.access_token,
            refresh_token_encrypted: encrypted.refresh_token,
            nonce: nonce.to_vec(),
        })
    }
}
```

#### **4. Database Security**
- **Encrypted Storage**: All tokens encrypted before database storage
- **Unique Nonces**: Random nonce per encryption operation
- **Schema Migration**: Automatic migration from legacy storage
- **Access Control**: User-specific token isolation

### **Security Audit Summary**

| Security Aspect | Previous System | Current System | Risk Level |
|-----------------|-----------------|----------------|------------|
| Encryption Key | Hard-coded | OS Keyring | **RESOLVED** |
| Nonce Generation | Fixed (zeros) | Random | **RESOLVED** |
| Client Secret | Frontend exposed | Backend only | **RESOLVED** |
| OAuth Flow | Vulnerable | PKCE + Backend | **RESOLVED** |
| Token Storage | SQLite only | OS Keyring + SQLite | **RESOLVED** |

## Setup Instructions

### **Development Environment**

#### **Required Dependencies**

```toml
# Cargo.toml additions
[dependencies]
keyring = "2.3"
argon2 = "0.5"
rand = "0.8"
oauth2 = "4.4"
reqwest = { version = "0.11", features = ["json"] }
tokio = { version = "1.0", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
chrono = { version = "0.4", features = ["serde"] }
uuid = { version = "1.0", features = ["v4"] }
```

#### **Environment Variables**

```bash
# Development (.env)
GMAIL_CLIENT_ID=715814737148-example.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-ExampleSecretKey
RUST_LOG=debug

# Production (set via deployment system)
GMAIL_CLIENT_ID=${GMAIL_CLIENT_ID}
GMAIL_CLIENT_SECRET=${GMAIL_CLIENT_SECRET}
RUST_LOG=info
```

### **Google Cloud Configuration**

#### **OAuth Consent Screen Setup**

1. **Application Information**:
   - Application name: "LibreOllama"
   - User support email: your-email@domain.com
   - Developer contact: your-email@domain.com

2. **Scopes Configuration**:
   ```
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/gmail.send  
   https://www.googleapis.com/auth/gmail.modify
   https://www.googleapis.com/auth/gmail.compose
   https://www.googleapis.com/auth/userinfo.email
   https://www.googleapis.com/auth/userinfo.profile
   ```

3. **Test Users** (for development):
   - Add your Gmail addresses for testing
   - Enable "Internal" for organization users

#### **API Quotas and Limits**

| Quota | Default Limit | Notes |
|-------|---------------|-------|
| Requests per day | 1,000,000,000 | Usually sufficient |
| Requests per 100 seconds | 250 | May need optimization |
| Requests per 100 seconds per user | 250 | Per authenticated user |

## API Integration

### **Gmail API Service Architecture**

The `GmailApiService` class provides a clean interface to Gmail APIs:

```typescript
export class GmailApiService {
  private static BASE_URL = 'https://www.googleapis.com/gmail/v1';
  
  constructor(private accountId: string) {}

  // Core methods
  async getMessages(labelIds: string[], maxResults: number): Promise<ParsedEmail[]>
  async getMessage(messageId: string): Promise<ParsedEmail>
  async getLabels(): Promise<GmailLabel[]>
  async markAsRead(messageIds: string[]): Promise<void>
  async starMessages(messageIds: string[]): Promise<void>
  async archiveMessages(messageIds: string[]): Promise<void>
  async deleteMessages(messageIds: string[]): Promise<void>
}
```

### **Message Operations**

#### **Fetching Messages**
```typescript
// Get inbox messages
const gmailApi = getGmailApiService(accountId);
const result = await gmailApi.getMessages(['INBOX'], 50);

// Search messages
const searchResult = await gmailApi.getMessages(['INBOX'], 50, undefined, 'from:example@gmail.com');

// Get specific message
const message = await gmailApi.getMessage('messageId');
```

#### **Message Operations**
```typescript
// Mark as read/unread
await gmailApi.markAsRead(['messageId1', 'messageId2']);
await gmailApi.markAsUnread(['messageId1']);

// Star/unstar
await gmailApi.starMessages(['messageId1']);
await gmailApi.unstarMessages(['messageId1']);

// Archive/delete
await gmailApi.archiveMessages(['messageId1']);
await gmailApi.deleteMessages(['messageId1']);
```

### **Data Synchronization**

#### **Real-time Sync System**
```typescript
// Automatic sync every 5 minutes
const { startPeriodicSync, stopPeriodicSync } = useMailStore();

// Start background sync
startPeriodicSync(5); // 5-minute intervals

// Manual sync all accounts
await syncAllAccounts();

// Sync specific account
await fetchMessages(undefined, undefined, undefined, accountId);
```

#### **Sync State Management**
```typescript
interface AccountData {
  messages: ParsedEmail[];
  labels: GmailLabel[];
  totalMessages: number;
  unreadMessages: number;
  lastSyncAt: Date;
  syncInProgress: boolean;
}
```

### **Error Handling and Recovery**

#### **Automatic Token Refresh**
```typescript
private async makeApiRequest<T>(endpoint: string): Promise<T> {
  try {
    const response = await fetch(url, { headers });
    
    if (response.status === 401) {
      // Auto-refresh tokens
      await this.refreshTokens();
      // Retry request with new token
      const retryResponse = await fetch(url, { headers: newHeaders });
      return retryResponse.json();
    }
    
    return response.json();
  } catch (error) {
    throw handleGmailError(error, { operation, accountId });
  }
}
```

#### **Comprehensive Error Types**
```typescript
enum GmailErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTH_ERROR = 'AUTH_ERROR', 
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  API_ERROR = 'API_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  RATE_LIMITED = 'RATE_LIMITED',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}
```

## Migration Guide

### **From Legacy Storage**

The system automatically detects and migrates legacy token storage:

#### **Migration Process**
1. **Detection**: Check for existing `gmail_accounts` table
2. **Backup**: Legacy tokens remain during migration
3. **Migration**: Create secure storage and migrate tokens
4. **Re-authentication**: Users re-authenticate for security
5. **Cleanup**: Legacy tokens marked for cleanup

#### **Manual Migration Commands**
```typescript
// Check migration status
const hasLegacy = await invoke('check_legacy_gmail_accounts');

// Create secure table
await invoke('create_secure_accounts_table');

// Run migration
const migrated = await invoke('migrate_tokens_to_secure_storage');
```

#### **Migration UI Flow**
```typescript
// Migration banner component
const MigrationBanner = () => {
  const [migrating, setMigrating] = useState(false);
  
  const handleMigration = async () => {
    setMigrating(true);
    try {
      await invoke('migrate_tokens_to_secure_storage');
      // Prompt user to re-authenticate
      await startGmailAuth();
    } catch (error) {
      console.error('Migration failed:', error);
    } finally {
      setMigrating(false);
    }
  };
  
  return (
    <Banner variant="warning">
      Security upgrade available - migrate to secure storage
      <Button onClick={handleMigration} loading={migrating}>
        Start Migration
      </Button>
    </Banner>
  );
};
```

### **Database Schema Changes**

#### **Legacy Schema**
```sql
CREATE TABLE gmail_accounts (
  id TEXT PRIMARY KEY,
  email_address TEXT NOT NULL,
  access_token_encrypted TEXT, -- Weakly encrypted
  refresh_token_encrypted TEXT, -- Weakly encrypted
  -- ... other fields
);
```

#### **Secure Schema**
```sql
CREATE TABLE gmail_accounts_secure (
  id TEXT PRIMARY KEY,
  email_address TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL, -- OS keyring encrypted
  refresh_token_encrypted TEXT,
  token_expires_at TEXT,
  scopes TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  user_id TEXT NOT NULL,
  requires_reauth BOOLEAN DEFAULT 0,
  UNIQUE(email_address, user_id)
);
```

## Troubleshooting

### **Common Issues**

#### **1. Authentication Failures**

**Error**: "Failed to initialize secure OAuth service"
```bash
❌ [BACKEND-WARNING] Failed to initialize secure OAuth service: GMAIL_CLIENT_ID not set
```

**Solutions**:
- Check `.env` file exists in `src-tauri` directory
- Verify environment variables are set correctly:
  ```bash
  echo $GMAIL_CLIENT_ID
  echo $GMAIL_CLIENT_SECRET
  ```
- Restart development server after adding variables

**Error**: "Invalid authentication state"
```bash
❌ [OAUTH-SERVER] CSRF token mismatch
```

**Solutions**:
- Clear browser cache and cookies
- Restart authentication flow
- Check system clock synchronization
- Verify redirect URI matches Google Cloud Console

#### **2. Token Storage Issues**

**Error**: "Failed to store tokens securely"
```bash
❌ [SECURITY] OS keyring not accessible
```

**Platform-specific solutions**:

**Windows**:
```bash
# Run as administrator if needed
# Check Windows Credential Manager access
```

**macOS**:
```bash
# Check Keychain Access permissions
# Verify application is trusted
```

**Linux**:
```bash
# Install required dependencies
sudo apt install libsecret-1-dev  # Ubuntu/Debian
sudo dnf install libsecret-devel  # Fedora/RHEL

# Ensure D-Bus is running
systemctl --user status dbus
```

#### **3. API Errors**

**Error**: "Gmail API rate limit exceeded"
```bash
❌ [API] Request failed: 429 Too Many Requests
```

**Solutions**:
- Implement exponential backoff (already built-in)
- Reduce sync frequency
- Optimize API calls
- Check Google Cloud Console quotas

**Error**: "Gmail API quota exceeded"
```bash
❌ [API] Daily quota exceeded
```

**Solutions**:
- Check Google Cloud Console quotas
- Request quota increase if needed
- Optimize sync strategies
- Implement caching

#### **4. Migration Issues**

**Error**: "Migration failed - table already exists"
```bash
❌ [MIGRATION] Table gmail_accounts_secure already exists
```

**Solutions**:
```sql
-- Check migration status
SELECT * FROM schema_version WHERE version = 6;

-- Reset migration if needed (CAREFUL!)
DELETE FROM schema_version WHERE version = 6;
DROP TABLE IF EXISTS gmail_accounts_secure;
```

### **Debug Mode**

Enable comprehensive debugging:

```typescript
// Frontend debugging
localStorage.setItem('gmail_debug', 'true');

// Backend debugging (Rust)
RUST_LOG=debug npm run tauri:dev

// SQL debugging
RUST_LOG=rusqlite=debug npm run tauri:dev
```

### **Performance Monitoring**

#### **Sync Performance**
```typescript
// Monitor sync timing
const startTime = performance.now();
await syncAllAccounts();
const duration = performance.now() - startTime;
console.log(`Sync completed in ${duration}ms`);
```

#### **Memory Usage**
```typescript
// Monitor memory usage
const memoryUsage = performance.memory;
console.log('Memory usage:', {
  used: memoryUsage.usedJSHeapSize / 1024 / 1024,
  total: memoryUsage.totalJSHeapSize / 1024 / 1024,
  limit: memoryUsage.jsHeapSizeLimit / 1024 / 1024
});
```

## Production Checklist

### **Pre-Deployment Security**

- [ ] **Environment Variables Secured**
  - [ ] Client secret in backend environment only
  - [ ] No secrets in frontend code
  - [ ] Environment variables properly configured

- [ ] **OAuth Configuration**
  - [ ] Redirect URI matches production domain
  - [ ] OAuth consent screen configured
  - [ ] Required scopes properly set
  - [ ] Test users configured for development

- [ ] **Token Security**
  - [ ] OS keyring integration working
  - [ ] Token encryption using random nonces
  - [ ] Automatic token refresh implemented
  - [ ] Migration from legacy storage tested

### **Functionality Testing**

- [ ] **Authentication Flow**
  - [ ] OAuth login works end-to-end
  - [ ] Token refresh automatic on expiry
  - [ ] Multi-account support functional
  - [ ] Logout clears tokens properly

- [ ] **Gmail Operations**
  - [ ] Message fetching works correctly
  - [ ] Read/unread operations sync with Gmail
  - [ ] Star/unstar operations work
  - [ ] Archive/delete operations work
  - [ ] Label management functional

- [ ] **Sync System**
  - [ ] Background sync working
  - [ ] Manual sync functional
  - [ ] Error recovery working
  - [ ] Performance acceptable

### **Performance Testing**

- [ ] **Load Testing**
  - [ ] Large inbox handling (1000+ messages)
  - [ ] Multiple account sync performance
  - [ ] Memory usage within limits
  - [ ] No memory leaks detected

- [ ] **Network Testing**
  - [ ] Offline handling graceful
  - [ ] Rate limit handling working
  - [ ] Timeout handling appropriate
  - [ ] Error recovery functional

### **Security Validation**

- [ ] **Code Security**
  - [ ] No hard-coded credentials
  - [ ] All SQL queries parameterized
  - [ ] Input validation comprehensive
  - [ ] Error messages don't leak secrets

- [ ] **Infrastructure Security**
  - [ ] HTTPS enforced
  - [ ] CORS properly configured
  - [ ] Content Security Policy set
  - [ ] Security headers configured

## Best Practices

### **Development Best Practices**

#### **1. Security-First Development**
```typescript
// ✅ DO: Use backend for sensitive operations
await invoke('refresh_gmail_token', { refreshToken });

// ❌ DON'T: Handle tokens in frontend
const clientSecret = 'secret_key'; // NEVER DO THIS
```

#### **2. Error Handling**
```typescript
// ✅ DO: Comprehensive error handling
try {
  await gmailApi.getMessages(['INBOX'], 50);
} catch (error) {
  const handledError = handleGmailError(error, {
    operation: 'fetch_messages',
    accountId: account.id,
  });
  setError(handledError.userMessage);
}

// ❌ DON'T: Generic error handling
try {
  await fetchMessages();
} catch (error) {
  console.error(error); // Loses context
}
```

#### **3. Performance Optimization**
```typescript
// ✅ DO: Batch operations
const messageIds = selectedMessages.map(msg => msg.id);
await gmailApi.markAsRead(messageIds);

// ❌ DON'T: Individual operations
for (const message of selectedMessages) {
  await gmailApi.markAsRead([message.id]); // Too many API calls
}
```

### **Production Best Practices**

#### **1. Monitoring and Alerting**
```typescript
// Implement comprehensive logging
console.log('📨 [STORE] Fetching messages for account:', accountId);
console.log('✅ [STORE] Successfully fetched', messages.length, 'messages');
console.error('❌ [STORE] Failed to fetch messages:', error);
```

#### **2. Rate Limiting**
```typescript
// Implement exponential backoff
class GmailApiService {
  private async makeApiRequest<T>(endpoint: string, retryCount = 0): Promise<T> {
    try {
      return await this.fetchWithAuth(endpoint);
    } catch (error) {
      if (error.status === 429 && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeApiRequest(endpoint, retryCount + 1);
      }
      throw error;
    }
  }
}
```

#### **3. Data Management**
```typescript
// Implement proper cleanup
useEffect(() => {
  const { startPeriodicSync, stopPeriodicSync } = useMailStore();
  
  startPeriodicSync(5);
  
  return () => {
    stopPeriodicSync(); // Cleanup on unmount
  };
}, []);
```

### **Security Best Practices**

#### **1. Token Management**
- Store tokens in OS keyring only
- Implement automatic token rotation
- Never log tokens or secrets
- Use minimal required scopes

#### **2. API Security**
- Validate all inputs before API calls
- Use parameterized database queries
- Implement request signing where applicable
- Add audit logging for security events

#### **3. Error Handling**
- Never expose internal errors to users
- Log security events appropriately
- Implement proper error recovery
- Use secure error reporting

---

## 📞 Support and Resources

### **Documentation Resources**
- [Gmail API Reference](https://developers.google.com/gmail/api/reference/rest)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [Tauri Security Guide](https://tauri.app/v1/guides/distribution/security)

### **Support Channels**
- Check logs for specific error messages
- Review troubleshooting section for common issues
- Verify environment setup and configuration
- Ensure all dependencies are properly installed

### **Common Support Information to Provide**
- Operating system and version
- Error messages (redacted of sensitive information)
- Steps to reproduce the issue
- Current configuration (without secrets)

---

**Last Updated**: January 1, 2025  
**Version**: 2.0.0 (Production Ready)  
**Status**: ✅ Complete Implementation with Real Gmail API Integration 
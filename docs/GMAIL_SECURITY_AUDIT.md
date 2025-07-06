# Gmail Integration Security Audit

## Executive Summary
This document outlines critical security vulnerabilities and recommendations for the Gmail integration in LibreOllama.

## Critical Security Vulnerabilities

### 1. Encryption Key Management (CRITICAL)
**Location**: `src-tauri/src/commands/token_storage.rs`

**Issue**: Hard-coded encryption key seed and fixed nonce
```rust
const ENCRYPTION_KEY_SEED: &str = "gmail_token_encryption_v1";
let nonce_bytes = [0u8; 12]; // Always zeros!
```

**Risk**: Anyone with source code access can decrypt all stored tokens

**Recommendation**:
- Use OS keyring (Windows Credential Manager, macOS Keychain, Linux Secret Service)
- Generate random nonce for each encryption operation
- Consider using `keyring` crate for cross-platform key storage

### 2. Client Secret Exposure (CRITICAL)
**Location**: `src/features/mail/hooks/useGmailAuth.ts`

**Issue**: OAuth client secret in frontend code
```typescript
client_secret: import.meta.env.VITE_GMAIL_CLIENT_SECRET || '',
```

**Risk**: Client secret exposed to all users, allowing impersonation

**Recommendation**:
- Move OAuth flow entirely to backend
- Use PKCE flow for public clients
- Store client secret only in backend environment

### 3. SQL Injection Potential (HIGH)
**Location**: Multiple database queries

**Issue**: Direct string interpolation in some queries

**Recommendation**:
- Always use parameterized queries
- Validate all user inputs
- Use prepared statements

## Performance & Reliability Issues

### 1. Missing Rate Limiting
- No protection against Gmail API rate limits
- No exponential backoff implementation
- Could lead to account suspension

### 2. Memory Management
- Loading entire attachments into memory
- No streaming for large files
- Could cause OOM errors

### 3. Error Recovery
- No automatic token refresh on 401 errors
- Missing retry logic for transient failures
- Poor error context preservation

## Recommended Implementation Plan

### Phase 1: Critical Security Fixes (Immediate)
1. Implement secure key storage using OS keyring
2. Move OAuth flow to backend
3. Fix encryption nonce generation
4. Audit and fix all SQL queries

### Phase 2: Core Functionality (1-2 weeks)
1. Complete Gmail API integration
2. Implement proper error handling
3. Add retry logic with exponential backoff
4. Implement pagination for messages

### Phase 3: Performance & UX (2-3 weeks)
1. Add streaming for attachments
2. Implement caching layer
3. Add offline support
4. Improve sync performance

### Phase 4: Advanced Features (3-4 weeks)
1. Push notifications via Pub/Sub
2. Advanced search capabilities
3. Email templates
4. Scheduled send

## Security Best Practices

1. **Token Storage**:
   - Use OS-provided secure storage
   - Encrypt at rest with unique keys per user
   - Implement token rotation

2. **API Security**:
   - Validate all inputs
   - Use least-privilege scopes
   - Implement request signing

3. **Data Protection**:
   - Encrypt sensitive data in transit and at rest
   - Implement data retention policies
   - Add audit logging

## Testing Requirements

1. **Security Testing**:
   - Penetration testing for OAuth flow
   - Token storage security audit
   - SQL injection testing

2. **Integration Testing**:
   - Test with various Gmail account types
   - Test rate limit handling
   - Test error recovery

3. **Performance Testing**:
   - Load test with large inboxes
   - Memory usage profiling
   - Concurrent user testing

## Compliance Considerations

1. **GDPR Compliance**:
   - Implement data deletion
   - Add consent management
   - Provide data export

2. **OAuth2 Best Practices**:
   - Follow RFC 6749
   - Implement PKCE (RFC 7636)
   - Use state parameter for CSRF protection

## Conclusion

The current implementation has several critical security vulnerabilities that must be addressed before production use. Following the recommended implementation plan will result in a secure, performant, and reliable Gmail integration. 
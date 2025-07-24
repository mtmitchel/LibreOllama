# Gmail Secure Integration Setup Guide

This guide walks you through setting up the secure Gmail integration in LibreOllama after the security fixes have been implemented.

## ✅ Status: Implementation Complete

**Security fixes have been successfully implemented and the project builds without errors!**

The critical security vulnerabilities have been resolved:
- ✅ OS Keyring storage implemented (Windows Credential Manager, macOS Keychain, Linux Secret Service)
- ✅ Random nonces for encryption operations
- ✅ Backend-only OAuth flow with PKCE protection
- ✅ Client secret removed from frontend code
- ✅ Secure token storage and retrieval system
- ✅ Comprehensive migration system for existing users

**Ready for production use after environment configuration.**

## ⚡ Quick Start

### 1. Environment Variables Setup

Create a `.env` file **only** in your `src-tauri` directory:

```bash
# src-tauri/.env
GMAIL_CLIENT_ID=your_oauth_client_id_here
GMAIL_CLIENT_SECRET=your_oauth_client_secret_here
```

**Important**: 
- Only the `src-tauri/.env` file is needed (not in the root directory)
- Never commit these credentials to version control!
- The frontend doesn't need these credentials as OAuth is handled by the secure backend

### 2. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Desktop application"
   - Set authorized redirect URI: `http://localhost:1423/auth/gmail/callback`

5. Copy the Client ID and Client Secret to your `.env` file

### 3. Migration from Legacy Storage

If you have existing Gmail accounts set up with the old system:

1. Open LibreOllama
2. Navigate to Mail settings
3. Look for the "Gmail Security Migration" banner
4. Click "Start Security Migration"
5. Re-authenticate your Gmail accounts when prompted

## 🔒 Security Features

### What's New and Secure

✅ **OS Keyring Storage**: Tokens are stored in your OS's secure keyring (Windows Credential Manager, macOS Keychain, Linux Secret Service)

✅ **Random Nonces**: Each encryption operation uses a cryptographically secure random nonce

✅ **Backend-Only OAuth**: Client secrets never leave the backend, preventing exposure

✅ **PKCE Protection**: Uses Proof Key for Code Exchange for additional security

✅ **Automatic Token Refresh**: Securely refreshes expired tokens in the background

### Security Comparison

| Feature | Old System | New Secure System |
|---------|------------|-------------------|
| Encryption Key | Hard-coded | OS Keyring |
| Nonce | Fixed (all zeros) | Random per operation |
| Client Secret | Frontend exposed | Backend only |
| OAuth Flow | Frontend vulnerable | PKCE + Backend |
| Token Storage | SQLite only | OS Keyring + SQLite |

## 🚀 Build Instructions

### Development Build

```bash
# Install required dependencies
cd src-tauri
cargo add keyring argon2

# Set environment variables
export GMAIL_CLIENT_ID="your_client_id"
export GMAIL_CLIENT_SECRET="your_client_secret"

# Build and run
npm run tauri dev
```

### Production Build

```bash
# Build the app
npm run tauri build

# Environment variables should be set at runtime
# or through your deployment system
```

## 🔧 Troubleshooting

### Common Issues

#### 1. "Failed to initialize secure OAuth service"

**Cause**: Environment variables not set properly

**Solution**:
```bash
# Check if variables are set
echo $GMAIL_CLIENT_ID
echo $GMAIL_CLIENT_SECRET

# Set them if missing
export GMAIL_CLIENT_ID="your_client_id"
export GMAIL_CLIENT_SECRET="your_client_secret"
```

#### 2. "Failed to store tokens securely"

**Cause**: OS keyring not accessible

**Solutions**:
- **Windows**: Run as administrator if keyring access is denied
- **macOS**: Check Keychain Access permissions
- **Linux**: Ensure `libsecret` is installed and D-Bus is running

#### 3. "Invalid authentication state"

**Cause**: CSRF token mismatch or expired session

**Solution**: 
- Clear browser cache
- Restart the authentication flow
- Check system clock is synchronized

#### 4. Keyring Dependencies Missing

**Linux**:
```bash
# Ubuntu/Debian
sudo apt install libsecret-1-dev

# Fedora/RHEL
sudo dnf install libsecret-devel
```

**Windows**: No additional dependencies needed

**macOS**: No additional dependencies needed

### Debug Mode

Enable debug logging in the console:

```javascript
// In browser console
localStorage.setItem('gmail_debug', 'true');
```

## 📊 Migration Guide

### From Vulnerable Storage

The migration process is automatic when you first run the secure version:

1. **Backup**: Old tokens remain in place until migration completes
2. **Migration**: Tokens are migrated to secure storage
3. **Re-authentication**: You'll need to sign in again for security
4. **Cleanup**: Old tokens are marked for cleanup (not immediately deleted)

### Manual Migration Commands

If automatic migration fails, you can run manual commands:

```javascript
// Check migration status
await invoke('check_legacy_gmail_accounts');

// Create secure table
await invoke('create_secure_accounts_table');

// Run migration
await invoke('migrate_tokens_to_secure_storage');
```

## 🧪 Testing the Implementation

### Verify Security Features

1. **Token Encryption**:
   - Tokens should not be readable in SQLite database
   - Check OS keyring for encryption keys

2. **OAuth Flow**:
   - Client secret should not appear in network requests
   - Browser should open secure OAuth URL

3. **Token Refresh**:
   - Should work automatically when tokens expire
   - New tokens should be stored securely

### Test Commands

```bash
# Test token storage
npm run test:tokens

# Test OAuth flow  
npm run test:oauth

# Test migration
npm run test:migration
```

## 📋 Production Checklist

### Before Deployment

- [ ] Environment variables set securely
- [ ] Client secret not in frontend code
- [ ] OAuth redirect URI configured correctly
- [ ] OS keyring accessible
- [ ] Migration tested with sample data
- [ ] Token refresh working
- [ ] Error handling tested

### Security Validation

- [ ] No hard-coded credentials
- [ ] Random nonces being used
- [ ] PKCE flow implemented
- [ ] Tokens encrypted in keyring
- [ ] Client secret backend-only

### Performance Testing

- [ ] OAuth flow responsive
- [ ] Token refresh automatic
- [ ] Migration completes quickly
- [ ] No memory leaks

## 🔗 Related Documentation

- [Gmail Security Audit](./GMAIL_SECURITY_AUDIT.md) - Detailed security analysis
- [Code Review Summary](./GMAIL_CODE_REVIEW_SUMMARY.md) - Implementation overview
- [OAuth 2.0 Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review console logs for specific errors
3. Ensure all dependencies are installed
4. Verify environment variables are set correctly

For additional help, refer to the main documentation or create an issue with:
- Your operating system
- Error messages (redacted of sensitive info)
- Steps to reproduce the issue 
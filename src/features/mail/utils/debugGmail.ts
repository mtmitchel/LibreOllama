/**
 * Debug utilities for Gmail integration
 */

import { invoke } from '@tauri-apps/api/core';
import { logger } from '../../../core/lib/logger';

/**
 * List all Gmail accounts in the database
 */
export async function debugListAllAccounts(): Promise<void> {
  try {
    const result = await invoke('debug_list_all_gmail_accounts');
    console.log('=== Gmail Accounts in Database ===');
    console.log(result);
    logger.info('[Debug] Gmail accounts:', result);
  } catch (error) {
    console.error('Failed to list Gmail accounts:', error);
    logger.error('[Debug] Failed to list accounts:', error);
  }
}

/**
 * Check Gmail secure table status
 */
export async function debugSecureTable(): Promise<void> {
  try {
    const result = await invoke('debug_gmail_secure_table');
    console.log('=== Gmail Secure Table Status ===');
    console.log(result);
    logger.info('[Debug] Secure table status:', result);
  } catch (error) {
    console.error('Failed to check secure table:', error);
    logger.error('[Debug] Failed to check secure table:', error);
  }
}

/**
 * Check token expiration status
 */
export async function debugTokenExpiration(): Promise<void> {
  try {
    const result = await invoke('debug_gmail_token_expiration');
    console.log('=== Gmail Token Expiration Status ===');
    console.log(result);
    logger.info('[Debug] Token expiration:', result);
  } catch (error) {
    console.error('Failed to check token expiration:', error);
    logger.error('[Debug] Failed to check token expiration:', error);
  }
}

/**
 * Migrate accounts to use default_user
 */
export async function migrateAccountsToDefaultUser(): Promise<void> {
  try {
    const result = await invoke('migrate_gmail_accounts_to_default_user');
    console.log('=== Gmail Account Migration ===');
    console.log(result);
    logger.info('[Debug] Migration result:', result);
  } catch (error) {
    console.error('Failed to migrate accounts:', error);
    logger.error('[Debug] Failed to migrate accounts:', error);
  }
}

/**
 * Clear all Gmail tokens to force re-authentication
 */
export async function clearAllTokens(): Promise<void> {
  try {
    const result = await invoke('clear_all_gmail_tokens');
    console.log('=== Gmail Token Clear ===');
    console.log(result);
    logger.info('[Debug] Token clear result:', result);
  } catch (error) {
    console.error('Failed to clear tokens:', error);
    logger.error('[Debug] Failed to clear tokens:', error);
  }
}

/**
 * Run all debug checks
 */
export async function runAllDebugChecks(): Promise<void> {
  console.log('Running Gmail debug checks...');
  await debugSecureTable();
  await debugListAllAccounts();
  await debugTokenExpiration();
  console.log('Debug checks complete. Check console for results.');
}

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).gmailDebug = {
    listAccounts: debugListAllAccounts,
    checkTable: debugSecureTable,
    checkTokens: debugTokenExpiration,
    migrate: migrateAccountsToDefaultUser,
    clearTokens: clearAllTokens,
    runAll: runAllDebugChecks,
  };
  
  console.log('Gmail debug utilities loaded. Available commands:');
  console.log('- gmailDebug.listAccounts() - List all accounts in database');
  console.log('- gmailDebug.checkTable() - Check secure table status');
  console.log('- gmailDebug.checkTokens() - Check token expiration');
  console.log('- gmailDebug.migrate() - Migrate accounts to use default_user');
  console.log('- gmailDebug.clearTokens() - Clear all tokens to force re-authentication');
  console.log('- gmailDebug.runAll() - Run all debug checks');
}
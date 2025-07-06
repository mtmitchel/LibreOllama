import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Button, Text } from '../../../components/ui';
import { Shield, AlertTriangle, CheckCircle, Clock, Key } from 'lucide-react';

interface MigrationStatus {
  hasMigrationNeeded: boolean;
  migratedCount: number;
  isLoading: boolean;
  error: string | null;
  isCompleted: boolean;
}

export function GmailSecurityMigration() {
  const [status, setStatus] = useState<MigrationStatus>({
    hasMigrationNeeded: false,
    migratedCount: 0,
    isLoading: true,
    error: null,
    isCompleted: false,
  });

  // Check if migration is needed
  useEffect(() => {
    checkMigrationStatus();
  }, []);

  const checkMigrationStatus = async () => {
    try {
      setStatus(prev => ({ ...prev, isLoading: true, error: null }));

      // Check if old table exists and has accounts
      const hasOldAccounts = await invoke<boolean>('check_legacy_gmail_accounts');
      
      // Check if new secure table exists
      const hasSecureTable = await invoke<boolean>('check_secure_accounts_table');

      setStatus(prev => ({
        ...prev,
        hasMigrationNeeded: hasOldAccounts && !hasSecureTable,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to check migration status:', error);
      setStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to check migration status',
        isLoading: false,
      }));
    }
  };

  const runMigration = async () => {
    try {
      setStatus(prev => ({ ...prev, isLoading: true, error: null }));

      // Create secure accounts table
      await invoke('create_secure_accounts_table');

      // Run migration
      const migratedCount = await invoke<number>('migrate_tokens_to_secure_storage');

      setStatus(prev => ({
        ...prev,
        migratedCount,
        isCompleted: true,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Migration failed:', error);
      setStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Migration failed',
        isLoading: false,
      }));
    }
  };

  if (status.isLoading && !status.hasMigrationNeeded) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="text-blue-500" size={24} />
          <Text size="lg" weight="semibold" className="text-gray-900">
            Checking Gmail Security Status
          </Text>
        </div>
        <Text className="text-gray-600">
          Checking if security migration is needed...
        </Text>
      </div>
    );
  }

  if (!status.hasMigrationNeeded && !status.isCompleted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="text-green-500" size={24} />
          <Text size="lg" weight="semibold" className="text-green-900">
            Gmail Security: Up to Date
          </Text>
        </div>
        <Text className="text-green-700">
          Your Gmail tokens are already using secure storage with OS keyring encryption.
        </Text>
      </div>
    );
  }

  if (status.isCompleted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="text-green-500" size={24} />
          <Text size="lg" weight="semibold" className="text-green-900">
            Migration Completed Successfully
          </Text>
        </div>
        <Text className="text-green-700 mb-4">
          {status.migratedCount > 0 
            ? `Successfully migrated ${status.migratedCount} Gmail account(s) to secure storage.`
            : 'No accounts needed migration.'
          }
        </Text>
        {status.migratedCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <Text size="sm" className="text-yellow-800">
              <strong>Important:</strong> Due to security improvements, you'll need to re-authenticate 
              your Gmail accounts. This ensures your tokens are encrypted with the highest security standards.
            </Text>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="text-yellow-500" size={24} />
        <Text size="lg" weight="semibold" className="text-yellow-900">
          Gmail Security Upgrade Required
        </Text>
      </div>

      <div className="space-y-4">
        <Text className="text-yellow-800">
          We've detected Gmail accounts using an older, less secure token storage method. 
          For your security, we recommend migrating to our new secure storage system.
        </Text>

        <div className="bg-white border border-yellow-200 rounded-md p-4">
          <Text size="sm" weight="semibold" className="text-gray-900 mb-2">
            What will happen during migration:
          </Text>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>• Your Gmail tokens will be moved to OS-level secure storage</li>
            <li>• Tokens will be encrypted using hardware-backed security</li>
            <li>• You'll need to re-authenticate your Gmail accounts</li>
            <li>• Your email data and settings will remain unchanged</li>
          </ul>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-start gap-2">
            <Shield className="text-red-500 mt-0.5" size={16} />
            <div>
              <Text size="sm" weight="semibold" className="text-red-900">
                Security Notice
              </Text>
              <Text size="sm" className="text-red-800">
                Your current token storage has security vulnerabilities. 
                Migration is strongly recommended to protect your Gmail access.
              </Text>
            </div>
          </div>
        </div>

        {status.error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <Text size="sm" className="text-red-800">
              <strong>Error:</strong> {status.error}
            </Text>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={runMigration}
            disabled={status.isLoading}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            <Key size={16} className="mr-2" />
            {status.isLoading ? 'Migrating...' : 'Start Security Migration'}
          </Button>
          
          <Button
            variant="outline"
            onClick={checkMigrationStatus}
            disabled={status.isLoading}
          >
            Refresh Status
          </Button>
        </div>
      </div>
    </div>
  );
} 
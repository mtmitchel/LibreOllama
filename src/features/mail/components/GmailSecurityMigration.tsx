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
      <div className="border-border-default rounded-lg border bg-surface p-6">
        <div className="mb-4 flex items-center gap-3">
          <Clock className="text-accent-primary" size={24} />
          <Text size="lg" weight="semibold" className="text-primary">
            Checking Gmail Security Status
          </Text>
        </div>
        <Text className="text-secondary">
          Checking if security migration is needed...
        </Text>
      </div>
    );
  }

  if (!status.hasMigrationNeeded && !status.isCompleted) {
    return (
      <div className="rounded-lg border border-success bg-success-ghost p-6">
        <CheckCircle className="text-success" size={24} />
        <Text size="lg" weight="semibold" className="text-success">
          Secure connection established
        </Text>
        <Text className="text-success">
          Your Gmail account is now securely connected to LibreOllama.
        </Text>
      </div>
    );
  }

  if (status.isCompleted) {
    return (
      <div className="rounded-lg border border-success bg-success-ghost p-6">
        <CheckCircle className="text-success" size={24} />
        <Text size="lg" weight="semibold" className="text-success">
          Security upgrade complete
        </Text>
        <Text className="mb-4 text-success">
          Your Gmail integration is now using the latest security protocols.
        </Text>
        <Text className="text-success">
          Your Gmail tokens are already using secure storage with OS keyring encryption.
        </Text>
      </div>
    );
  }

  return (
    <div className="bg-warning-bg rounded-lg border border-warning p-6">
      <div className="mb-4 flex items-center gap-3">
        <AlertTriangle className="text-warning" size={24} />
        <Text size="lg" weight="semibold" className="text-warning-fg">
          Gmail Security Upgrade Required
        </Text>
      </div>

      <div className="space-y-4">
        <Text className="text-warning-fg">
          We've detected Gmail accounts using an older, less secure token storage method. 
          For your security, we recommend migrating to our new secure storage system.
        </Text>

        <div className="rounded-md border border-warning bg-white p-4">
          <Text size="sm" weight="semibold" className="mb-2 text-primary">
            What will happen during migration:
          </Text>
          <ul className="space-y-1 text-sm text-primary">
            <li>• Your Gmail tokens will be moved to OS-level secure storage</li>
            <li>• Tokens will be encrypted using hardware-backed security</li>
            <li>• You'll need to re-authenticate your Gmail accounts</li>
            <li>• Your email data and settings will remain unchanged</li>
          </ul>
        </div>

        <div className="rounded-md border border-error bg-error-ghost p-4">
          <div className="flex items-start gap-2">
            <Shield className="mt-0.5 text-error" size={16} />
            <div>
              <Text size="sm" weight="semibold" className="text-error">
                Security Notice
              </Text>
              <Text size="sm" className="text-error">
                Your current token storage has security vulnerabilities. 
                Migration is strongly recommended to protect your Gmail access.
              </Text>
            </div>
          </div>
        </div>

        {status.error && (
          <div className="rounded-md border border-error bg-error-ghost p-4">
            <Text size="sm" className="text-error">
              <strong>Error:</strong> {status.error}
            </Text>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={runMigration}
            disabled={status.isLoading}
            className="bg-warning text-white hover:bg-warning"
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
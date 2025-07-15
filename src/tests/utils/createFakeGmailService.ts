import type { GmailTauriService } from 'src/features/mail/services/gmailTauriService';
import { vi } from 'vitest';

export const createFakeGmailService = (
  mockAccountId: string = 'test-account-id',
  extra: Partial<GmailTauriService> = {},
): GmailTauriService =>
  ({
    // mandatory fields --------------------------------------------------
    accountId: mockAccountId, // Use the passed mockAccountId
    // private method can be no-op
    modifyMessages: () => Promise.resolve(),
    // public API --------------------------------------------------------
    getUserProfile: vi.fn(),
    getLabels: vi.fn(),
    searchMessages: vi.fn(),
    getMessage: vi.fn(),
    getThread: vi.fn(),
    markAsRead: vi.fn(),
    markAsUnread: vi.fn(),
    starMessages: vi.fn(),
    unstarMessages: vi.fn(),
    archiveMessages: vi.fn(),
    deleteMessages: vi.fn(),
    getThreadById: vi.fn(),
    getEmailContent: vi.fn(),
    getEmailHeaders: vi.fn(),
    getAttachment: vi.fn(),
    testEndToEndFlow: vi.fn(),
    getParsedMessage: vi.fn(),
    // compose/draft helpers
    sendGmailMessage: vi.fn(),
    saveDraft: vi.fn(),
    downloadAttachment: vi.fn(),
    // merge in any per-test overrides -------------------
    ...extra,
  } as unknown as GmailTauriService); 
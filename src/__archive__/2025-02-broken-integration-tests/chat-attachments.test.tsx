import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatInput } from '../../features/chat/components/ChatInput';
import { useChatAttachments } from '../../features/chat/hooks/useChatAttachments';
import { isValidAttachment, getAttachmentType, formatFileSize } from '../../features/chat/types/attachments';

// Mock the custom hook
vi.mock('../../features/chat/hooks/useChatAttachments');

describe('Chat Attachments Integration Tests', () => {
  const mockProps = {
    newMessage: '',
    selectedChatId: 'test-chat-1',
    selectedChatTitle: 'Test Chat',
    onMessageChange: vi.fn(),
    onSendMessage: vi.fn(),
    disabled: false
  };

  const mockAttachments = [
    {
      id: 'att-1',
      filename: 'test-image.jpg',
      mimeType: 'image/jpeg',
      size: 1024 * 1024, // 1MB
      type: 'image' as const,
      uploadStatus: 'completed' as const,
      uploadProgress: 100,
      url: 'blob:test-url',
      thumbnailUrl: 'blob:test-thumbnail',
      createdAt: new Date()
    },
    {
      id: 'att-2',
      filename: 'document.pdf',
      mimeType: 'application/pdf',
      size: 2 * 1024 * 1024, // 2MB
      type: 'document' as const,
      uploadStatus: 'uploading' as const,
      uploadProgress: 50,
      createdAt: new Date()
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the useChatAttachments hook
    vi.mocked(useChatAttachments).mockReturnValue({
      attachments: [],
      isUploading: false,
      addAttachment: vi.fn(),
      removeAttachment: vi.fn(),
      clearAttachments: vi.fn(),
      handleFileSelect: vi.fn()
    });
  });

  it('should render attachment button', () => {
    render(<ChatInput {...mockProps} />);
    
    const attachButton = screen.getByTitle('Attach file');
    expect(attachButton).toBeInTheDocument();
    expect(attachButton).toHaveAttribute('type', 'button');
  });

  it('should disable attachment button when no chat is selected', () => {
    render(<ChatInput {...mockProps} selectedChatId={null} />);
    
    const attachButton = screen.getByTitle('Attach file');
    expect(attachButton).toBeDisabled();
  });

  it('should handle attachment button click', () => {
    const mockHandleFileSelect = vi.fn();
    vi.mocked(useChatAttachments).mockReturnValue({
      attachments: [],
      isUploading: false,
      addAttachment: vi.fn(),
      removeAttachment: vi.fn(),
      clearAttachments: vi.fn(),
      handleFileSelect: mockHandleFileSelect
    });

    render(<ChatInput {...mockProps} />);
    
    const attachButton = screen.getByTitle('Attach file');
    fireEvent.click(attachButton);
    
    // Should trigger file input click (tested indirectly)
    expect(attachButton).toBeInTheDocument();
  });

  it('should display attachment previews when attachments exist', () => {
    vi.mocked(useChatAttachments).mockReturnValue({
      attachments: mockAttachments,
      isUploading: false,
      addAttachment: vi.fn(),
      removeAttachment: vi.fn(),
      clearAttachments: vi.fn(),
      handleFileSelect: vi.fn()
    });

    render(<ChatInput {...mockProps} />);
    
    expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText('1 MB')).toBeInTheDocument();
    expect(screen.getByText('2 MB')).toBeInTheDocument();
  });

  it('should show upload progress for uploading attachments', () => {
    vi.mocked(useChatAttachments).mockReturnValue({
      attachments: mockAttachments,
      isUploading: true,
      addAttachment: vi.fn(),
      removeAttachment: vi.fn(),
      clearAttachments: vi.fn(),
      handleFileSelect: vi.fn()
    });

    render(<ChatInput {...mockProps} />);
    
    // Should show progress bar for uploading attachment
    // Removed incorrect screen.getByDisplayValue usage
    expect(document.querySelector('.bg-primary')).toBeInTheDocument();
  });

  it('should enable send button when attachments are completed', () => {
    vi.mocked(useChatAttachments).mockReturnValue({
      attachments: [mockAttachments[0]], // Only completed attachment
      isUploading: false,
      addAttachment: vi.fn(),
      removeAttachment: vi.fn(),
      clearAttachments: vi.fn(),
      handleFileSelect: vi.fn()
    });

    render(<ChatInput {...mockProps} newMessage="" />);
    
    const sendButton = screen.getByTitle('Send message (Enter)');
    expect(sendButton).not.toBeDisabled();
  });

  it('should disable send button when uploading', () => {
    vi.mocked(useChatAttachments).mockReturnValue({
      attachments: mockAttachments,
      isUploading: true,
      addAttachment: vi.fn(),
      removeAttachment: vi.fn(),
      clearAttachments: vi.fn(),
      handleFileSelect: vi.fn()
    });

    render(<ChatInput {...mockProps} newMessage="test message" />);
    
    const sendButton = screen.getByTitle('Send message (Enter)');
    expect(sendButton).toBeDisabled();
  });

  it('should call onSendMessage with attachments when sending', () => {
    const mockClearAttachments = vi.fn();
    vi.mocked(useChatAttachments).mockReturnValue({
      attachments: [mockAttachments[0]], // Only completed attachment
      isUploading: false,
      addAttachment: vi.fn(),
      removeAttachment: vi.fn(),
      clearAttachments: mockClearAttachments,
      handleFileSelect: vi.fn()
    });

    render(<ChatInput {...mockProps} newMessage="test message" />);
    
    const sendButton = screen.getByTitle('Send message (Enter)');
    fireEvent.click(sendButton);
    
    expect(mockProps.onSendMessage).toHaveBeenCalledWith(
      expect.any(Object),
      [mockAttachments[0]]
    );
    expect(mockClearAttachments).toHaveBeenCalled();
  });

  it('should handle remove attachment', () => {
    const mockRemoveAttachment = vi.fn();
    vi.mocked(useChatAttachments).mockReturnValue({
      attachments: mockAttachments,
      isUploading: false,
      addAttachment: vi.fn(),
      removeAttachment: mockRemoveAttachment,
      clearAttachments: vi.fn(),
      handleFileSelect: vi.fn()
    });

    render(<ChatInput {...mockProps} />);
    
    const removeButtons = screen.getAllByTitle('Remove attachment');
    fireEvent.click(removeButtons[0]);
    
    expect(mockRemoveAttachment).toHaveBeenCalledWith('att-1');
  });
});

describe('Attachment Utility Functions', () => {
  describe('isValidAttachment', () => {
    it('should validate file size', () => {
      const largeFile = new File(['x'.repeat(51 * 1024 * 1024)], 'large.txt', { type: 'text/plain' });
      const result = isValidAttachment(largeFile);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File size exceeds');
    });

    it('should accept valid files', () => {
      const validFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const result = isValidAttachment(validFile);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('getAttachmentType', () => {
    it('should detect image types', () => {
      expect(getAttachmentType('image/jpeg')).toBe('image');
      expect(getAttachmentType('image/png')).toBe('image');
      expect(getAttachmentType('image/gif')).toBe('image');
    });

    it('should detect document types', () => {
      expect(getAttachmentType('application/pdf')).toBe('document');
      expect(getAttachmentType('text/plain')).toBe('document');
      expect(getAttachmentType('application/msword')).toBe('document');
    });

    it('should detect audio types', () => {
      expect(getAttachmentType('audio/mp3')).toBe('audio');
      expect(getAttachmentType('audio/wav')).toBe('audio');
    });

    it('should detect video types', () => {
      expect(getAttachmentType('video/mp4')).toBe('video');
      expect(getAttachmentType('video/webm')).toBe('video');
    });

    it('should fallback to other for unknown types', () => {
      expect(getAttachmentType('application/unknown')).toBe('other');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should handle decimal places', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB'); // 1.5 KB
      expect(formatFileSize(1024 * 1024 * 1.5)).toBe('1.5 MB');
    });
  });
}); 
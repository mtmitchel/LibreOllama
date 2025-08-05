import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConversationContextMenu } from '../../features/chat/components/ConversationContextMenu';
import { ChatConversation } from '../../core/lib/chatMockData';

// Mock conversation data
const mockConversation: ChatConversation = {
  id: 'test-conversation-1',
  title: 'Test Conversation',
  lastMessage: 'Hello, how are you?',
  timestamp: '2024-01-15T12:00:00Z',
  isPinned: false,
  participants: 1
};

describe('Conversation Context Menu Integration Tests', () => {
  const mockProps = {
    conversation: mockConversation,
    isOpen: true,
    position: { x: 100, y: 100 },
    onClose: vi.fn(),
    onAction: vi.fn(),
    onRename: vi.fn(),
    onPin: vi.fn(),
    onUnpin: vi.fn(),
    onDelete: vi.fn(),
    onArchive: vi.fn(),
    onExport: vi.fn(),
    onShare: vi.fn(),
    onCopyLink: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    });
  });

  it('should render context menu when open', () => {
    render(<ConversationContextMenu {...mockProps} />);
    
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('Pin conversation')).toBeInTheDocument();
    expect(screen.getByText('Rename conversation')).toBeInTheDocument();
    expect(screen.getByText('Export conversation')).toBeInTheDocument();
    expect(screen.getByText('Delete conversation')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<ConversationContextMenu {...mockProps} isOpen={false} />);
    
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('should show correct pin/unpin action based on conversation state', () => {
    // Test unpinned conversation
    render(<ConversationContextMenu {...mockProps} />);
    expect(screen.getByText('Pin conversation')).toBeInTheDocument();
    
    // Test pinned conversation
    const pinnedConversation = { ...mockConversation, isPinned: true };
    render(<ConversationContextMenu {...mockProps} conversation={pinnedConversation} />);
    expect(screen.getByText('Unpin conversation')).toBeInTheDocument();
  });

  it('should call onPin when pin action is clicked', () => {
    render(<ConversationContextMenu {...mockProps} />);
    
    fireEvent.click(screen.getByText('Pin conversation'));
    
    expect(mockProps.onPin).toHaveBeenCalledWith('test-conversation-1');
    expect(mockProps.onAction).toHaveBeenCalledWith('pin_toggle', 'test-conversation-1');
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('should call onUnpin when unpin action is clicked for pinned conversation', () => {
    const pinnedConversation = { ...mockConversation, isPinned: true };
    render(<ConversationContextMenu {...mockProps} conversation={pinnedConversation} />);
    
    fireEvent.click(screen.getByText('Unpin conversation'));
    
    expect(mockProps.onUnpin).toHaveBeenCalledWith('test-conversation-1');
    expect(mockProps.onAction).toHaveBeenCalledWith('pin_toggle', 'test-conversation-1');
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('should call onRename when rename action is clicked', () => {
    render(<ConversationContextMenu {...mockProps} />);
    
    fireEvent.click(screen.getByText('Rename conversation'));
    
    expect(mockProps.onRename).toHaveBeenCalledWith('test-conversation-1');
    expect(mockProps.onAction).toHaveBeenCalledWith('rename', 'test-conversation-1');
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('should call onExport when export action is clicked', () => {
    render(<ConversationContextMenu {...mockProps} />);
    
    fireEvent.click(screen.getByText('Export conversation'));
    
    expect(mockProps.onExport).toHaveBeenCalledWith('test-conversation-1');
    expect(mockProps.onAction).toHaveBeenCalledWith('export', 'test-conversation-1');
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('should handle copy link action and use clipboard API', async () => {
    render(<ConversationContextMenu {...mockProps} />);
    
    fireEvent.click(screen.getByText('Copy conversation link'));
    
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        `${window.location.origin}/chat/test-conversation-1`
      );
    });
    
    expect(mockProps.onCopyLink).toHaveBeenCalledWith('test-conversation-1');
    expect(mockProps.onAction).toHaveBeenCalledWith('copy_link', 'test-conversation-1');
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('should show delete confirmation modal when delete is clicked', () => {
    render(<ConversationContextMenu {...mockProps} />);
    
    // Look for delete option more flexibly
    const deleteButton = screen.getByRole('menuitem', { name: /delete conversation/i });
    fireEvent.click(deleteButton);
    
    expect(screen.getByRole('heading', { name: 'Delete conversation' })).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Are you sure you want to delete "Test Conversation"? This will permanently remove the conversation and all its messages.';
    })).toBeInTheDocument();
  });

  it('should cancel delete when cancel button is clicked', () => {
    render(<ConversationContextMenu {...mockProps} />);
    
    // Open delete confirmation
    const deleteButton = screen.getByRole('menuitem', { name: /delete conversation/i });
    fireEvent.click(deleteButton);
    
    // Click cancel
    fireEvent.click(screen.getByText('Cancel'));
    
    // Modal should be closed
    expect(screen.queryByRole('heading', { name: 'Delete conversation' })).not.toBeInTheDocument();
    expect(mockProps.onDelete).not.toHaveBeenCalled();
  });

  it('should execute delete when confirmed', () => {
    render(<ConversationContextMenu {...mockProps} />);
    
    // Open delete confirmation
    const deleteButton = screen.getByRole('menuitem', { name: /delete conversation/i });
    fireEvent.click(deleteButton);
    
    // Confirm delete
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    
    expect(mockProps.onDelete).toHaveBeenCalledWith('test-conversation-1');
    expect(mockProps.onAction).toHaveBeenCalledWith('delete', 'test-conversation-1');
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('should close menu when clicking outside', () => {
    render(<ConversationContextMenu {...mockProps} />);
    
    // Click outside the menu
    fireEvent.mouseDown(document.body);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('should close menu when pressing Escape', () => {
    render(<ConversationContextMenu {...mockProps} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('should position menu correctly within viewport', () => {
    const { container } = render(<ConversationContextMenu {...mockProps} />);
    
    const menu = container.querySelector('[role="menu"]');
    expect(menu).toHaveStyle({
      left: '100px',
      top: '100px'
    });
  });

  it('should show keyboard shortcuts in menu items', () => {
    render(<ConversationContextMenu {...mockProps} />);
    
    expect(screen.getByText('Ctrl+P')).toBeInTheDocument(); // Pin shortcut
    expect(screen.getByText('F2')).toBeInTheDocument(); // Rename shortcut
    expect(screen.getByText('Delete')).toBeInTheDocument(); // Delete shortcut
  });
}); 
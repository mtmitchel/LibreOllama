/**
 * Notes Rendering Tests
 * Basic tests to ensure notes components render without errors after bug fixes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { NotesPage } from '../components/NotesPage';
import { Sidebar } from '../components/Sidebar';
import BlockNoteEditor from '../components/BlockNoteEditor';
import { TestWrapper } from './test-utils';
import { useNotesStore } from '../store';
import * as notesService from '../services/notesService';

vi.mock('../services/notesService', () => ({
  notesService: {
    getFolders: vi.fn(),
    getNotes: vi.fn(),
    updateNote: vi.fn(),
    deleteNote: vi.fn(),
    createNote: vi.fn(),
    createFolder: vi.fn(),
    updateFolder: vi.fn(),
    deleteFolder: vi.fn(),
  }
}));

const mockedNotesService = vi.mocked(notesService.notesService);

describe('Notes Components Rendering', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Provide default mock implementations that return empty arrays
    mockedNotesService.getFolders.mockResolvedValue([]);
    mockedNotesService.getNotes.mockResolvedValue([]);
    mockedNotesService.updateNote.mockResolvedValue({} as any);
    mockedNotesService.deleteNote.mockResolvedValue(undefined);
  });

  it('should render NotesPage without crashing', () => {
    render(<NotesPage />, { wrapper: TestWrapper });
    
    // Verify basic elements are present
    expect(screen.getByText('Notes')).toBeInTheDocument();
  });

  it('should render BlockNoteEditor without crashing', () => {
    const mockOnChange = vi.fn();
    
    render(
      <BlockNoteEditor 
        content="<p>Test content</p>" 
        onChange={mockOnChange} 
      />,
      { wrapper: TestWrapper }
    );
    
    // Verify the editor container renders
    expect(document.querySelector('[contenteditable="true"]')).toBeInTheDocument();
  });

  it('should render Sidebar without crashing', () => {
    const mockOnSelectNote = vi.fn();
    const mockOnCreateNote = vi.fn();
    
    render(
      <Sidebar 
        onSelectNote={mockOnSelectNote}
        onCreateNote={mockOnCreateNote}
      />,
      { wrapper: TestWrapper }
    );
    
    // Verify basic sidebar elements are present
    expect(screen.getByTitle('Create new folder')).toBeInTheDocument();
    expect(screen.getByTitle('Create new note')).toBeInTheDocument();
  });

  it('should handle empty store state gracefully', () => {
    // Ensure store starts empty
    useNotesStore.setState({
      notes: [],
      folders: [],
      selectedNoteId: null,
      selectedFolderId: null,
      isLoading: false,
      error: null,
      isMigrated: true
    });

    render(<NotesPage />, { wrapper: TestWrapper });
    
    // Should render without errors even with empty state
    expect(screen.getByText('Notes')).toBeInTheDocument();
  });

  it('should not break with different content types in BlockNoteEditor', () => {
    const mockOnChange = vi.fn();
    
    // Test with empty content
    const { rerender } = render(
      <BlockNoteEditor 
        content="" 
        onChange={mockOnChange} 
      />,
      { wrapper: TestWrapper }
    );
    
    expect(document.querySelector('[contenteditable="true"]')).toBeInTheDocument();
    
    // Test with HTML content
    rerender(
      <BlockNoteEditor 
        content="<h1>Title</h1><p>Content</p>" 
        onChange={mockOnChange} 
      />
    );
    
    expect(document.querySelector('[contenteditable="true"]')).toBeInTheDocument();
    
    // Test with JSON content
    const jsonContent = JSON.stringify([
      { type: 'heading', props: { level: 1 }, content: 'Title' },
      { type: 'paragraph', content: 'Content' }
    ]);
    
    rerender(
      <BlockNoteEditor 
        content={jsonContent} 
        onChange={mockOnChange} 
      />
    );
    
    expect(document.querySelector('[contenteditable="true"]')).toBeInTheDocument();
  });
});
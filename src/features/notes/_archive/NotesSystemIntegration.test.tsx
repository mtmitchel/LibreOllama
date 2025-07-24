/**
 * Notes System Integration Tests
 *
 * Mocks the backend API layer to test the full frontend stack:
 * Zustand Store <-> Service Layer <-> UI Components
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { NotesPage } from '../components/NotesPage';
import { useNotesStore } from '../store';
import { TestWrapper } from '../tests/test-utils';
import * as notesService from '../services/notesService';
import { Note, Folder } from '../types';

vi.mock('@tauri-apps/plugin-dialog', () => ({
  save: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-fs', () => ({
  writeTextFile: vi.fn(),
  writeFile: vi.fn(),
}));

// Mock the entire notesService
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

// Initial mock data
const mockFolders: Folder[] = [
  { id: 'folder-1', name: 'Folder 1', parentId: null, children: [], metadata: { createdAt: '', updatedAt: '' } },
  { id: 'folder-2', name: 'Folder 2', parentId: null, children: [], metadata: { createdAt: '', updatedAt: '' } },
];

const mockNotes: Note[] = [
  { id: 'note-1', title: 'Note 1', content: '<p>Content 1</p>', folderId: 'folder-1', metadata: { createdAt: '', updatedAt: '', status: 'active' } },
  { id: 'note-2', title: 'Note 2', content: '<p>Content 2</p>', folderId: null, metadata: { createdAt: '', updatedAt: '', status: 'active' } },
];

import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';

describe('Notes System Integration: Export Functionality', () => {
  beforeEach(async () => {
    // Reset mocks and store before each test
    vi.resetAllMocks();
    
    // Provide default mock implementations
    mockedNotesService.getFolders.mockResolvedValue([...mockFolders]);
    mockedNotesService.getNotes.mockResolvedValue([...mockNotes]);
    mockedNotesService.updateNote.mockImplementation(async (note) => {
      const updatedNote = { ...mockNotes.find(n => n.id === note.id), ...note };
      return updatedNote as any;
    });
    mockedNotesService.deleteNote.mockResolvedValue(undefined);

    // Reset and directly populate the store with test data
    act(() => {
      useNotesStore.setState({
        notes: [...mockNotes],
        folders: [...mockFolders],
        selectedNoteId: null,
        selectedFolderId: null,
        isLoading: false,
        error: null,
        isMigrated: true
      });
    });
  });

  it('should trigger export note when a format is selected from the sub-menu', async () => {
    vi.mocked(save).mockResolvedValue('test.pdf');
    
    const { container } = render(<NotesPage />, { wrapper: TestWrapper });
    
    // Wait for the component to render and check if any notes are visible
    await waitFor(() => {
      const notesText = screen.queryByText('Note 1');
      console.log('Looking for Note 1, found:', notesText);
      console.log('Current DOM:', container.innerHTML);
      expect(notesText).toBeInTheDocument();
    }, { timeout: 5000 });

    const note1Item = screen.getByText('Note 1').closest('.group');
    const moreButton = note1Item!.querySelector('button[aria-haspopup="true"]');
    await userEvent.click(moreButton!);

    // Open "Export" sub-menu
    const exportMenu = await screen.findByText('Export');
    await userEvent.hover(exportMenu);

    // Click on "PDF"
    const pdfOption = await screen.findByText('PDF');
    await userEvent.click(pdfOption);

    // Verify that the save dialog was called
    await waitFor(() => {
      expect(save).toHaveBeenCalled();
    });
  });

describe('Notes System Integration: Sidebar Context Menu', () => {
  beforeEach(async () => {
    // Reset mocks and store before each test
    vi.resetAllMocks();
    
    // Provide default mock implementations
    mockedNotesService.getFolders.mockResolvedValue([...mockFolders]);
    mockedNotesService.getNotes.mockResolvedValue([...mockNotes]);
    mockedNotesService.updateNote.mockImplementation(async (note) => {
      const updatedNote = { ...mockNotes.find(n => n.id === note.id), ...note };
      return updatedNote as any;
    });
    mockedNotesService.deleteNote.mockResolvedValue(undefined);

    // Reset and directly populate the store with test data
    act(() => {
      useNotesStore.setState({
        notes: [...mockNotes],
        folders: [...mockFolders],
        selectedNoteId: null,
        selectedFolderId: null,
        isLoading: false,
        error: null,
        isMigrated: true
      });
    });
  });

  it('should open context menu and show move/export options', async () => {
    render(<NotesPage />, { wrapper: TestWrapper });
    
    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText('Note 1')).toBeInTheDocument();
    });

    // Find the "More" button for "Note 1"
    const note1Item = screen.getByText('Note 1').closest('.group');
    expect(note1Item).not.toBeNull();
    
    const moreButton = note1Item!.querySelector('button[aria-haspopup="true"]');
    expect(moreButton).not.toBeNull();

    // Open the context menu
    await userEvent.click(moreButton!);
    
    // Check for "Move to" and "Export"
    await waitFor(() => {
      expect(screen.getByText('Move to')).toBeInTheDocument();
      expect(screen.getByText('Export')).toBeInTheDocument();
    });
  });

  it('should trigger move note when a folder is selected from the sub-menu', async () => {
    render(<NotesPage />, { wrapper: TestWrapper });
    await waitFor(() => expect(screen.getByText('Note 2')).toBeInTheDocument());

    const note2Item = screen.getByText('Note 2').closest('.group');
    const moreButton = note2Item!.querySelector('button[aria-haspopup="true"]');
    await userEvent.click(moreButton!);

    // Open "Move to" sub-menu
    const moveTo = await screen.findByText('Move to');
    await userEvent.hover(moveTo);

    // Click on "Folder 1"
    const folder1Option = await screen.findByText('Folder 1');
    await userEvent.click(folder1Option);

    // Verify that the updateNote service function was called correctly
    await waitFor(() => {
      expect(mockedNotesService.updateNote).toHaveBeenCalledWith({
        id: 'note-2',
        folderId: 'folder-1',
      });
    });
  });

  

  it('should not have the test click option in the dropdown menu', async () => {
    render(<NotesPage />, { wrapper: TestWrapper });
    await waitFor(() => expect(screen.getByText('Note 1')).toBeInTheDocument());

    const note1Item = screen.getByText('Note 1').closest('.group');
    const moreButton = note1Item!.querySelector('button[aria-haspopup="true"]');
    await userEvent.click(moreButton!);

    await waitFor(() => {
      expect(screen.getByText('Rename')).toBeInTheDocument();
    });

    const testClickOption = screen.queryByText('🧪 Test Click');
    expect(testClickOption).toBeNull();
  });
});
});
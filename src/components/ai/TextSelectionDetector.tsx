import React, { useCallback, useEffect, useState } from 'react';
import { useTextSelection } from '../../core/hooks/useTextSelection';
import { AIWritingToolsMenu, type AIAction } from './AIWritingToolsMenu';
import { AIOutputModal } from './AIOutputModal';
import { useChatStore } from '../../features/chat/stores/chatStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotesStore } from '../../features/notes/store';
import { useGoogleTasksStore } from '../../stores/googleTasksStore';

interface TextSelectionDetectorProps {
  children: React.ReactNode;
  disabled?: boolean;
}

export function TextSelectionDetector({ children, disabled = false }: TextSelectionDetectorProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState<{
    prompt: string;
    output: string;
    isLoading: boolean;
    action: AIAction;
  }>({ prompt: '', output: '', isLoading: false, action: 'rewrite-professional' });
  
  // Disable on Notes page since BlockNote has its own integrated menu
  const isNotesPage = location.pathname === '/notes';
  
  const { selection, clearSelection, replaceSelection } = useTextSelection({
    onSelectionChange: (sel) => {
      console.log('Selection change:', { sel, disabled, isNotesPage, location: location.pathname });
      if (sel && !disabled && !isNotesPage) {
        setShowMenu(true);
      } else {
        setShowMenu(false);
      }
    }
  });

  // Store references for AI actions
  const chatStore = useChatStore();
  const notesStore = useNotesStore();
  const tasksStore = useGoogleTasksStore();

  // Handle keyboard shortcut (Cmd/Ctrl + J)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j' && !isNotesPage) {
        e.preventDefault();
        const currentSelection = window.getSelection();
        if (currentSelection && !currentSelection.isCollapsed) {
          setShowMenu(true);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isNotesPage]);

  const handleAIAction = useCallback(async (action: AIAction, text: string) => {
    // Close the menu first
    setShowMenu(false);
    
    // For now, we'll implement basic actions and integrate with chat for AI processing
    switch (action) {
      case 'rewrite-professional':
        await processWithAI(`Rewrite the following text in a professional tone: "${text}"`, action);
        break;
      
      case 'rewrite-friendly':
        await processWithAI(`Rewrite the following text in a friendly, casual tone: "${text}"`, action);
        break;
      
      case 'rewrite-concise':
        await processWithAI(`Rewrite the following text to be more concise: "${text}"`, action);
        break;
      
      case 'rewrite-expanded':
        await processWithAI(`Expand on the following text with more detail: "${text}"`, action);
        break;
      
      case 'proofread':
        await processWithAI(`Proofread and correct any grammar or spelling errors in: "${text}"`, action);
        break;
      
      case 'summarize':
        await processWithAI(`Summarize the following text in 2-3 sentences: "${text}"`, action);
        break;
      
      case 'translate':
        // For now, default to Spanish. In future, we could show a language picker
        await processWithAI(`Translate the following text to Spanish: "${text}"`, action);
        break;
      
      case 'explain':
        await processWithAI(`Explain the following text in simple terms: "${text}"`, action);
        break;
      
      case 'create-task':
        // Create a task from the selected text
        await createTaskFromText(text);
        break;
      
      case 'create-note':
        // Create a note with the selected text
        await createNoteFromText(text);
        break;
      
      case 'create-list':
        // Create a bulleted list from the selected text
        await processWithAI(`Convert the following text into a bulleted list: "${text}"`, action);
        break;
      
      case 'key-points':
        // Extract key points from the selected text
        await processWithAI(`Extract the key points from the following text: "${text}"`, action);
        break;
      
      case 'ask-ai':
        // Navigate to chat with the text as context
        navigateToChatWithContext(text);
        break;
    }
  }, []);

  const processWithAI = async (prompt: string, action: AIAction) => {
    try {
      // Update modal to show loading state
      setModalData(prev => ({ ...prev, prompt, isLoading: true, action }));
      setShowModal(true);
      
      // Get or create a conversation for AI tools
      let conversationId = chatStore.selectedConversationId;
      
      if (!conversationId) {
        conversationId = await chatStore.createConversation('AI Writing Tools');
        chatStore.selectConversation(conversationId);
      }

      // Send the message and wait for response
      await chatStore.sendMessage(conversationId, prompt);
      
      // Wait a bit for the AI response to be generated
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get the latest AI response from the conversation
      const messages = chatStore.messages[conversationId];
      if (messages && messages.length >= 2) {
        // Get the last message (should be the AI response)
        const aiResponse = messages[messages.length - 1];
        if (aiResponse.sender === 'ai' && aiResponse.content) {
          // Update modal with the AI response
          setModalData(prev => ({ 
            ...prev, 
            output: aiResponse.content, 
            isLoading: false 
          }));
          
          // Clear the conversation for next use
          chatStore.selectConversation(null);
        }
      }
      
    } catch (error) {
      console.error('Failed to process with AI:', error);
      setModalData(prev => ({ 
        ...prev, 
        output: 'Failed to generate AI response. Please try again.', 
        isLoading: false 
      }));
    }
  };

  const createTaskFromText = async (text: string) => {
    try {
      // Extract task title from text (first line or first 50 chars)
      const title = text.split('\n')[0].substring(0, 50);
      
      // Get the first task list or create a default one
      const taskLists = tasksStore.taskLists;
      const taskListId = taskLists.length > 0 ? taskLists[0].id : null;
      
      if (!taskListId) {
        // Create a default task list if none exists
        await tasksStore.createTaskList('My Tasks');
        return;
      }
      
      // Create task with the selected text as description
      await tasksStore.createTask(taskListId, {
        title,
        notes: text
      });
      
      // Show success feedback (could be a toast in future)
      console.log('Task created successfully');
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const createNoteFromText = async (text: string) => {
    try {
      // Create note with selected text
      const title = text.split('\n')[0].substring(0, 30) || 'Quick Note';
      
      await notesStore.createNote({
        title,
        content: JSON.stringify([{ 
          type: 'paragraph', 
          content: text 
        }]),
        folderId: null
      });
      
      // Navigate to notes
      navigate('/notes');
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const navigateToChatWithContext = (text: string) => {
    // Navigate to chat with the selected text as initial context
    navigate('/chat', { 
      state: { 
        initialMessage: `I have a question about this text: "${text}"` 
      } 
    });
  };

  const handleRegenerate = useCallback(() => {
    if (modalData.prompt && modalData.action && selection) {
      processWithAI(modalData.prompt, modalData.action);
    }
  }, [modalData.prompt, modalData.action, selection]);

  const handleReplace = useCallback((text: string) => {
    replaceSelection(text);
    clearSelection();
  }, [replaceSelection, clearSelection]);

  return (
    <>
      {children}
      {showMenu && selection && (
        <AIWritingToolsMenu
          selection={selection}
          onClose={() => {
            setShowMenu(false);
            clearSelection();
          }}
          onAction={handleAIAction}
        />
      )}
      <AIOutputModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        prompt={modalData.prompt}
        output={modalData.output}
        isLoading={modalData.isLoading}
        onReplace={handleReplace}
        onRegenerate={handleRegenerate}
      />
    </>
  );
}
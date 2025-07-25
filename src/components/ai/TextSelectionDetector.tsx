import React, { useCallback, useEffect, useState } from 'react';
import { useTextSelection } from '../../core/hooks/useTextSelection';
import { AIWritingToolsMenu, type AIAction } from './AIWritingToolsMenu';
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
    // For now, we'll implement basic actions and integrate with chat for AI processing
    switch (action) {
      case 'rewrite-professional':
        await processWithAI(`Rewrite the following text in a professional tone: "${text}"`);
        break;
      
      case 'rewrite-friendly':
        await processWithAI(`Rewrite the following text in a friendly, casual tone: "${text}"`);
        break;
      
      case 'rewrite-concise':
        await processWithAI(`Rewrite the following text to be more concise: "${text}"`);
        break;
      
      case 'rewrite-expanded':
        await processWithAI(`Expand on the following text with more detail: "${text}"`);
        break;
      
      case 'proofread':
        await processWithAI(`Proofread and correct any grammar or spelling errors in: "${text}"`);
        break;
      
      case 'summarize':
        await processWithAI(`Summarize the following text in 2-3 sentences: "${text}"`);
        break;
      
      case 'translate':
        // For now, default to Spanish. In future, we could show a language picker
        await processWithAI(`Translate the following text to Spanish: "${text}"`);
        break;
      
      case 'explain':
        await processWithAI(`Explain the following text in simple terms: "${text}"`);
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
        await processWithAI(`Convert the following text into a bulleted list: "${text}"`);
        break;
      
      case 'key-points':
        // Extract key points from the selected text
        await processWithAI(`Extract the key points from the following text: "${text}"`);
        break;
      
      case 'ask-ai':
        // Navigate to chat with the text as context
        navigateToChatWithContext(text);
        break;
    }
  }, []);

  const processWithAI = async (prompt: string) => {
    try {
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
          // Replace the selected text with the AI response
          replaceSelection(aiResponse.content);
          
          // Clear the conversation for next use
          // This keeps the AI tools conversation clean
          chatStore.selectConversation(null);
        }
      }
      
    } catch (error) {
      console.error('Failed to process with AI:', error);
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
    </>
  );
}
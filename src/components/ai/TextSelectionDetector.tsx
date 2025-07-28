import React, { useCallback, useEffect, useState } from 'react';
import { useTextSelection } from '../../core/hooks/useTextSelection';
import { AIWritingToolsMenu, type AIAction } from './AIWritingToolsMenu';
import { AIOutputModalPro } from './AIOutputModalPro';
import { useChatStore } from '../../features/chat/stores/chatStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotesStore } from '../../features/notes/store';
import { useUnifiedTaskStore } from '../../stores/unifiedTaskStore';
import { LLMProviderManager, type LLMMessage } from '../../services/llmProviders';
import { useSettingsStore } from '../../stores/settingsStore';

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
    originalText: string;
    usedModel?: string;
    usedProvider?: string;
  }>({ prompt: '', output: '', isLoading: false, action: 'rewrite-professional', originalText: '' });
  
  // Disable on Notes page since BlockNote has its own integrated menu
  const isNotesPage = location.pathname === '/notes';
  
  const { selection, clearSelection, replaceSelection } = useTextSelection({
    onSelectionChange: useCallback((sel) => {
      if (sel && !disabled && !isNotesPage) {
        setShowMenu(true);
      } else {
        setShowMenu(false);
      }
    }, [disabled, isNotesPage])
  });

  // Store references for AI actions
  const chatStore = useChatStore();
  const notesStore = useNotesStore();
  const tasksStore = useUnifiedTaskStore();

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
        // Default to Spanish, but the modal will allow language selection
        await processWithAI(`Translate the following text to Spanish: "${text}"`, action, { originalText: text });
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


  const processWithAI = useCallback(async (prompt: string, action: AIAction, options?: any) => {
    
    try {
      // Store original text if we have a selection
      const originalText = selection?.text || modalData.originalText || '';
      
      // Update modal to show loading state
      setModalData(prev => ({ ...prev, prompt, isLoading: true, action, originalText }));
      setShowModal(true);
      
      // Get AI writing settings and chat settings
      const aiWritingSettings = useSettingsStore.getState().aiWriting;
      const chatStore = useChatStore.getState();
      
      // Determine which provider and model to use
      // Priority: AI Writing settings > Chat store settings
      let provider = aiWritingSettings.defaultProvider || chatStore.selectedProvider;
      let model = aiWritingSettings.defaultModel || chatStore.selectedModel;
      
      
      // Ensure we have valid provider and model
      if (!provider || !model) {
        throw new Error('No AI provider or model configured. Please configure AI settings.');
      }
      
      // Modify prompt based on options (e.g., for translation)
      let finalPrompt = prompt;
      if (action === 'translate' && options?.language) {
        finalPrompt = prompt.replace('Spanish', options.language);
      }

      // Prepare messages for LLM with action-specific system prompts
      let systemPrompt = 'Return ONLY the processed text without any explanations, introductions, or commentary. Do not include phrases like "Here is", "This is", or any other preamble.';
      
      // Action-specific system prompts
      switch (action) {
        case 'explain':
          systemPrompt = 'Explain the given text in simple, easy-to-understand terms. Return ONLY the explanation without any preamble.';
          break;
        case 'translate':
          systemPrompt = 'Translate the given text accurately. Return ONLY the translation without any explanations.';
          break;
        case 'summarize':
          systemPrompt = 'Provide a concise summary. Return ONLY the summary text without any introductory phrases.';
          break;
        case 'proofread':
          systemPrompt = 'Correct any errors. Return ONLY the corrected text without explanations.';
          break;
        case 'create-list':
          systemPrompt = 'Convert to a bulleted list. Return ONLY the list without any preamble.';
          break;
        case 'key-points':
          systemPrompt = 'Extract key points as a bulleted list. Return ONLY the list without introductions.';
          break;
        case 'rewrite-professional':
          systemPrompt = 'Rewrite in a professional tone. Return ONLY the rewritten text without any preamble like "Here\'s a professional rewrite:".';
          break;
        case 'rewrite-friendly':
          systemPrompt = 'Rewrite in a friendly tone. Return ONLY the rewritten text without introductory phrases.';
          break;
        case 'rewrite-concise':
          systemPrompt = 'Rewrite to be more concise. Return ONLY the shortened text without explanations like "Here\'s a more concise version:".';
          break;
        case 'rewrite-expanded':
          systemPrompt = 'Expand with more detail. Return ONLY the expanded text without introductory phrases.';
          break;
      }
      
      const messages: LLMMessage[] = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: finalPrompt
        }
      ];

      // Get the provider manager and make the call
      const settingsState = useSettingsStore.getState();
      const apiKeys = settingsState.integrations.apiKeys;
      
      const providerManager = LLMProviderManager.getInstance(apiKeys);
      const llmProvider = providerManager.getProvider(provider);
      
      if (!llmProvider) {
        throw new Error(`Provider ${provider} not found`);
      }
      
      if (!llmProvider.isConfigured()) {
        throw new Error(`Provider ${provider} is not configured. Please check your API keys in settings.`);
      }

      // Make the AI call
      const response = await llmProvider.chat(messages, model || undefined);
      
      // Update modal with the AI response
      setModalData(prev => ({ 
        ...prev, 
        output: response, 
        isLoading: false,
        usedModel: model || undefined,
        usedProvider: provider
      }));
      
    } catch (error) {
      console.error('Failed to process with AI:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setModalData(prev => ({ 
        ...prev, 
        output: `Error: ${errorMessage}`, 
        isLoading: false 
      }));
    }
  }, [selection, modalData.originalText]);

  const createTaskFromText = async (text: string) => {
    try {
      // Extract task title from text (first line or first 50 chars)
      const title = text.split('\n')[0].substring(0, 50);
      
      // Get the first column or fail gracefully
      const columns = tasksStore.columns;
      const firstColumn = columns.length > 0 ? columns[0] : null;
      
      if (!firstColumn) {
        console.error('No task columns available. Please create a task list first.');
        return;
      }
      
      // Create task with the selected text as description
      tasksStore.createTask({
        title,
        notes: text,
        columnId: firstColumn.id,
        googleTaskListId: firstColumn.googleTaskListId
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

  const handleRegenerate = useCallback(async (options?: any) => {
    if (modalData.prompt && modalData.action && modalData.originalText) {
      // Don't close the modal, just update with loading state
      setModalData(prev => ({ ...prev, isLoading: true }));
      
      try {
        // Get AI settings
        const aiWritingSettings = useSettingsStore.getState().aiWriting;
        const chatStore = useChatStore.getState();
        
        let provider = aiWritingSettings.defaultProvider || chatStore.selectedProvider;
        let model = aiWritingSettings.defaultModel || chatStore.selectedModel;
        
        if (!provider || !model) {
          throw new Error('No AI provider or model configured.');
        }
        
        // Update prompt for translation with new language
        let prompt = modalData.prompt;
        if (modalData.action === 'translate' && options?.language) {
          prompt = `Translate the following text to ${options.language}: "${modalData.originalText}"`;
        }
        
        // Get system prompt
        let systemPrompt = 'Return ONLY the processed text without any explanations, introductions, or commentary.';
        if (modalData.action === 'translate') {
          systemPrompt = 'Translate the given text accurately. Return ONLY the translation without any explanations.';
        }
        
        const messages: LLMMessage[] = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ];
        
        // Make the API call
        const settingsState = useSettingsStore.getState();
        const apiKeys = settingsState.integrations.apiKeys;
        const providerManager = LLMProviderManager.getInstance(apiKeys);
        const llmProvider = providerManager.getProvider(provider);
        
        if (!llmProvider || !llmProvider.isConfigured()) {
          throw new Error(`Provider ${provider} is not configured.`);
        }
        
        const response = await llmProvider.chat(messages, model || undefined);
        
        // Update modal state without closing it
        setModalData(prev => ({ 
          ...prev, 
          prompt,
          output: response, 
          isLoading: false,
          usedModel: model || undefined,
          usedProvider: provider
        }));
        
      } catch (error) {
        console.error('Failed to regenerate:', error);
        setModalData(prev => ({ 
          ...prev, 
          output: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 
          isLoading: false 
        }));
      }
    }
  }, [modalData]);

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
      <AIOutputModalPro
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          // Don't reset modal data to preserve state
        }}
        prompt={modalData.prompt}
        output={modalData.output}
        isLoading={modalData.isLoading}
        onReplace={handleReplace}
        onRegenerate={handleRegenerate}
        action={modalData.action}
        originalText={modalData.originalText}
        usedModel={modalData.usedModel}
        usedProvider={modalData.usedProvider}
      />
    </>
  );
}
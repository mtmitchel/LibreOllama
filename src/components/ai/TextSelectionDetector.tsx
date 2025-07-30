import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useTextSelection } from '../../core/hooks/useTextSelection';
import { AIWritingToolsMenu, type AIAction } from './AIWritingToolsMenu';
import { AIOutputModalPro } from './AIOutputModalPro';
import { useChatStore } from '../../features/chat/stores/chatStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotesStore } from '../../features/notes/store';
import { useUnifiedTaskStore } from '../../stores/unifiedTaskStore';
import { LLMProviderManager, type LLMMessage } from '../../services/llmProviders';
import { useSettingsStore } from '../../stores/settingsStore';
import { aiResponseCache } from '../../services/aiResponseCache';
import { getPromptTemplate, MODEL_SPECIFIC_SYSTEM_PROMPTS } from '../../services/aiPromptTemplates';

interface TextSelectionDetectorProps {
  children: React.ReactNode;
  disabled?: boolean;
}

// Pre-define system prompts to avoid runtime generation
const SYSTEM_PROMPTS: Record<AIAction, string> = {
  'explain': 'You are a text processor. Your ONLY job is to explain text in simple terms. Output ONLY the explanation, nothing else.',
  'translate': 'You are a translator. Your ONLY job is to translate text. Output ONLY the translation, nothing else.',
  'summarize': 'You are a summarizer. Your ONLY job is to create a 2-3 sentence summary. Output ONLY the summary, nothing else.',
  'proofread': 'You are a proofreader. Your ONLY job is to correct errors. Output ONLY the corrected text, nothing else.',
  'create-list': 'You are a list formatter. Your ONLY job is to convert text into a bulleted list. Start each line with "• ". Output ONLY bullet points, one per line. NO paragraphs. NO explanations.',
  'key-points': 'You are a key point extractor. Your ONLY job is to extract key points as a bulleted list. Start each line with "• ". Output ONLY bullet points, one per line. NO paragraphs. NO explanations.',
  'rewrite-professional': 'You are a professional writer. Your ONLY job is to rewrite text formally. Output ONLY the rewritten text, nothing else.',
  'rewrite-friendly': 'You are a casual writer. Your ONLY job is to rewrite text in a friendly tone. Output ONLY the rewritten text, nothing else.',
  'rewrite-concise': 'You are a concise writer. Your ONLY job is to shorten text. Output ONLY the shortened text, nothing else.',
  'rewrite-expanded': 'You are an elaborate writer. Your ONLY job is to expand text with more detail. Output ONLY the expanded text, nothing else.',
  'create-task': '',
  'create-note': '',
  'ask-ai': ''
};

const DEFAULT_SYSTEM_PROMPT = 'Return ONLY the processed text without any explanations, introductions, or commentary. Do not include phrases like "Here is", "This is", or any other preamble.';

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
  
  // Pre-initialize provider manager
  const providerManagerRef = useRef<LLMProviderManager | null>(null);
  
  // Disable on Notes page since BlockNote has its own integrated menu
  const isNotesPage = location.pathname === '/notes';
  
  // Initialize provider manager on mount
  useEffect(() => {
    const settingsState = useSettingsStore.getState();
    const apiKeys = settingsState.integrations.apiKeys;
    providerManagerRef.current = LLMProviderManager.getInstance(apiKeys);
  }, []);
  
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
        await processWithAI(text, action);
        break;
      
      case 'rewrite-friendly':
        await processWithAI(text, action);
        break;
      
      case 'rewrite-concise':
        await processWithAI(text, action);
        break;
      
      case 'rewrite-expanded':
        await processWithAI(text, action);
        break;
      
      case 'proofread':
        await processWithAI(text, action);
        break;
      
      case 'summarize':
        await processWithAI(text, action);
        break;
      
      case 'translate':
        // Default to Spanish, but the modal will allow language selection
        await processWithAI(text, action, { originalText: text, language: 'Spanish' });
        break;
      
      case 'explain':
        await processWithAI(text, action);
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
        await processWithAI(text, action);
        break;
      
      case 'key-points':
        // Extract key points from the selected text
        await processWithAI(text, action);
        break;
      
      case 'ask-ai':
        // Navigate to chat with the text as context
        navigateToChatWithContext(text);
        break;
    }
  }, []);


  const processWithAI = useCallback(async (text: string, action: AIAction, options?: any) => {
    
    try {
      // Store original text
      const originalText = text;
      
      // Update modal with all data in a single state update
      setModalData({
        prompt: '', // Will be set after we determine the model
        output: '',
        isLoading: true,
        action,
        originalText,
        usedModel: undefined,
        usedProvider: undefined
      });
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
      
      // Check cache first
      const cachedResponse = aiResponseCache.get(originalText, action, model, provider);
      if (cachedResponse) {
        const prompt = getPromptTemplate(action, model || 'default', originalText, options);
        setModalData({
          prompt,
          output: cachedResponse,
          isLoading: false,
          action,
          originalText,
          usedModel: model,
          usedProvider: provider
        });
        return;
      }
      
      // Generate model-specific prompt
      const prompt = getPromptTemplate(action, model || 'default', originalText, options);
      
      // Update modal with the generated prompt
      setModalData(prev => ({ ...prev, prompt }));
      
      // Use model-specific system prompt
      let systemPrompt = DEFAULT_SYSTEM_PROMPT;
      if (model?.toLowerCase().includes('gemma')) {
        if (action === 'create-list' || action === 'key-points') {
          systemPrompt = MODEL_SPECIFIC_SYSTEM_PROMPTS['gemma-list'];
        } else {
          systemPrompt = MODEL_SPECIFIC_SYSTEM_PROMPTS['gemma-default'];
        }
      } else {
        systemPrompt = SYSTEM_PROMPTS[action] || DEFAULT_SYSTEM_PROMPT;
      }
      
      const messages: LLMMessage[] = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      // Use pre-initialized provider manager
      if (!providerManagerRef.current) {
        const settingsState = useSettingsStore.getState();
        const apiKeys = settingsState.integrations.apiKeys;
        providerManagerRef.current = LLMProviderManager.getInstance(apiKeys);
      }
      
      const llmProvider = providerManagerRef.current.getProvider(provider);
      
      if (!llmProvider) {
        throw new Error(`Provider ${provider} not found`);
      }
      
      if (!llmProvider.isConfigured()) {
        throw new Error(`Provider ${provider} is not configured. Please check your API keys in settings.`);
      }

      // Make the AI call
      let response = await llmProvider.chat(messages, model || undefined);
      
      // Post-process response for list actions to ensure proper formatting
      if (action === 'create-list' || action === 'key-points') {
        console.log('Raw AI response for list action:', response);
        
        // If the response doesn't look like a list, try to convert it
        if (!response.includes('•') && !response.includes('-') && !response.includes('*')) {
          console.log('Response does not contain list markers, converting...');
          // Split by sentences or periods and convert to bullet points
          const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
          response = sentences.map(s => `• ${s.trim()}`).join('\n');
        }
        // Ensure consistent bullet format
        response = response.replace(/^[-*]\s*/gm, '• ').replace(/^\d+\.\s*/gm, '• ');
        
        console.log('Processed list response:', response);
      }
      
      // Cache the response
      aiResponseCache.set(originalText, action, response, model, provider);
      
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
        
        // Generate model-specific prompt
        const prompt = getPromptTemplate(modalData.action, model || 'default', modalData.originalText, options);
        
        // Use model-specific system prompt
        let systemPrompt = DEFAULT_SYSTEM_PROMPT;
        if (model?.toLowerCase().includes('gemma')) {
          if (modalData.action === 'create-list' || modalData.action === 'key-points') {
            systemPrompt = MODEL_SPECIFIC_SYSTEM_PROMPTS['gemma-list'];
          } else {
            systemPrompt = MODEL_SPECIFIC_SYSTEM_PROMPTS['gemma-default'];
          }
        } else {
          systemPrompt = SYSTEM_PROMPTS[modalData.action] || DEFAULT_SYSTEM_PROMPT;
        }
        
        const messages: LLMMessage[] = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ];
        
        // Use pre-initialized provider manager
        if (!providerManagerRef.current) {
          const settingsState = useSettingsStore.getState();
          const apiKeys = settingsState.integrations.apiKeys;
          providerManagerRef.current = LLMProviderManager.getInstance(apiKeys);
        }
        
        const llmProvider = providerManagerRef.current.getProvider(provider);
        
        if (!llmProvider || !llmProvider.isConfigured()) {
          throw new Error(`Provider ${provider} is not configured.`);
        }
        
        let response = await llmProvider.chat(messages, model || undefined);
        
        // Post-process response for list actions to ensure proper formatting
        if (modalData.action === 'create-list' || modalData.action === 'key-points') {
          // If the response doesn't look like a list, try to convert it
          if (!response.includes('•') && !response.includes('-') && !response.includes('*')) {
            // Split by sentences or periods and convert to bullet points
            const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
            response = sentences.map(s => `• ${s.trim()}`).join('\n');
          }
          // Ensure consistent bullet format
          response = response.replace(/^[-*]\s*/gm, '• ').replace(/^\d+\.\s*/gm, '• ');
        }
        
        // Cache the regenerated response
        aiResponseCache.set(modalData.originalText, modalData.action, response, model, provider);
        
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
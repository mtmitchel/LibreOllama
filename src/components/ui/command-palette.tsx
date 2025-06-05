"use client"

import * as React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Search,
  Command,
  ArrowRight,
  MessageSquare,
  Bot,
  Folder,
  FileText,
  CheckSquare,
  Calendar,
  Workflow,
  Plug,
  Download,
  File,
  BarChart3,
  Settings,
  Plus,
  Focus,
  Clock,
  Zap,
  Moon,
  Sun,
  Keyboard,
  ChevronRight,
  Palette,
  Network,
  HelpCircle,
  Sparkles,
  Brain,
  Target,
  TestTube
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader } from "./dialog"
import { Input } from "./input"
import { Badge } from "./badge"
import { Separator } from "./separator"
import { cn } from "@/lib/utils"
import { WorkflowState } from "@/components/UnifiedWorkspace"
import { useChat } from "@/hooks/use-chat"
import { useAgents } from "@/hooks/use-agents"
import { useFocusMode } from "@/hooks/use-focus-mode"
import { contextEngine, type ContentItem } from "@/lib/context-engine"
import { invoke } from '@tauri-apps/api/core'
import { fuzzySearchEngine, type FuzzyMatch } from "@/lib/fuzzy-search"

// AI Integration Types
interface NaturalLanguageIntent {
  action: string
  confidence: number
  parameters: Record<string, any>
  category: CommandCategory
}

interface AICommandSuggestion {
  id: string
  title: string
  description: string
  confidence: number
  reasoning: string
  category: CommandCategory
  action: () => void
  icon: React.ComponentType<{ className?: string }>
}

interface RecentCommand {
  id: string
  title: string
  timestamp: string
  frequency: number
  context: string
}

// Command types for different categories
export interface CommandAction {
  id: string
  title: string
  description: string
  category: CommandCategory
  keywords: string[]
  icon: React.ComponentType<{ className?: string }>
  action: () => void
  shortcut?: string
  workflow?: WorkflowState
  isAIGenerated?: boolean
  confidence?: number
  reasoning?: string
}

export type CommandCategory =
  | 'navigation'
  | 'creation'
  | 'ai-actions'
  | 'focus'
  | 'onboarding'
  | 'recent'
  | 'ai-suggestions'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  currentWorkflow: WorkflowState
  onWorkflowChange: (workflow: WorkflowState) => void
  onToggleFocusMode: () => void
  onStartOnboarding?: () => void
  className?: string
}

const categoryIcons: Record<CommandCategory, React.ComponentType<{ className?: string }>> = {
  navigation: ArrowRight,
  creation: Plus,
  'ai-actions': Bot,
  focus: Focus,
  onboarding: Zap,
  recent: Clock,
  'ai-suggestions': Sparkles
}

const categoryLabels: Record<CommandCategory, string> = {
  navigation: "Navigation",
  creation: "Create New",
  'ai-actions': "AI Actions",
  focus: "Focus & Productivity",
  onboarding: "Onboarding & Help",
  recent: "Recent",
  'ai-suggestions': "AI Suggestions"
}

const workflowIcons: Record<WorkflowState, React.ComponentType<{ className?: string }>> = {
  dashboard: BarChart3,
  'dashboard-v2': Sparkles,
  chat: MessageSquare,
  'chat-v2': Sparkles,
  agents: Bot,
  folders: Folder,
  notes: FileText,
  tasks: CheckSquare,
  calendar: Calendar,
  n8n: Workflow,
  mcp: Plug,
  models: Download,
  templates: File,
  analytics: BarChart3,
  settings: Settings,
  canvas: Palette,
  'knowledge-graph': Network,
  'test-suite': TestTube,
  'test-analyzer': Search
}

export function CommandPalette({
  isOpen,
  onClose,
  currentWorkflow,
  onWorkflowChange,
  onToggleFocusMode,
  onStartOnboarding,
  className
}: CommandPaletteProps) {
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentCommands, setRecentCommands] = useState<RecentCommand[]>([])
  const [aiSuggestions, setAiSuggestions] = useState<AICommandSuggestion[]>([])
  const [isProcessingNL, setIsProcessingNL] = useState(false)
  const [nlIntent, setNlIntent] = useState<NaturalLanguageIntent | null>(null)
  
  // AI integration hooks
  const { createChatSession, sendMessage } = useChat()
  const { agents, createAgent } = useAgents()
  const { focusMode, toggleFocusMode, toggleFocusOption, togglePomodoroTimer } = useFocusMode()

  // Helper functions for AI-powered actions
  const createNoteWithTitle = useCallback(async (title: string) => {
    console.log('Creating note with title:', title)
    // Future: implement actual note creation with title
  }, [])

  const triggerNewNoteCreation = useCallback(() => {
    console.log('Triggering new note creation')
    // Future: implement actual note creation trigger
  }, [])

  const createChatWithInitialMessage = useCallback(async (message: string) => {
    try {
      const session = await createChatSession(`Chat about ${message}`, message)
      if (session) {
        console.log('Created chat session with initial message:', message)
      }
    } catch (error) {
      console.error('Error creating chat with initial message:', error)
    }
  }, [createChatSession])

  const createAgentWithPurpose = useCallback(async (purpose: string) => {
    try {
      const agent = await createAgent({
        name: `Agent for ${purpose}`,
        description: `AI agent designed to help with ${purpose}`,
        instructions: `You are an AI agent specialized in helping with ${purpose}. Provide helpful, accurate, and contextual assistance.`,
        model: 'llama3.2', // Default model
        tools: [],
        startingPrompts: [`How can I help you with ${purpose}?`],
        tags: [purpose.toLowerCase().replace(/\s+/g, '-')]
      })
      if (agent) {
        console.log('Created agent with purpose:', purpose)
      }
    } catch (error) {
      console.error('Error creating agent with purpose:', error)
    }
  }, [createAgent])

  const performAISummarization = useCallback(async () => {
    try {
      // Create a specialized session for summarization
      const session = await createChatSession('AI Summarization', 'Please help me summarize the current context and content.')
      if (session) {
        console.log('Started AI summarization session')
      }
    } catch (error) {
      console.error('Error performing AI summarization:', error)
    }
  }, [createChatSession])

  const performAITaskGeneration = useCallback(async () => {
    try {
      const session = await createChatSession('AI Task Generation', 'Please help me generate actionable tasks from the current content and context.')
      if (session) {
        console.log('Started AI task generation session')
      }
    } catch (error) {
      console.error('Error performing AI task generation:', error)
    }
  }, [createChatSession])

  const askAIWithContext = useCallback(async () => {
    try {
      const contextMessage = `Current workflow: ${currentWorkflow}. Please provide assistance based on this context.`
      const session = await createChatSession('AI Context Help', contextMessage)
      if (session) {
        console.log('Started AI context help session')
      }
    } catch (error) {
      console.error('Error asking AI with context:', error)
    }
  }, [createChatSession, currentWorkflow])

  // AI Natural Language Processing
  const processNaturalLanguage = useCallback(async (input: string): Promise<NaturalLanguageIntent | null> => {
    if (input.length < 3) return null
    
    setIsProcessingNL(true)
    try {
      // Use local keyword matching for fast response, with AI fallback
      const intent = await parseIntent(input)
      return intent
    } catch (error) {
      console.error('Error processing natural language:', error)
      return null
    } finally {
      setIsProcessingNL(false)
    }
  }, [])

  // Intent parsing using pattern matching and AI
  const parseIntent = useCallback(async (input: string): Promise<NaturalLanguageIntent> => {
    const lowercaseInput = input.toLowerCase()
    
    // Quick pattern matching for common intents
    const patterns = [
      {
        patterns: [/create.*note|new.*note|make.*note|write.*note/],
        action: 'create-note',
        category: 'creation' as CommandCategory,
        confidence: 0.9
      },
      {
        patterns: [/create.*chat|new.*chat|start.*conversation|talk.*ai/],
        action: 'create-chat',
        category: 'creation' as CommandCategory,
        confidence: 0.9
      },
      {
        patterns: [/create.*agent|new.*agent|build.*agent|make.*agent/],
        action: 'create-agent',
        category: 'creation' as CommandCategory,
        confidence: 0.9
      },
      {
        patterns: [/go.*chat|open.*chat|switch.*chat/],
        action: 'nav-chat',
        category: 'navigation' as CommandCategory,
        confidence: 0.8
      },
      {
        patterns: [/go.*notes|open.*notes|switch.*notes/],
        action: 'nav-notes',
        category: 'navigation' as CommandCategory,
        confidence: 0.8
      },
      {
        patterns: [/go.*tasks|open.*tasks|switch.*tasks|kanban/],
        action: 'nav-tasks',
        category: 'navigation' as CommandCategory,
        confidence: 0.8
      },
      {
        patterns: [/focus.*mode|distraction.*free|concentrate/],
        action: 'focus-mode',
        category: 'focus' as CommandCategory,
        confidence: 0.9
      },
      {
        patterns: [/summarize|summary|tldr/],
        action: 'ai-summarize',
        category: 'ai-actions' as CommandCategory,
        confidence: 0.8
      },
      {
        patterns: [/ask.*ai|question.*ai|help.*ai/],
        action: 'ai-ask',
        category: 'ai-actions' as CommandCategory,
        confidence: 0.8
      }
    ]

    // Find matching pattern
    for (const pattern of patterns) {
      for (const regex of pattern.patterns) {
        if (regex.test(lowercaseInput)) {
          return {
            action: pattern.action,
            confidence: pattern.confidence,
            parameters: extractParameters(input, pattern.action),
            category: pattern.category
          }
        }
      }
    }

    // Fallback: use AI for complex queries
    try {
      const aiIntent = await invokeAIForIntent(input)
      return aiIntent
    } catch (error) {
      // Final fallback: general search
      return {
        action: 'search',
        confidence: 0.3,
        parameters: { query: input },
        category: 'navigation' as CommandCategory
      }
    }
  }, [])

  // Extract parameters from natural language input
  const extractParameters = useCallback((input: string, action: string): Record<string, any> => {
    const params: Record<string, any> = {}
    
    switch (action) {
      case 'create-note':
      case 'create-chat':
        // Extract title from phrases like "create note about meeting"
        const aboutMatch = input.match(/(?:about|for|on|regarding)\s+(.+)$/i)
        if (aboutMatch) {
          params.title = aboutMatch[1].trim()
        }
        break
      case 'create-agent':
        // Extract agent purpose
        const purposeMatch = input.match(/(?:for|to|that)\s+(.+)$/i)
        if (purposeMatch) {
          params.purpose = purposeMatch[1].trim()
        }
        break
    }
    
    return params
  }, [])

  // AI-powered intent recognition using Ollama
  const invokeAIForIntent = useCallback(async (input: string): Promise<NaturalLanguageIntent> => {
    try {
      const prompt = `Analyze this user command and determine the intent. Respond with a JSON object containing:
- action: one of [create-note, create-chat, create-agent, nav-chat, nav-notes, nav-tasks, nav-agents, nav-calendar, focus-mode, ai-summarize, ai-ask, search]
- confidence: 0-1 score
- parameters: object with relevant extracted parameters
- category: one of [navigation, creation, ai-actions, focus]

User command: "${input}"

Response (JSON only):`

      const response = await invoke<string>('send_message', {
        sessionId: 'intent-analysis',
        content: prompt
      })

      const parsed = JSON.parse(response)
      return {
        action: parsed.action || 'search',
        confidence: Math.max(0.1, Math.min(1, parsed.confidence || 0.3)),
        parameters: parsed.parameters || {},
        category: parsed.category || 'navigation'
      }
    } catch (error) {
      console.error('AI intent analysis failed:', error)
      throw error
    }
  }, [])

  // Generate context-aware suggestions
  const generateContextSuggestions = useCallback(async (): Promise<AICommandSuggestion[]> => {
    const suggestions: AICommandSuggestion[] = []
    
    try {
      // Get recent content for context analysis
      const recentContent: ContentItem[] = []
      
      // Analyze context and generate suggestions
      const contextAnalysis = contextEngine.analyzeContent(recentContent)
      
      // Generate suggestions based on current workflow
      switch (currentWorkflow) {
        case 'chat':
          suggestions.push({
            id: 'suggest-new-chat',
            title: 'Start New Conversation',
            description: 'Create a fresh chat session for a new topic',
            confidence: 0.7,
            reasoning: 'You might want to start a new conversation',
            category: 'ai-suggestions',
            action: () => executeCommand({ id: 'create-chat', title: '', description: '', category: 'creation', keywords: [], icon: MessageSquare, action: () => {} }),
            icon: MessageSquare
          })
          break
        
        case 'notes':
          suggestions.push({
            id: 'suggest-ai-summary',
            title: 'Summarize Current Notes',
            description: 'Get AI-powered summary of your notes',
            confidence: 0.8,
            reasoning: 'AI can help organize your thoughts',
            category: 'ai-suggestions',
            action: () => executeCommand({ id: 'ai-summarize', title: '', description: '', category: 'ai-actions', keywords: [], icon: Brain, action: () => {} }),
            icon: Brain
          })
          break
          
        case 'tasks':
          suggestions.push({
            id: 'suggest-priority-focus',
            title: 'Focus on High Priority',
            description: 'Switch to focus mode for important tasks',
            confidence: 0.9,
            reasoning: 'Focus mode helps with task completion',
            category: 'ai-suggestions',
            action: () => executeCommand({ id: 'focus-mode', title: '', description: '', category: 'focus', keywords: [], icon: Target, action: () => {} }),
            icon: Target
          })
          break
      }
      
      // Add agent suggestions if agents are available
      if (agents.length > 0) {
        suggestions.push({
          id: 'suggest-agent-help',
          title: 'Get Agent Assistance',
          description: `Use one of your ${agents.length} agents for help`,
          confidence: 0.6,
          reasoning: 'Your agents can provide specialized assistance',
          category: 'ai-suggestions',
          action: () => onWorkflowChange('agents'),
          icon: Bot
        })
      }
      
    } catch (error) {
      console.error('Error generating context suggestions:', error)
    }
    
    return suggestions
  }, [currentWorkflow, agents, contextEngine, onWorkflowChange])

  // Load recent commands from localStorage
  const loadRecentCommands = useCallback((): RecentCommand[] => {
    try {
      const stored = localStorage.getItem('commandPalette.recentCommands')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Error loading recent commands:', error)
    }
    return []
  }, [])

  // Save recent commands to localStorage
  const saveRecentCommands = useCallback((commands: RecentCommand[]): void => {
    try {
      localStorage.setItem('commandPalette.recentCommands', JSON.stringify(commands))
    } catch (error) {
      console.error('Error saving recent commands:', error)
    }
  }, [])

  // Track command usage
  const trackCommandUsage = useCallback((commandId: string, title: string): void => {
    setRecentCommands(prev => {
      const existing = prev.find(cmd => cmd.id === commandId)
      const now = new Date().toISOString()
      
      let updated: RecentCommand[]
      
      if (existing) {
        // Update existing command
        updated = prev.map(cmd =>
          cmd.id === commandId
            ? { ...cmd, timestamp: now, frequency: cmd.frequency + 1, context: currentWorkflow }
            : cmd
        )
      } else {
        // Add new command
        const newCommand: RecentCommand = {
          id: commandId,
          title,
          timestamp: now,
          frequency: 1,
          context: currentWorkflow
        }
        updated = [newCommand, ...prev]
      }
      
      // Keep only top 10 most recent/frequent commands
      const sorted = updated
        .sort((a, b) => {
          const aScore = a.frequency * 0.3 + (Date.now() - new Date(a.timestamp).getTime()) * -0.0001
          const bScore = b.frequency * 0.3 + (Date.now() - new Date(b.timestamp).getTime()) * -0.0001
          return bScore - aScore
        })
        .slice(0, 10)
      
      saveRecentCommands(sorted)
      return sorted
    })
  }, [currentWorkflow, saveRecentCommands])

  // Initialize recent commands and AI suggestions
  useEffect(() => {
    setRecentCommands(loadRecentCommands())
    generateContextSuggestions().then(setAiSuggestions)
  }, [loadRecentCommands, generateContextSuggestions])

  // Update AI suggestions when workflow changes
  useEffect(() => {
    generateContextSuggestions().then(setAiSuggestions)
  }, [currentWorkflow, generateContextSuggestions])

  // Process natural language as user types
  useEffect(() => {
    if (query.length > 2) {
      const timeoutId = setTimeout(() => {
        processNaturalLanguage(query).then(setNlIntent)
      }, 300) // Debounce for 300ms
      
      return () => clearTimeout(timeoutId)
    } else {
      setNlIntent(null)
    }
  }, [query, processNaturalLanguage])

  // Generate base commands
  const baseCommands = useMemo((): CommandAction[] => [
    // Navigation Commands
    {
      id: "nav-dashboard",
      title: "Go to Dashboard",
      description: "Open main dashboard",
      category: "navigation",
      keywords: ["dashboard", "main", "overview", "home"],
      icon: BarChart3,
      action: () => onWorkflowChange('dashboard'),
      shortcut: "Ctrl+0",
      workflow: 'dashboard'
    },
    {
      id: "nav-dashboard-v2",
      title: "Go to Dashboard v2",
      description: "Open new dashboard with modern design",
      category: "navigation",
      keywords: ["dashboard", "v2", "new", "modern", "design"],
      icon: Sparkles,
      action: () => onWorkflowChange('dashboard-v2'),
      shortcut: "Ctrl+D",
      workflow: 'dashboard-v2'
    },
    {
      id: "nav-chat",
      title: "Go to Chat",
      description: "Open AI chat interface",
      category: "navigation",
      keywords: ["chat", "ai", "conversation", "talk"],
      icon: MessageSquare,
      action: () => onWorkflowChange('chat'),
      shortcut: "Ctrl+1",
      workflow: 'chat'
    },
    {
      id: "nav-chat-v2",
      title: "Go to AI Chat v2",
      description: "Open new AI chat with modern design",
      category: "navigation",
      keywords: ["chat", "v2", "ai", "new", "modern", "design"],
      icon: Sparkles,
      action: () => onWorkflowChange('chat-v2'),
      shortcut: "Ctrl+C",
      workflow: 'chat-v2'
    },
    {
      id: "nav-agents",
      title: "Go to Agents",
      description: "Open agent builder",
      category: "navigation", 
      keywords: ["agents", "builder", "ai", "automation"],
      icon: Bot,
      action: () => onWorkflowChange('agents'),
      shortcut: "Ctrl+2",
      workflow: 'agents'
    },
    {
      id: "nav-notes",
      title: "Go to Notes",
      description: "Open notes manager",
      category: "navigation",
      keywords: ["notes", "documentation", "write", "text"],
      icon: FileText,
      action: () => onWorkflowChange('notes'),
      shortcut: "Ctrl+2",
      workflow: 'notes'
    },
    {
      id: "nav-tasks",
      title: "Go to Tasks",
      description: "Open task management",
      category: "navigation",
      keywords: ["tasks", "todo", "kanban", "productivity"],
      icon: CheckSquare,
      action: () => onWorkflowChange('tasks'),
      shortcut: "Ctrl+3",
      workflow: 'tasks'
    },
    {
      id: "nav-calendar",
      title: "Go to Calendar",
      description: "Open calendar and events",
      category: "navigation",
      keywords: ["calendar", "events", "schedule", "time"],
      icon: Calendar,
      action: () => onWorkflowChange('calendar'),
      shortcut: "Ctrl+4",
      workflow: 'calendar'
    },
    {
      id: "nav-agents",
      title: "Go to AI Agents",
      description: "Open agent builder",
      category: "navigation",
      keywords: ["agents", "builder", "ai", "automation"],
      icon: Bot,
      action: () => onWorkflowChange('agents'),
      shortcut: "Ctrl+5",
      workflow: 'agents'
    },
    {
      id: "nav-canvas",
      title: "Go to Canvas",
      description: "Open spatial organization canvas",
      category: "navigation",
      keywords: ["canvas", "spatial", "visual", "organize", "whiteboard"],
      icon: Palette,
      action: () => onWorkflowChange('canvas'),
      shortcut: "Ctrl+6",
      workflow: 'canvas'
    },
    {
      id: "nav-knowledge-graph",
      title: "Go to Knowledge Graph",
      description: "View knowledge relationships",
      category: "navigation",
      keywords: ["knowledge", "graph", "relationships", "connections", "network"],
      icon: Network,
      action: () => onWorkflowChange('knowledge-graph'),
      shortcut: "Ctrl+7",
      workflow: 'knowledge-graph'
    },
    {
      id: "nav-analytics",
      title: "Go to Analytics",
      description: "View performance metrics",
      category: "navigation",
      keywords: ["analytics", "metrics", "performance", "stats"],
      icon: BarChart3,
      action: () => onWorkflowChange('analytics'),
      shortcut: "Ctrl+8",
      workflow: 'analytics'
    },
    {
      id: "nav-folders",
      title: "Go to Folders",
      description: "Open folder management",
      category: "navigation",
      keywords: ["folders", "organize", "files", "structure"],
      icon: Folder,
      action: () => onWorkflowChange('folders'),
      shortcut: "Ctrl+9",
      workflow: 'folders'
    },
    {
      id: "nav-models",
      title: "Go to Models",
      description: "Open model management",
      category: "navigation",
      keywords: ["models", "ai", "manage", "download"],
      icon: Download,
      action: () => onWorkflowChange('models'),
      shortcut: "Ctrl+0",
      workflow: 'models'
    },
    {
      id: "nav-settings",
      title: "Go to Settings",
      description: "Open advanced settings",
      category: "navigation",
      keywords: ["settings", "config", "preferences", "options"],
      icon: Settings,
      action: () => onWorkflowChange('settings'),
      shortcut: "Ctrl+S",
      workflow: 'settings'
    },

    // Creation Commands
    {
      id: "create-note",
      title: "New Note",
      description: "Create a new note document",
      category: "creation",
      keywords: ["new", "note", "create", "document", "write"],
      icon: FileText,
      action: () => {
        onWorkflowChange('notes')
        // Create new note with AI context if available
        if (nlIntent?.parameters?.title) {
          createNoteWithTitle(nlIntent.parameters.title)
        } else {
          triggerNewNoteCreation()
        }
      },
      shortcut: "Ctrl+N"
    },
    {
      id: "create-chat",
      title: "New Chat",
      description: "Start a new AI conversation",
      category: "creation",
      keywords: ["new", "chat", "conversation", "ai", "talk"],
      icon: MessageSquare,
      action: () => {
        onWorkflowChange('chat')
        // Create new chat with AI context if available
        if (nlIntent?.parameters?.title) {
          createChatWithInitialMessage(nlIntent.parameters.title)
        } else {
          createChatSession('New Chat Session')
        }
      },
      shortcut: "Ctrl+Shift+N"
    },
    {
      id: "create-agent",
      title: "New Agent",
      description: "Build a new AI agent",
      category: "creation",
      keywords: ["new", "agent", "create", "ai", "automation"],
      icon: Bot,
      action: () => {
        onWorkflowChange('agents')
        // Create new agent with AI context if available
        if (nlIntent?.parameters?.purpose) {
          createAgentWithPurpose(nlIntent.parameters.purpose)
        } else {
          console.log('Triggering new agent creation')
          // Future: implement agent creation wizard trigger
        }
      }
    },
    {
      id: "create-folder",
      title: "New Folder",
      description: "Create organization folder",
      category: "creation",
      keywords: ["new", "folder", "organize", "create"],
      icon: Folder,
      action: () => {
        onWorkflowChange('folders')
        console.log('Triggering new folder creation')
        // Future: implement folder creation dialog
      }
    },

    // AI Actions
    {
      id: "ai-summarize",
      title: "Summarize Selection",
      description: "AI summarize selected content",
      category: "ai-actions",
      keywords: ["summarize", "ai", "summary", "content"],
      icon: Bot,
      action: () => {
        performAISummarization()
      }
    },
    {
      id: "ai-generate-tasks",
      title: "Generate Tasks",
      description: "AI generate tasks from content",
      category: "ai-actions", 
      keywords: ["generate", "tasks", "ai", "todo", "action"],
      icon: Bot,
      action: () => {
        performAITaskGeneration()
      }
    },
    {
      id: "ai-ask",
      title: "Ask AI",
      description: "Ask AI about current context",
      category: "ai-actions",
      keywords: ["ask", "ai", "question", "help"],
      icon: Bot,
      action: () => {
        onWorkflowChange('chat')
        askAIWithContext()
      }
    },

    // Focus & Productivity
    {
      id: "focus-mode",
      title: "Toggle Focus Mode",
      description: "Enter distraction-free mode",
      category: "focus",
      keywords: ["focus", "distraction", "mode", "concentrate"],
      icon: Focus,
      action: onToggleFocusMode,
      shortcut: "Ctrl+Shift+F"
    },
    {
      id: "focus-typewriter",
      title: "Toggle Typewriter Scrolling",
      description: focusMode.options.typewriterScrolling ? "Disable typewriter scrolling" : "Enable typewriter scrolling for better focus",
      category: "focus",
      keywords: ["typewriter", "scroll", "cursor", "follow", "writing"],
      icon: FileText,
      action: () => toggleFocusOption('typewriterScrolling'),
      shortcut: "Ctrl+T"
    },
    {
      id: "focus-sentence-highlight",
      title: "Toggle Sentence Highlighting",
      description: focusMode.options.sentenceHighlighting ? "Disable sentence highlighting" : "Enable sentence highlighting for better reading",
      category: "focus",
      keywords: ["sentence", "highlight", "reading", "current", "text"],
      icon: Target,
      action: () => toggleFocusOption('sentenceHighlighting'),
      shortcut: "Ctrl+H"
    },
    {
      id: "focus-pomodoro",
      title: focusMode.pomodoro.isActive ? "Stop Pomodoro Timer" : "Start Pomodoro",
      description: focusMode.pomodoro.isActive ? `Stop current ${focusMode.pomodoro.currentSession} session` : "Begin 25-minute focus session",
      category: "focus",
      keywords: ["pomodoro", "timer", "focus", "productivity", "session"],
      icon: Clock,
      action: togglePomodoroTimer,
      shortcut: "Ctrl+P"
    },
    {
      id: "focus-energy-high",
      title: "High Energy Mode",
      description: "Switch to high-energy tasks",
      category: "focus",
      keywords: ["energy", "high", "productive", "active"],
      icon: Zap,
      action: () => {
        console.log('Switching to High Energy Mode')
        // Future: implement energy-based task filtering and UI adjustments
        // Could show high-priority tasks, brighter themes, etc.
      }
    },
    {
      id: "focus-energy-low",
      title: "Low Energy Mode",
      description: "Switch to low-energy tasks",
      category: "focus",
      keywords: ["energy", "low", "rest", "calm"],
      icon: Moon,
      action: () => {
        console.log('Switching to Low Energy Mode')
        // Future: implement low-energy optimizations
        // Could show simpler tasks, dimmer themes, reduced notifications
      }
    },

    // Onboarding Commands
    ...(onStartOnboarding ? [
      {
        id: "restart-onboarding",
        title: "Restart Onboarding",
        description: "Go through the setup process again",
        category: "onboarding" as CommandCategory,
        keywords: ["onboarding", "setup", "tutorial", "restart", "help"],
        icon: Zap,
        action: onStartOnboarding
      },
      {
        id: "onboarding-help",
        title: "Onboarding Help",
        description: "Get help with LibreOllama features",
        category: "onboarding" as CommandCategory,
        keywords: ["help", "tutorial", "guide", "learn"],
        icon: HelpCircle,
        action: () => {
          console.log('Opening help documentation')
          // Future: implement help documentation modal or external link
        }
      }
    ] : [])
  ], [onWorkflowChange, onToggleFocusMode, onStartOnboarding])

  // Enhanced filter commands with fuzzy search and <200ms performance
  const filteredCommands = useMemo(() => {
    const startTime = performance.now()
    
    if (!query.trim()) {
      return baseCommands
    }

    // Use fuzzy search engine for better matching and typo tolerance
    const fuzzyMatches = fuzzySearchEngine.search(baseCommands, query)
    
    // Convert fuzzy matches back to commands, maintaining score for sorting
    const results = fuzzyMatches.map(match => ({
      ...match.item,
      fuzzyScore: match.score,
      fuzzyMatches: match.matches
    }))

    // Performance monitoring - ensure <200ms response time
    const endTime = performance.now()
    if (endTime - startTime > 200) {
      console.warn(`Command search took ${Math.round(endTime - startTime)}ms - exceeding 200ms target`)
    }

    return results
  }, [query, baseCommands])

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<CommandCategory, CommandAction[]> = {
      navigation: [],
      creation: [],
      'ai-actions': [],
      focus: [],
      onboarding: [],
      recent: [],
      'ai-suggestions': []
    }

    filteredCommands.forEach(command => {
      groups[command.category as CommandCategory].push(command)
    })

    // Add AI suggestions if available
    aiSuggestions.forEach(suggestion => {
      const command: CommandAction = {
        id: suggestion.id,
        title: suggestion.title,
        description: suggestion.description,
        category: suggestion.category,
        keywords: [suggestion.reasoning],
        icon: suggestion.icon,
        action: suggestion.action,
        isAIGenerated: true,
        confidence: suggestion.confidence,
        reasoning: suggestion.reasoning
      }
      groups['ai-suggestions'].push(command)
    })

    // Add recent commands if available
    recentCommands.forEach(recent => {
      const command: CommandAction = {
        id: `recent-${recent.id}`,
        title: recent.title,
        description: `Recently used (${recent.frequency}x)`,
        category: 'recent',
        keywords: [recent.context, 'recent', 'history'],
        icon: Clock,
        action: () => {
          // Find and execute the original command
          const originalCommand = filteredCommands.find(cmd => cmd.id === recent.id)
          if (originalCommand) {
            originalCommand.action()
          }
        }
      }
      groups['recent'].push(command)
    })

    // Filter out empty categories
    return Object.entries(groups).filter(([_, commands]) => commands.length > 0)
  }, [filteredCommands, aiSuggestions, recentCommands])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }, [isOpen, filteredCommands, selectedIndex, onClose])

  // Execute command and track usage
  const executeCommand = useCallback((command: CommandAction) => {
    command.action()
    
    // Track command usage with proper typing
    trackCommandUsage(command.id, command.title)
    
    onClose()
  }, [onClose, trackCommandUsage])

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setQuery("")
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Add keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Auto-scroll selected item into view
  useEffect(() => {
    const selectedElement = document.querySelector(`[data-command-index="${selectedIndex}"]`)
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "max-w-3xl w-[90vw] p-0 gap-0 overflow-hidden shadow-xl border-0",
        "bg-white/95 backdrop-blur-xl supports-[backdrop-filter]:bg-white/90",
        "animate-in zoom-in-95 duration-200",
        className
      )}>
        <DialogHeader className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
              <Command className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">Command Palette</h2>
              <p className="text-sm text-gray-600">
                Search for actions, navigate between modules, or use natural language with AI
              </p>
            </div>
            <div className="text-xs text-gray-500 bg-white/60 px-2 py-1 rounded-full">
              <Keyboard className="h-3 w-3 inline mr-1" />
              ⌘K
            </div>
          </div>
        </DialogHeader>

        {/* Enhanced Search Input */}
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="relative group">
            <Search className={cn(
              "absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors",
              query ? "text-blue-600" : "text-gray-400"
            )} />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try 'create note about meeting' or 'go to tasks'..."
              className={cn(
                "pl-12 pr-16 h-14 text-base border-2 border-gray-200 rounded-xl",
                "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500",
                "bg-white shadow-sm transition-all duration-200",
                "placeholder:text-gray-400"
              )}
              autoFocus
            />
            {isProcessingNL && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-blue-600 animate-pulse" />
                  <span className="text-xs text-blue-600 font-medium">AI thinking...</span>
                </div>
              </div>
            )}
            {!isProcessingNL && query && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                {filteredCommands.length} result{filteredCommands.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          
          {/* Enhanced Natural Language Intent Detection */}
          {nlIntent && nlIntent.confidence > 0.7 && (
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-blue-900">
                      AI understood: {nlIntent.action.replace(/-/g, ' ')}
                    </span>
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                      {Math.round(nlIntent.confidence * 100)}% confident
                    </Badge>
                  </div>
                  {nlIntent.parameters && Object.keys(nlIntent.parameters).length > 0 && (
                    <div className="mt-1 text-xs text-blue-700">
                      <span className="font-medium">Parameters:</span> {JSON.stringify(nlIntent.parameters)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Commands List */}
        <div className="max-h-[28rem] overflow-y-auto scroll-smooth">
          {groupedCommands.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="mb-4">
                <Bot className="h-12 w-12 mx-auto text-gray-300" />
              </div>
              <p className="text-lg font-medium text-gray-900 mb-2">No commands found</p>
              <p className="text-sm text-gray-500 mb-4">Try a different search term or use natural language</p>
              <div className="text-xs text-gray-400">
                <span>Examples: "create note about meeting", "go to tasks", "focus mode"</span>
              </div>
            </div>
          ) : (
            <div className="py-3">
              {groupedCommands.map(([category, commands], categoryIndex) => (
                <div key={category} className="mb-2">
                  {/* Enhanced Category Header */}
                  <div className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center space-x-3 bg-gradient-to-r from-gray-50 to-transparent">
                    <div className="flex items-center justify-center w-5 h-5 rounded bg-gray-100">
                      {React.createElement(categoryIcons[category as CommandCategory], {
                        className: "h-3 w-3 text-gray-600"
                      })}
                    </div>
                    <span>{categoryLabels[category as CommandCategory]}</span>
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <span className="text-gray-400 font-normal">{commands.length}</span>
                  </div>

                  {/* Enhanced Commands in Category */}
                  {commands.map((command, commandIndex) => {
                    const globalIndex = filteredCommands.indexOf(command)
                    const isSelected = globalIndex === selectedIndex
                    
                    return (
                      <div
                        key={command.id}
                        data-command-index={globalIndex}
                        className={cn(
                          "mx-3 px-4 py-4 rounded-xl cursor-pointer transition-all duration-150",
                          "flex items-center justify-between group relative",
                          "border border-transparent",
                          command.isAIGenerated && "bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 border-purple-200/50",
                          isSelected
                            ? command.isAIGenerated
                              ? "bg-gradient-to-r from-purple-100 via-blue-100 to-indigo-100 border-purple-300 shadow-lg scale-[1.02]"
                              : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-lg scale-[1.02]"
                            : command.isAIGenerated
                              ? "hover:from-purple-75 hover:via-blue-75 hover:to-indigo-75 hover:border-purple-200 hover:shadow-md"
                              : "hover:bg-gray-50 hover:border-gray-200 hover:shadow-md"
                        )}
                        onClick={() => executeCommand(command)}
                      >
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <div className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 transition-colors",
                            command.isAIGenerated
                              ? "bg-gradient-to-br from-purple-500 to-blue-500 text-white"
                              : isSelected
                                ? "bg-blue-100 text-blue-600"
                                : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600"
                          )}>
                            <command.icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <p className={cn(
                                "font-semibold truncate text-base",
                                isSelected ? "text-blue-900" : command.isAIGenerated ? "text-purple-900" : "text-gray-900"
                              )}>
                                {command.title}
                              </p>
                              {command.isAIGenerated && (
                                <Badge variant="secondary" className="text-xs bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 border-purple-300">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  AI
                                </Badge>
                              )}
                              {command.workflow && (
                                <Badge variant="outline" className="text-xs bg-white/60">
                                  {command.workflow}
                                </Badge>
                              )}
                              {command.confidence && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                                  {Math.round(command.confidence * 100)}%
                                </Badge>
                              )}
                            </div>
                            <p className={cn(
                              "text-sm truncate leading-relaxed",
                              isSelected ? "text-blue-700" : command.isAIGenerated ? "text-purple-700" : "text-gray-600"
                            )}>
                              {command.description}
                            </p>
                            {command.reasoning && (
                              <p className="text-xs text-purple-600 italic truncate mt-1 bg-purple-50 px-2 py-1 rounded-md inline-block">
                                💡 {command.reasoning}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 flex-shrink-0">
                          {command.shortcut && (
                            <Badge variant="outline" className="text-xs font-mono bg-gray-100 text-gray-700 border-gray-300">
                              {command.shortcut}
                            </Badge>
                          )}
                          <ChevronRight className={cn(
                            "h-5 w-5 transition-all duration-150",
                            isSelected ? "opacity-100 text-blue-600 transform translate-x-1" : "opacity-0 group-hover:opacity-70 text-gray-400"
                          )} />
                        </div>
                      </div>
                    )
                  })}

                  {/* Enhanced Separator between categories */}
                  {categoryIndex < groupedCommands.length - 1 && (
                    <div className="my-4 mx-6">
                      <Separator className="bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enhanced Footer with shortcuts */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <span className="flex items-center space-x-2 text-xs text-gray-600">
                <div className="flex items-center justify-center w-5 h-5 rounded bg-gray-100">
                  <Keyboard className="h-3 w-3" />
                </div>
                <span className="font-medium">Navigate with ↑↓</span>
              </span>
              <span className="text-xs text-gray-600">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-700 font-mono">↵</kbd> to select
              </span>
              <span className="text-xs text-gray-600">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-700 font-mono">Esc</kbd> to close
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {isProcessingNL && (
                <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  <Brain className="h-4 w-4 animate-pulse" />
                  <span className="text-xs font-medium">AI analyzing...</span>
                </div>
              )}
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>Powered by</span>
                <div className="flex items-center space-x-1 text-blue-600">
                  <Sparkles className="h-3 w-3" />
                  <span className="font-medium">Smart AI</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
import type { Database } from './supabase';
import type { 
  Item, 
  ChatSession, 
  ChatMessage, 
  AgentConfig,
  TaskItem, 
  Folder
} from './types';

/**
 * Maps a database agent row to the client-side AgentConfig type
 */
export function mapAgentFromDB(agent: Database['public']['Tables']['agents']['Row']): AgentConfig {
  return {
    id: agent.id,
    name: agent.name,
    description: agent.description || undefined,
    avatarUrl: agent.avatar_url || undefined,
    instructions: agent.instructions,
    model: agent.model,
    tools: agent.tools,
    startingPrompts: agent.starting_prompts || [],
    tags: agent.tags || [],
    pinned: agent.pinned,
    createdAt: agent.created_at,
    updatedAt: agent.updated_at
  };
}

/**
 * Maps a client-side AgentConfig to the database insert format
 */
export function mapAgentToDB(agent: AgentConfig): Database['public']['Tables']['agents']['Insert'] {
  return {
    name: agent.name,
    description: agent.description || null,
    avatar_url: agent.avatarUrl || null,
    instructions: agent.instructions,
    model: agent.model,
    tools: agent.tools,
    starting_prompts: agent.startingPrompts || null,
    tags: agent.tags || null,
    pinned: agent.pinned || false,
    user_id: '' // This will be filled in by the hook
  };
}

/**
 * Maps a database chat session row to the client-side ChatSession type
 */
export function mapChatSessionFromDB(session: Database['public']['Tables']['chat_sessions']['Row']): Omit<ChatSession, 'messages'> {
  return {
    id: session.id,
    title: session.title,
    tags: session.tags || [],
    pinned: session.pinned,
    createdAt: session.created_at,
    updatedAt: session.updated_at
  };
}

/**
 * Maps a client-side ChatSession to the database insert format
 */
export function mapChatSessionToDB(session: Omit<ChatSession, 'messages'>): Database['public']['Tables']['chat_sessions']['Insert'] {
  return {
    title: session.title,
    tags: session.tags || null,
    pinned: session.pinned || false,
    user_id: '' // This will be filled in by the hook
  };
}

/**
 * Maps a database chat message row to the client-side ChatMessage type
 */
export function mapChatMessageFromDB(message: Database['public']['Tables']['chat_messages']['Row']): ChatMessage {
  return {
    id: message.id,
    role: message.role as 'user' | 'assistant' | 'system',
    content: message.content,
    timestamp: message.created_at,
    imageUrl: message.image_url || undefined,
    whiteboardSketch: message.whiteboard_sketch || undefined
  };
}

/**
 * Maps a client-side ChatMessage to the database insert format
 */
export function mapChatMessageToDB(message: ChatMessage, sessionId: string): Database['public']['Tables']['chat_messages']['Insert'] {
  return {
    session_id: sessionId,
    role: message.role,
    content: message.content,
    image_url: message.imageUrl || null,
    whiteboard_sketch: message.whiteboardSketch || null,
    user_id: '' // This will be filled in by the hook
  };
}

/**
 * Maps a database note row to the client-side Item type (note)
 */
export function mapNoteFromDB(note: Database['public']['Tables']['notes']['Row']): Item {
  return {
    id: note.id,
    name: note.title,
    type: 'note',
    content: note.content || undefined,
    imageUrl: note.image_url || undefined,
    tags: note.tags || [],
    createdAt: note.created_at,
    updatedAt: note.updated_at
  };
}

/**
 * Maps a client-side Item (note) to the database insert format
 */
export function mapNoteToDB(note: Item): Database['public']['Tables']['notes']['Insert'] {
  if (note.type !== 'note') {
    throw new Error('Item is not a note');
  }
  
  return {
    title: note.name,
    content: note.content || null,
    image_url: note.imageUrl || null,
    tags: note.tags || null,
    user_id: '' // This will be filled in by the hook
  };
}

/**
 * Maps a database task row to the client-side TaskItem type
 */
export function mapTaskFromDB(task: Database['public']['Tables']['tasks']['Row']): TaskItem {
  return {
    id: task.id,
    title: task.title,
    description: task.description || undefined,
    status: task.status as 'todo' | 'inprogress' | 'done',
    priority: task.priority as 'low' | 'medium' | 'high' | undefined,
    dueDate: task.due_date || undefined,
    tags: task.tags || [],
    createdAt: task.created_at,
    updatedAt: task.updated_at
  };
}

/**
 * Maps a client-side TaskItem to the database insert format
 */
export function mapTaskToDB(task: TaskItem): Database['public']['Tables']['tasks']['Insert'] {
  return {
    title: task.title,
    description: task.description || null,
    status: task.status,
    priority: task.priority || null,
    due_date: task.dueDate || null,
    tags: task.tags || null,
    user_id: '' // This will be filled in by the hook
  };
}

/**
 * Maps a database whiteboard row to the client-side Item type (whiteboard)
 */
export function mapWhiteboardFromDB(whiteboard: Database['public']['Tables']['whiteboards']['Row']): Item {
  return {
    id: whiteboard.id,
    name: whiteboard.name,
    type: 'whiteboard',
    content: whiteboard.content || undefined,
    imageUrl: whiteboard.image_url || undefined,
    tags: whiteboard.tags || [],
    createdAt: whiteboard.created_at,
    updatedAt: whiteboard.updated_at
  };
}

/**
 * Maps a client-side Item (whiteboard) to the database insert format
 */
export function mapWhiteboardToDB(whiteboard: Item): Database['public']['Tables']['whiteboards']['Insert'] {
  if (whiteboard.type !== 'whiteboard') {
    throw new Error('Item is not a whiteboard');
  }
  
  return {
    name: whiteboard.name,
    content: whiteboard.content || null,
    image_url: whiteboard.imageUrl || null,
    tags: whiteboard.tags || null,
    user_id: '' // This will be filled in by the hook
  };
}

/**
 * Maps a database folder row to the client-side Folder type
 * Note: This requires additional processing for nested children and items
 */
export function mapFolderFromDB(folder: Database['public']['Tables']['folders']['Row']): Partial<Folder> {
  return {
    id: folder.id,
    name: folder.name,
    // Children and items need to be populated separately
  };
} 
# LibreOllama Setup Guide

## Prerequisites

1. **Node.js 18+** and npm
2. **Ollama** installed locally ([Download](https://ollama.ai))
3. **Supabase account** ([Sign up](https://supabase.com))

## Quick Start

### 1. Environment Configuration

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Model Configuration (Optional)
GEMINI_API_KEY=your_gemini_api_key_optional
BRAVE_SEARCH_API_KEY=your_brave_search_api_key_optional

# Ollama Configuration (Default: local)
OLLAMA_BASE_URL=http://127.0.0.1:11434
```

### 2. Supabase Setup

1. Create a new Supabase project
2. Run the database schema from `supabase/` directory
3. Enable Row Level Security (RLS) for all tables
4. Copy your project URL and anon key to `.env.local`

### 3. Ollama Setup

1. Install Ollama: `curl -fsSL https://ollama.ai/install.sh | sh`
2. Pull required models:
   ```bash
   ollama pull mistral-nemo:latest
   ollama pull mistral:7b
   ollama pull qwen3:8b
   ollama pull gemma3:latest
   ```
3. Start Ollama service: `ollama serve`

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:9004` to access the application.

## Database Schema

The application uses the following main tables:
- `chat_sessions` - Chat conversation metadata
- `chat_messages` - Individual chat messages
- `agents` - AI agent configurations
- `notes` - User notes and documents
- `tasks` - Task management
- `whiteboards` - Whiteboard content
- `settings` - User preferences
- `n8n_connections` - n8n workflow integrations
- `mcp_servers` - MCP server configurations

## Features Status

### ✅ Implemented
- Authentication system
- Real-time chat with Ollama
- Agent builder and management
- Notes with rich text editing
- Task management (Kanban)
- Calendar interface
- Settings management
- n8n integration UI
- MCP servers UI

### 🚧 In Progress
- File upload and RAG
- Collaborative editing
- Whiteboard drawing
- Advanced agent tools

### 📋 Planned
- Desktop app (Electron)
- Mobile responsiveness
- Advanced workflow automation
- Plugin system

## Development Commands

```bash
# Development server
npm run dev

# Type checking
npm run typecheck

# Build for production
npm run build

# Start production server
npm start

# Genkit development
npm run genkit:dev
```

## Troubleshooting

### Ollama Connection Issues
- Ensure Ollama is running: `ollama serve`
- Check if models are available: `ollama list`
- Verify OLLAMA_BASE_URL in `.env.local`

### Supabase Issues
- Verify environment variables
- Check RLS policies are enabled
- Ensure database schema is up to date

### TypeScript Errors
- Run `npm run typecheck` to identify issues
- Ensure all dependencies are installed
- Check for missing type definitions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run type checking and tests
5. Submit a pull request

## Support

For issues and questions:
- Check the troubleshooting section
- Review the implementation plan in `src/ai/IMPLEMENTATION_PLAN.MD`
- Open an issue on GitHub 
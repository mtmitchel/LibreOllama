
# LibreOllama Dashboard - Your Intelligent Productivity Hub

This is a Next.js based application designed as an intelligent productivity hub, leveraging local Ollama models, a flexible agent builder, workflow automation via n8n, and integrations with external tools through Model Context Protocol (MCP) servers.

## Key Features

### 1. Dashboard
*   **Customizable Widgets**: Show, hide, and arrange predefined widgets.
    *   Tasks Progress
    *   Calendar Overview
    *   Gmail Snippets (mock)
    *   Time Blocking Interface (mock)
*   **Custom Widget Creation (Mock)**: UI to simulate adding new custom widgets to the dashboard.
*   **Dismissible Header Card**: Welcome card can be hidden.

### 2. Chat
*   **Chat Sessions**: Manage multiple chat conversations.
    *   Create new chat sessions.
    *   Select active sessions to view messages.
*   **Rich Interactions**:
    *   Send and receive text messages.
    *   Upload and display images within chats.
    *   Embed whiteboard sketches (from mock whiteboard tool) in messages.
*   **Chat Management**:
    *   Pin important chat sessions to the top of the list.
    *   Export chat sessions (mock functionality - logs to console).
    *   Delete chat sessions.
*   **Organization**:
    *   Tag chat sessions for better categorization and search.
    *   Resizable two-panel layout for chat list and active chat interface.

### 3. Notes
*   **Note Management**: Create, view, edit, and delete notes.
*   **Content Features**:
    *   Embed images within notes.
    *   Rich Text Editor Toolbar (UI placeholder for bold, italics, lists, etc. - full functionality requires integrating a rich text library).
    *   Basic URL link rendering.
*   **Organization**:
    *   Tag notes for categorization and search.
    *   Mock export functionality (logs to console).

### 4. Whiteboards
*   **Whiteboard Management**: Create, view, edit, and delete whiteboards.
*   **Mock Editor**:
    *   A visual toolbar with common whiteboard tools (Pencil, Eraser, Line, Arrow, Rectangle, Circle, Text, Add Image, Add Link, Color Palette, Undo, Redo). *Note: Drawing functionality is a UI mock.*
*   **Organization**:
    *   Tag whiteboards for categorization and search.
    *   Mock export functionality (logs to console).

### 5. Calendar
*   **Google Calendar-like Interface**:
    *   Switch between Day, Week, and Month views.
    *   Event creation, editing, and deletion via a dedicated modal with custom date/time pickers.
    *   Select which calendars' events are displayed (mock calendar sources).
*   **Layout**:
    *   Collapsible left sidebar for calendar options (mini calendar, calendar list, event list).
    *   Collapsible right sidebar for unscheduled tasks.
*   **Time Blocking**: Drag and drop tasks from the task list onto the Day or Week view to schedule them as events.

### 6. Tasks
*   **Kanban Board View**: Manage tasks in "To Do," "In Progress," and "Done" columns.
*   **Task Management**:
    *   Drag and drop tasks between columns to update their status.
    *   Display task details like priority, due date, and description.
*   **Organization**:
    *   Tag tasks for categorization.
*   **Dismissible Header Card**: Introductory card can be hidden.

### 7. AI Agents
*   **Agent Hub**: View a list of created AI agents.
*   **Advanced Agent Builder**:
    *   Configure agent properties: Name, Description, Avatar (placeholder), Instructions (System Prompt), Language Model selection.
    *   **Tool Selection**: Choose from predefined tools or add custom tools (UI mock for custom tool definition).
    *   Define "Starting Prompts" to guide user interaction.
    *   "Knowledge (RAG)" section as a UI placeholder for future file uploads.
*   **Agent Management**:
    *   Create, edit, and delete agent configurations (mock data persistence).
    *   Pin/unpin important agents to sort them to the top of the list.
*   **Agent Testing**:
    *   Test agents using a modal that connects to a Genkit flow (`researchAssistantFlow`).
    *   The test utilizes the agent's instructions and starting prompts defined in the builder form.
    *   The backend flow currently uses a mock "Web Search" tool.
*   **Dismissible Header Card**: Introductory card can be hidden.

### 8. n8n Workflow Integration
*   **Dedicated Page**: UI for managing n8n connections and workflows.
*   **Connection Setup (Mock)**:
    *   Input for n8n instance URL.
    *   Dropdown for selecting Authentication Method (None, API Key, Basic Auth, OAuth2 mock).
    *   Conditional display of auth-specific input fields.
*   **Workflow Management (Mock)**:
    *   Display a list of mock n8n workflows with details like status, trigger type, and last run time.
    *   Search/filter workflows.
    *   Mock action buttons for workflows (toggle active, run, view logs).
*   **Dismissible Header Card**: Introductory card can be hidden.

### 9. MCP (Model Context Protocol) Servers
*   **Placeholder Page**: A dedicated page for MCP server management.
*   **Settings Integration**: A placeholder section in Settings > Integrations for configuring MCP servers.
*   **Navigation**: Entry in the main sidebar.
*   **Dismissible Header Card**: Introductory card can be hidden.

### 10. Settings
*   **Comprehensive Configuration Panel**:
    *   **General**: Basic app preferences.
    *   **Account**: User account details.
    *   **Integrations**:
        *   Mock Google Services connection status (Calendar, Drive, Tasks, Gmail).
        *   Mock Ollama Configuration (API URL, Test Connection, Managed Models with mock delete option).
        *   Placeholder for MCP Server Connections.
        *   Placeholders for configuring External LLM API Keys (OpenAI, Anthropic, Gemini, OpenRouter).
    *   **Appearance**: Theme selection (mock), app icon upload (placeholder).
    *   **Notifications**: Notification preferences (mock).
    *   **Data & Privacy**: Data export/import, cache clearing (placeholders).
    *   **About**: Application information.

### 11. General UI/UX
*   **Collapsible Main Sidebar**: Includes a folder tree for organizing items.
*   **Collapsible Right "Features Panel"**: Provides quick access to the Agent Builder and n8n Workflow Integration.
*   **Toast Notifications**: For user feedback on actions like saving, deleting, pinning.
*   **Tagging System**: Implemented across Notes, Chats, Whiteboards, Tasks, and Agents for flexible organization.
*   **Responsive Design Considerations**: Layout adjustments for different screen sizes.
*   **Sentence Case**: UI text generally follows sentence case for headers and buttons.

## Style Guidelines

The visual design of LibreOllama Dashboard aims for a clean, modern, and accessible interface. Key principles include:

*   **Color Palette**:
    *   **Primary**: Slate Blue (`hsl(248, 53%, 58%)` - `#6A5ACD`) - Used for key actions, active states, and branding accents.
    *   **Background**: Light Gray (`hsl(220, 17%, 95%)` - `#F0F2F5`) for the light theme, and a corresponding dark gray for the dark theme (`hsl(240, 10%, 3.9%)`).
    *   **Accent**: Soft Lavender (`hsl(240, 67%, 94%)` - `#E6E6FA`) for subtle highlights and secondary information backgrounds in the light theme. The dark theme uses a darker, desaturated lavender/blue (`hsl(240, 15%, 20%)`).
    *   These colors are defined as HSL CSS variables in `src/app/globals.css` and used by ShadCN UI components.
*   **Typography**:
    *   The application currently uses system default sans-serif fonts for broad compatibility and readability. (Previous attempts to use custom Geist fonts were removed due to loading issues and can be revisited later).
    *   Text casing primarily follows **Sentence case** for headers, titles, and button copy, enhancing readability.
*   **Component Styling**:
    *   Leverages ShadCN UI components for a consistent look and feel.
    *   Emphasizes rounded corners, subtle shadows, and clear visual hierarchy.
*   **Iconography**:
    *   Uses `lucide-react` for a consistent and modern set of icons.

## Getting Started

This is a Next.js project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

First, install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) (or your configured port) with your browser to see the result.

You can start by exploring the different sections from the sidebar. The "AI Agents" section and its builder, along with the "Chat" and "Calendar" views, showcase some of the most interactive features.

## Current State
This application is currently a UI/UX prototype with mock data and some foundational client-side logic. Backend integrations for AI model calls (beyond the mocked Genkit flow), n8n connections, Google APIs, MCP servers, and external LLM APIs would need to be implemented for full functionality. See `src/ai/IMPLEMENTATION_PLAN.MD` for a detailed development roadmap.
```
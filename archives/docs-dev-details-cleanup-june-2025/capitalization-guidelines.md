# Capitalization Guidelines - LibreOllama Design System

## Overview

LibreOllama uses **sentence case** for all UI text elements to create a more conversational, accessible, and modern user experience. This document outlines our capitalization standards and implementation guidelines.

## The Rule

> **Capitalize only the first word of every string and any proper nouns. Everything else stays lowercase.**

This single rule covers buttons, menu items, form labels, dialog titles, empty‑state headlines—everything. When in doubt, default to lowercase.

## Why Sentence Case Works Well in Product UIs

- **Faster scanning** – Mixed ascenders and descenders create distinct word shapes that the eye catches quickly
- **Conversational tone** – Mimics normal sentences, so microcopy feels friendlier and less formal
- **Reduced visual noise** – Lowercase letters take up less vertical space, so dense dashboards and mobile views breathe more easily
- **Accessibility** – Some users with dyslexia or other reading difficulties find sentence case easier to parse
- **Platform alignment** – Both Material Design and Apple's Human Interface Guidelines lean on sentence case for UI elements, so cross‑platform products feel more native

## Practical Guidelines

### 1. Headings and Sub-headings

✅ **Correct:**
- "Project overview"
- "Billing settings"
- "Chat history"
- "Agent configuration"

❌ **Incorrect:**
- "Project Overview"
- "Billing Settings"
- "Chat History"
- "Agent Configuration"

### 2. Buttons and Controls

✅ **Correct:**
- "Save changes"
- "Start free trial"
- "Run analysis"
- "Create note"
- "Export data"

❌ **Incorrect:**
- "Save Changes"
- "Start Free Trial"
- "Run Analysis"
- "Create Note"
- "Export Data"

### 3. System Messages

✅ **Correct:**
- Success: "Profile updated."
- Error: "Something went wrong. Try again later."
- Warning: "This action cannot be undone."

❌ **Incorrect:**
- Success: "Profile Updated."
- Error: "Something Went Wrong. Try Again Later."
- Warning: "This Action Cannot Be Undone."

### 4. Lists and Dropdown Items

✅ **Correct:**
- "New file"
- "Export as PDF"
- "Sign out"
- "Delete folder"

❌ **Incorrect:**
- "New File"
- "Export As PDF"
- "Sign Out"
- "Delete Folder"

### 5. Form Labels and Placeholders

✅ **Correct:**
- "Enter your email address"
- "Choose a password"
- "Select workspace"

❌ **Incorrect:**
- "Enter Your Email Address"
- "Choose A Password"
- "Select Workspace"

### 6. Navigation and Menu Items

✅ **Correct:**
- "Dashboard"
- "Chat sessions"
- "Agent management"
- "Settings"

❌ **Incorrect:**
- "Chat Sessions"
- "Agent Management"

### 7. Empty States and Onboarding

✅ **Correct:**
- "No messages yet"
- "Start your first conversation"
- "Welcome to LibreOllama"

❌ **Incorrect:**
- "No Messages Yet"
- "Start Your First Conversation"

## Special Cases and Exceptions

### Proper Nouns Stay Capitalized

✅ **Always capitalize:**
- "Connect to GitHub"
- "Powered by LibreOllama"
- "Import from Google Drive"
- "OpenAI integration"
- "Microsoft Teams"

### Abbreviations and Initialisms

✅ **Keep standard capitalization:**
- "API configuration"
- "CPU usage"
- "AI assistant"
- "PDF export"
- "URL validation"

### Punctuation Guidelines

✅ **After a colon in a label, keep the next word lowercase:**
- "Status: pending"
- "Type: folder"
- "Priority: high"

✅ **In question or confirmation dialogs:**
- "Delete this folder?"
- "Save changes before closing?"
- "Are you sure you want to continue?"

## Implementation Guidelines

### For Developers

1. **String Constants**: Update all hardcoded strings in components
2. **Content Strategy Files**: Update centralized content files
3. **Placeholder Text**: Ensure form placeholders follow sentence case
4. **Error Messages**: Update all error, success, and warning messages
5. **Button Labels**: Convert all button text to sentence case

### For Designers

1. **Figma Components**: Update text styles to default to sentence case
2. **Design Tokens**: Ensure typography tokens reflect sentence case standards
3. **Component Libraries**: Lock capitalization in reusable components
4. **Mockups**: Use sentence case in all new designs

### Quality Assurance

1. **Automated Linting**: Implement regex checks for Title Case patterns
2. **Content Audits**: Regular reviews of UI text consistency
3. **Testing Checklists**: Include capitalization checks in QA processes

## Migration Strategy

### Phase 1: Core Components
- Update button components and their default text
- Fix navigation menu items
- Update dialog titles and descriptions

### Phase 2: Content Strategy
- Update centralized content files
- Fix error messages and system notifications
- Update empty state messages

### Phase 3: Feature-Specific Updates
- Update chat interface text
- Fix agent management UI text
- Update settings and configuration text

### Phase 4: Documentation and Guidelines
- Update style guides
- Create linting rules
- Establish review processes

## Automated Detection

Use this regex pattern to find potential Title Case violations:

```regex
"[A-Z][a-z]+ [A-Z][a-z]+"
```

This will help identify strings with two adjacent capitalized words that may need conversion to sentence case.

## Examples from LibreOllama

### Before (Title Case)
```typescript
// ❌ Title Case Examples
"Create New Note"
"Save Changes"
"Export Data"
"Delete Folder"
"Start Conversation"
"Template Management"
"Smart Content Assistant"
"Google Calendar API Service"
```

### After (Sentence Case)
```typescript
// ✅ Sentence Case Examples
"Create new note"
"Save changes"
"Export data"
"Delete folder"
"Start conversation"
"Template management"
"Smart content assistant"
"Google Calendar API service"
```

## Conclusion

By consistently applying sentence case across LibreOllama, we create a more approachable, accessible, and modern user experience. This standard should be applied to all new features and gradually migrated across existing components.

---

**Last Updated:** December 2024  
**Version:** 1.0  
**Status:** Active
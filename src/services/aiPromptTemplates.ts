import type { AIAction } from '../components/ai/AIWritingToolsMenu';
import type { LLMProvider } from './llmProviders';

// Model-specific prompt templates for better results
export const MODEL_SPECIFIC_PROMPTS: Record<string, Record<AIAction, string>> = {
  // Gemma models need very explicit instructions
  'gemma': {
    'create-list': `TASK: Convert to bullet points.
RULES:
- Output ONLY bullet points
- Start each line with "• "
- NO paragraphs
- NO original text
- Extract main ideas only

INPUT TEXT: {text}

OUTPUT (bullet points only):`,
    
    'key-points': `TASK: Extract key points as bullets.
RULES:
- Output ONLY bullet points
- Start each line with "• "
- NO paragraphs
- Summarize main ideas
- Maximum 5-7 points

INPUT TEXT: {text}

KEY POINTS (bullets only):`,
    
    'summarize': `TASK: Summarize in 2-3 sentences.
RULES:
- Write 2-3 sentences maximum
- Be concise
- Cover main points only
- NO original text

INPUT TEXT: {text}

SUMMARY:`,
    
    'rewrite-professional': `TASK: Rewrite professionally.
RULES:
- Use formal language
- Business appropriate
- Clear and direct
- NO original text

INPUT TEXT: {text}

PROFESSIONAL VERSION:`,
    
    'rewrite-friendly': `TASK: Rewrite casually.
RULES:
- Use friendly tone
- Conversational style
- Warm and approachable
- NO original text

INPUT TEXT: {text}

FRIENDLY VERSION:`,
    
    'rewrite-concise': `TASK: Make shorter.
RULES:
- Remove unnecessary words
- Keep main meaning
- Be brief
- NO original text

INPUT TEXT: {text}

CONCISE VERSION:`,
    
    'rewrite-expanded': `TASK: Add more detail.
RULES:
- Elaborate on points
- Add examples
- Expand ideas
- NO original text

INPUT TEXT: {text}

EXPANDED VERSION:`,
    
    'proofread': `TASK: Fix errors.
RULES:
- Correct spelling
- Fix grammar
- Improve punctuation
- Return corrected text

INPUT TEXT: {text}

CORRECTED TEXT:`,
    
    'translate': `TASK: Translate to {language}.
RULES:
- Accurate translation
- Natural phrasing
- NO original text

INPUT TEXT: {text}

TRANSLATION:`,
    
    'explain': `TASK: Explain simply.
RULES:
- Use simple words
- Clear explanation
- Easy to understand
- NO original text

INPUT TEXT: {text}

EXPLANATION:`,
    
    'create-task': '',
    'create-note': '',
    'ask-custom': '',
    'ask-ai': ''
  },
  
  // Default prompts for other models
  'default': {
    'create-list': `Convert the following text into a bulleted list. Each main point should be on its own line starting with "• ".

Text: {text}

Bulleted list:`,
    
    'key-points': `Extract the key points from this text and present them as a bulleted list starting with "• ".

Text: {text}

Key points:`,
    
    'summarize': `Summarize this text in 2-3 sentences:

{text}`,
    
    'rewrite-professional': `Rewrite this text in a professional tone:

{text}`,
    
    'rewrite-friendly': `Rewrite this text in a friendly, casual tone:

{text}`,
    
    'rewrite-concise': `Rewrite this text to be more concise:

{text}`,
    
    'rewrite-expanded': `Expand this text with more detail:

{text}`,
    
    'proofread': `Proofread and correct any errors in this text:

{text}`,
    
    'translate': `Translate this text to {language}:

{text}`,
    
    'explain': `Explain this text in simple terms:

{text}`,
    
    'create-task': '',
    'create-note': '',
    'ask-custom': '',
    'ask-ai': ''
  }
};

export function getPromptTemplate(action: AIAction, model: string, text: string, options?: { language?: string }): string {
  // Determine which template set to use based on model name
  let templateSet = 'default';
  
  if (model.toLowerCase().includes('gemma')) {
    templateSet = 'gemma';
  }
  
  const templates = MODEL_SPECIFIC_PROMPTS[templateSet] || MODEL_SPECIFIC_PROMPTS['default'];
  let template = templates[action] || '';
  
  // Replace placeholders
  template = template.replace('{text}', text);
  if (options?.language) {
    template = template.replace('{language}', options.language);
  }
  
  return template;
}

// System prompts optimized for different models
export const MODEL_SPECIFIC_SYSTEM_PROMPTS: Record<string, string> = {
  'gemma-list': 'You are a list formatter. Output ONLY bullet points starting with "• ". NO other text.',
  'gemma-default': 'Follow the task instructions exactly. Output ONLY what is requested.',
  'default': 'You are a helpful AI assistant. Follow the user\'s instructions precisely.'
};
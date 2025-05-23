'use server';
/**
 * @fileOverview A Research Assistant AI flow using Genkit.
 *
 * - askResearchAssistant - A function that takes a user query and returns a research summary.
 * - ResearchAssistantInput - The input type for the askResearchAssistant function.
 * - ResearchAssistantOutput - The return type for the askResearchAssistant function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { webSearchTool } from '@/ai/tools/web-search-tool';
import { 
  FULL_COMPATIBILITY_MODELS,
  PARTIAL_COMPATIBILITY_MODELS,
  NO_COMPATIBILITY_MODELS,
  DEFAULT_TOOL_MODEL 
} from '@/ai/model-compatibility';

// Input and output schema definitions (not exported)
const ResearchAssistantInputSchema = z.object({
  query: z.string().describe('The research query or question from the user.'),
  agentInstructions: z.string().optional().describe('Specific instructions for the agent persona and behavior for this request.'),
  model: z.string().optional().describe('The model to use for this request. Defaults to ollama/qwen3:8b.'),
});
export type ResearchAssistantInput = z.infer<
  typeof ResearchAssistantInputSchema
>;

const ResearchAssistantOutputSchema = z.object({
  summary: z
    .string()
    .describe('A concise summary of the research findings.'),
});
export type ResearchAssistantOutput = z.infer<
  typeof ResearchAssistantOutputSchema
>;

// Define the Genkit flow (non-exported)
const researchAssistantFlow = ai.defineFlow(
  {
    name: 'researchAssistantFlow',
    inputSchema: ResearchAssistantInputSchema,
    outputSchema: ResearchAssistantOutputSchema,
  },
  async (input: ResearchAssistantInput): Promise<ResearchAssistantOutput> => {
    // Use the provided model or default to ollama/qwen3:8b
    let currentModel = input.model || 'ollama/qwen3:8b';
    let usedFallback = false; // Tracks if the primary fallback to DEFAULT_TOOL_MODEL has been used
    let compatibilityLevel = 'full'; // Assume full compatibility by default
    let searchResults = '';
    
    // Determine compatibility level based on model lists
    if (NO_COMPATIBILITY_MODELS.includes(currentModel)) {
      console.log(`[researchAssistantFlow] Model ${currentModel} doesn't support tools. Will perform search and include results directly.`);
      compatibilityLevel = 'none';
    } else if (PARTIAL_COMPATIBILITY_MODELS.includes(currentModel)) {
      console.log(`[researchAssistantFlow] Model ${currentModel} has limited tool handling capability. Will pre-fetch search results as a fallback.`);
      compatibilityLevel = 'partial';
    } else if (!FULL_COMPATIBILITY_MODELS.includes(currentModel)) {
      console.log(`[researchAssistantFlow] Model ${currentModel} is untested with tools. Will pre-fetch search results as a precaution.`);
      compatibilityLevel = 'unknown';
    }
    // If it IS in FULL_COMPATIBILITY_MODELS, compatibilityLevel remains 'full'.

    // For models where we don't solely rely on tool usage ('none', 'partial', 'unknown'),
    // manually run the web search first.
    if (compatibilityLevel !== 'full') {
      try {
        console.log(`[researchAssistantFlow] Pre-fetching search results for query: "${input.query}" (model: ${currentModel}, compatibility: ${compatibilityLevel})`);
        const searchResponse = await webSearchTool({ searchQuery: input.query });
        searchResults = searchResponse.searchResults;
        console.log(`[researchAssistantFlow] Successfully pre-fetched search results (${searchResults.length} characters)`);
      } catch (error) {
        console.error('[researchAssistantFlow] Error pre-fetching search results:', error);
        // We'll continue even if the search fails, the model will just have less context
        searchResults = `Unable to retrieve search results due to an error: ${error}`;
      }
    }

    // Adjust prompt and tools based on model compatibility
    let combinedPromptText = '';
    let finalToolsToProvide: any[] = []; // Default to no tools

    if (compatibilityLevel === 'none' || compatibilityLevel === 'partial') {
      // For models with NO or PARTIAL tool support, we pre-fetched search results
      // and include them directly in the prompt. No tools are provided to the model.
      console.log(`[researchAssistantFlow] Strategy for ${currentModel} (compatibility: ${compatibilityLevel}): Provide pre-fetched search results directly in prompt. No tools.`);
      combinedPromptText = `You are a helpful AI research assistant.
User's research query: "${input.query}"
${input.agentInstructions ? `Agent Instructions: ${input.agentInstructions}\n` : ''}

I've performed a web search for this query and found the following information:

${searchResults ? searchResults : "No search results available."}

Please provide a clear, well-organized summary that directly answers the user's query based on these search results. Focus on the most relevant information.

Format your response using these guidelines:
1. Start with a clear title in bold (**Title**).
2. Organize information in logical sections with bold headers.
3. Use bullet points (•) consistently for lists, not mixing different markers.
4. Maintain clean formatting without excessive blank lines.
5. Keep your response factual and concise.
6. Avoid unnecessary markdown formatting like code blocks or tables.`;
      finalToolsToProvide = [];
    } else if (compatibilityLevel === 'unknown') {
      // For UNKNOWN models, we pre-fetched search results as a precaution.
      // We provide these results in the prompt AND still provide the tool, encouraging its use.
      console.log(`[researchAssistantFlow] Strategy for ${currentModel} (compatibility: ${compatibilityLevel}): Provide pre-fetched search results in prompt AND provide tool.`);
      combinedPromptText = `You are a helpful AI research assistant.
User's research query: "${input.query}"
${input.agentInstructions ? `Agent Instructions: ${input.agentInstructions}\n` : ''}

To help research this topic, I'll use the webSearchTool. First, I'll search for: webSearchTool({ searchQuery: "${input.query}" })
To answer the query, you are encouraged to use the webSearchTool to find the most relevant and up-to-date information. The webSearchTool accepts a searchQuery parameter.

After receiving search results, I'll analyze them carefully and provide a clear, well-organized summary that directly addresses the query. I'll focus on key information from the search results.
For your convenience, I have also performed an initial web search and found the following information. You can use this as a starting point or to supplement the information you find with the tool:

${searchResults ? searchResults : "No initial search results available."}

Please synthesize all available information to provide a comprehensive answer.
Format your response for optimal readability:
1. Use bold text (**Title**) for section headers.
2. Organize information in sections with proper spacing.
3. Use bullet points (•) consistently for lists, not mixing with other markers.
4. Maintain clean formatting without excessive blank lines.
5. Avoid unnecessary markdown formatting like code blocks or tables.
6. Keep your response factual and concise.

Now, please answer the user's query, using the webSearchTool as needed and considering the pre-fetched information.`;
      finalToolsToProvide = [webSearchTool];
    } else { // compatibilityLevel === 'full'
      // For FULLY compatible models, we expect them to use the tool.
      // No pre-fetched results are injected into this primary prompt.
      console.log(`[researchAssistantFlow] Strategy for ${currentModel} (compatibility: ${compatibilityLevel}): Expect model to use tool. No pre-fetched results in initial prompt.`);
      combinedPromptText = `You are a helpful AI research assistant.
User's research query: "${input.query}"
${input.agentInstructions ? `Agent Instructions: ${input.agentInstructions}\n` : ''}

To answer the query, you MUST use the webSearchTool to find relevant information. The webSearchTool accepts a searchQuery parameter.

Format your response for optimal readability:
1. Use bold text (**Title**) for section headers.
2. Organize information in logical sections with proper spacing.
3. Use bullet points (•) consistently for lists, not mixing different markers.
4. Maintain clean formatting without excessive blank lines. 
5. Avoid unnecessary markdown formatting like code blocks or tables.
6. Keep your response factual and concise.

Now, please answer the user's query by using the webSearchTool first, and then synthesizing the information.`;
      finalToolsToProvide = [webSearchTool];
    }

    const messages: Array<{role: "user" | "model" | "system" | "tool", content: Array<{text: string}>}> = [
      { role: "user", content: [{ text: combinedPromptText }] }
    ];

    console.log(`[researchAssistantFlow] Using model ${currentModel}. First 300 chars of prompt:`, combinedPromptText.substring(0, 300));

    // Get the research information by calling the model
    const result = await ai.generate({
      model: currentModel,
      messages: messages,
      tools: finalToolsToProvide,
      // No JSON schema constraint - let the model respond naturally
    });

    // For debugging purposes only - avoid in production as it can be very large
    console.log(`[researchAssistantFlow] Raw model response structure:`, 
      JSON.stringify({
        hasMessage: Boolean(result.message),
        hasCandidates: Boolean((result as any).candidates),
        candidatesCount: (result as any).candidates?.length || 0
      }, null, 2)
    );

    // Extract the model's text response, ignoring any special formatting
    let modelText = "";
    
    // Try different response structures based on what we've observed from different models
    if ((result as any).candidates && Array.isArray((result as any).candidates) && (result as any).candidates.length > 0) {
      const lastCandidate = (result as any).candidates[(result as any).candidates.length - 1];
      
      // Try to extract text from the candidate's message content
      if (lastCandidate.message?.content) {
        for (const part of lastCandidate.message.content) {
          if (part.text) {
            modelText += part.text;
          }
        }
      }
    }

    // Also check the direct message structure sometimes seen with Ollama models
    if (!modelText && result.message?.content) {
      for (const part of result.message.content) {
        if (part.text) {
          modelText += part.text;
        }
      }
    }

    // Check if we got any meaningful response
    const hasGreeting = Boolean(modelText.match(/^(hello|hi|greetings|sure|i'll help you|let me|how can i assist)/i));
    const hasThinking = modelText.includes("<think>");
    const isEmpty = !modelText || modelText.trim().length === 0;
    const CODE_LIKE_PATTERNS = /^(class\s|def\s|import\s|const\s|function\s|public\sclass|static\svoid|\/\/|#|\*\*\*|\*\s-|```[a-z]*\n)/i;
    const isCodeLikeResponse = CODE_LIKE_PATTERNS.test(modelText.trim().substring(0, 200)); // Check first 200 chars
    
    // Detect generic non-answer responses that don't address the query
    const GENERIC_NON_ANSWER_PATTERNS = /how can (I|i) assist you|haven't provided any specific|I'd be happy to help|please provide more|what specific information|what would you like to know|I'm here to help|Could you please|let me know what you need|send an empty message/i;
    const isGenericNonAnswer = GENERIC_NON_ANSWER_PATTERNS.test(modelText.trim()) && input.query.trim().length > 10;
    
    // Additional check for responses that are too short relative to the query
    const isTooShortResponse = modelText.trim().length < 100 && input.query.trim().length > 15 && !modelText.includes("Error") && !modelText.includes("sorry");

    if (isEmpty || (hasGreeting && hasThinking) || isCodeLikeResponse || isGenericNonAnswer || isTooShortResponse) {
      if (isCodeLikeResponse) {
        console.error(`[researchAssistantFlow] Model returned a code-like response. Details: ${modelText.substring(0,100)}`);
      } else if (isGenericNonAnswer) {
        console.error(`[researchAssistantFlow] Model returned a generic non-answer despite clear query. Query: "${input.query}", Response: ${modelText.substring(0,100)}`);
      } else if (isTooShortResponse) {
        console.error(`[researchAssistantFlow] Model returned a suspiciously short response (${modelText.length} chars) for query: "${input.query}"`);
      } else {
        console.error("[researchAssistantFlow] Model returned generic greeting or thinking text instead of search results analysis");
      }
      
      // If we haven't used fallback yet, try the specified fallback model
      if (!usedFallback) {
        console.log(`[researchAssistantFlow] First fallback to ${DEFAULT_TOOL_MODEL} after detecting unhelpful response`);
        
        // Create new input with the fallback model
        const fallbackInput = {
          ...input,
          model: DEFAULT_TOOL_MODEL,
          agentInstructions: (input.agentInstructions || '') + '\nNote: This response is using a fallback model because the originally selected model had issues processing the query.'
        };
        
        // Recursively call this function with the new input
        usedFallback = true;
        return await researchAssistantFlow(fallbackInput);
      }
      // If fallback model also failed, try with a direct search and summarization approach
      else {
        console.log(`[researchAssistantFlow] Fallback model also failed. Using manual search and curation approach.`);
        
        // Use existing searchResults if populated (e.g., from non-'full' compatibility models or initial failed attempt),
        // otherwise, perform a new search.
        let finalSearchResults = searchResults;
        if (!finalSearchResults) {
          try {
            console.log(`[researchAssistantFlow] Performing search for final fallback. Query: "${input.query}"`);
            const searchResponse = await webSearchTool({ searchQuery: input.query });
            finalSearchResults = searchResponse.searchResults;
          } catch (error) {
            console.error('[researchAssistantFlow] Error in final fallback search:', error);
            finalSearchResults = "Unable to retrieve search results.";
          }
        }
        
        // Return a manually constructed response based on the search results
        if (finalSearchResults && finalSearchResults.trim().length > 20 && !finalSearchResults.startsWith("Unable to retrieve search results")) {
          return {
            summary: `**Research Summary Based on Search Results**

Based on the search for "${input.query}", here's what was found:

${finalSearchResults.substring(0, 800)}...

This summary is based on search results after the AI assistant was unable to generate a complete analysis. For more detailed information, consider refining your query or using a different model.`
          };
        } else {
          return {
            summary: "**Research Error**\n\nThe AI assistant couldn't generate a meaningful summary for your query, and we couldn't find enough information through search. Please try a different query or model."
          };
        }
      }
    }

    console.log("[researchAssistantFlow] Extracted text response (first 300 chars):", modelText.substring(0, 300));

    // If we find "<think>" sections, remove them as they're just the model's internal reasoning
    modelText = modelText.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    // Return the model's text as our summary, trimming any markdown code blocks if present
    let summaryText = modelText.trim();
    
    // Remove markdown artifacts if present
    summaryText = summaryText.replace(/```json\s*([\s\S]*?)\s*```/g, '$1');
    summaryText = summaryText.replace(/```\s*([\s\S]*?)\s*```/g, '$1');
    
    // Format the response for better readability
    summaryText = formatForReadability(summaryText);
    
    return { summary: summaryText };
  }
);

/**
 * Format the text for better readability with proper spacing, bullet points, and headers
 */
function formatForReadability(text: string): string {
  let formatted = text;
  
  // Remove common LLM preamble/greeting lines (case-insensitive, multiline)
  const preamblePatterns = [
    /^(hello|hi|greetings|sure|certainly|of course|i would be happy to|i'll help you|let me research|let me answer|let me summarize|based on my research|according to my research|here is a summary|here's a summary)[^\n]*\n?/gi,
    /^I am (a|an) (AI|LLM|Research Assistant|helpful assistant)[^\n]*\n?/gi,
    /^As an AI language model,[^\n]*\n?/gi,
    /^How can I (help|assist) you( today)?\??[^\n]*\n?/gi,
    /^Research assistant\s*\n?/gi, // Specific pattern
    /^Research Summary\s*\n?(?=^\s*(\*\*|:\s))/gim, // "Research Summary" if followed by a bold line or a line starting with ":"
    /^\(Using Research Assistant Flow\)\s*\n?/gi, // Specific pattern
    /^\s*🟢ollama\/[a-zA-Z0-9.:_-]+?\s*$/gim, // Model name lines like "🟢ollama/granite3.2:2b-instruct-q8_0"
  ];
  preamblePatterns.forEach(pattern => {
    formatted = formatted.replace(pattern, '');
  });
  
  // Remove thinking tags and content if present (multiple formats)
  formatted = formatted.replace(/<think>[\s\S]*?<\/think>/g, '');
  formatted = formatted.replace(/```think[\s\S]*?```/g, '');
  formatted = formatted.replace(/\[thinking\][\s\S]*?\[\/thinking\]/g, '');
  
  // Remove any HTML tags that might cause rendering issues
  formatted = formatted.replace(/<\/?[^>]+(>|$)/g, '');
  
  // Convert markdown headers to bold text with spacing (handles #, ##, ### etc.)
  formatted = formatted.replace(/^\s*#+\s+(.+)$/gm, '\n**$1**\n');
  formatted = formatted.trim(); // Trim after initial header conversion

  // Specific link transformation for "Name(Source (URL))" or "Name (Source (URL))" to "Name (Source: URL)"
  formatted = formatted.replace(/([^\s([]+)\s*\(([^()]+?)\s+\((https?:\/\/[^)]+)\)\)/g, '$1 ($2: $3)');
  formatted = formatted.replace(/\(([^()]+?)\s+\((https?:\/\/[^)]+)\)\)/g, '($1: $2)'); // For cases like (Source (URL)) without preceding text
  
  // Convert all variations of markdown code blocks to plain text
  formatted = formatted.replace(/```[\w]*\n([\s\S]*?)\n```/g, '$1');
  
  // Convert inline code to plain text
  formatted = formatted.replace(/`([^`]+)`/g, '$1');
  
  // Standardize all link formats to just the URL
  formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
  
  // Remove image syntax
  formatted = formatted.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '[$1]');
  
  // Convert blockquotes to normal text
  formatted = formatted.replace(/^>\s*(.*)/gm, '$1');
  
  // Clean up excessive whitespace while preserving paragraph breaks
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  
  // Fix spacing around colons in headers (common issue)
  formatted = formatted.replace(/(\*\*[^*\n]+):\s*(\*\*)/g, '$1$2\n\n');
  
  // Handle lines ending with a colon (potential subheaders)
  // Including those that might start/end with a single asterisk like *Text*:
  formatted = formatted.replace(/^(\*?)([A-Za-z0-9][A-Za-z0-9\s\-()',.]*[A-Za-z0-9])(\*?):\s*$/gm, (match, p1, p2, p3) => {
    return `\n**${p2.trim()}**\n`;
  });

  // Clean bolded text: remove stray asterisks inside or trailing, ensure proper newlines
  // Example: ***Text*** -> **Text**, **Text* -> **Text**
  formatted = formatted.replace(/\*{3,}(.*?)\*{3,}/g, '**$1**'); // Convert ***text*** to **text**
  formatted = formatted.replace(/\*\*([^*]+)\*(?!\*)/g, '**$1**'); // **Text* -> **Text** (if last * is not followed by another *)
  formatted = formatted.replace(/(?<!\*)\*([^*]+)\*\*/g, '**$1**'); // *Text** -> **Text** (if first * is not preceded by another *)
  formatted = formatted.replace(/\*\*(\s*\*+([^*]+)\*+\s*)\*\*/g, '**$2**'); // ** *text* ** -> **text**
  formatted = formatted.replace(/(\*\*[^*]+?)(\*+)\*\*/g, '$1**'); // **Text*** -> **Text** (if * is before last **)
  formatted = formatted.replace(/(\*\*[^*]+?\*\*)\*+/g, '$1'); // **Text** *** -> **Text**

  // Ensure bold headers are on their own lines and have consistent spacing
  formatted = formatted.replace(/\s*\*\*([^*]+?)\*\*\s*/g, '\n\n**$1**\n\n');
  
  // Helper function to identify potential plain text headers
  const isPotentialHeaderText = (lineContent: string): boolean => {
    const trimmedLine = lineContent.trim();
    if (trimmedLine.length === 0 || trimmedLine.length > 80) return false;
    
    // Check for bullet points and list markers
    if (trimmedLine.startsWith('•') || 
        trimmedLine.startsWith('-') || 
        trimmedLine.startsWith('*') && !trimmedLine.startsWith('**') ||
        trimmedLine.includes(': ') || 
        trimmedLine.includes('(') || 
        trimmedLine.includes(')')) {
        return false;
    }
    
    // Check for numbered lists (e.g., "1. ")
    if (/^\d+\./.test(trimmedLine)) {
        return false;
    }
    
    // Check for lettered/numbered lists with closing parenthesis (e.g., "a) ", "1) ")
    const firstTwoChars = trimmedLine.substring(0, 2);
    if (firstTwoChars.length === 2 && 
        ((firstTwoChars[0] >= 'a' && firstTwoChars[0] <= 'z') || 
         (firstTwoChars[0] >= 'A' && firstTwoChars[0] <= 'Z') ||
         (firstTwoChars[0] >= '0' && firstTwoChars[0] <= '9')) && 
        firstTwoChars[1] === ')') {
        return false;
    }
    
    if (trimmedLine.toLowerCase().startsWith("note:")) return false;
    if (trimmedLine.split(' ').length > 7) return false; // Keep headers relatively short

    // Check for title case (most words start capitalized, excluding common short words)
    const words = trimmedLine.split(' ');
    if (words.length === 0) return false;
    const isMostlyTitleCased = words.every((word, index) => {
        if (word.length === 0) return true;
        const lowerWord = word.toLowerCase();
        if (index > 0 && ["a", "an", "the", "and", "but", "or", "for", "nor", "on", "at", "to", "from", "by", "with", "in", "of", "is", "are", "was", "were"].includes(lowerWord)) {
            return true; // Allow lowercase for common short words if not the first word
        }
        return word[0] === word[0].toUpperCase();
    });
    return isMostlyTitleCased;
  };
  
  // Make a more compact version for better readability
  const lines = formatted.split('\n');
  let compacted = [];
  let inList = false;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim(); // Trim each line before processing
    
    if (line === "" && compacted.length > 0 && compacted[compacted.length -1].trim() === "") {
      continue; // Skip multiple blank lines
    }
    
    // Skip empty lines between bullet points
    if (line === '' && inList && i + 1 < lines.length && (
      lines[i + 1].trim().startsWith('•') || 
      lines[i + 1].trim().startsWith('-') || 
      /^\d+\./.test(lines[i + 1].trim()) ||
      lines[i + 1].trim().startsWith('*') ||
      isListItemWithParenthesis(lines[i + 1].trim()) // Handle a), b), 1), 2) type lists
    )) {
      continue;
    }

    // If a line is now just "**" or "*", remove it (artifact of cleaning)
    if (line === "**" || line === "*") {
        continue;
    }
    
    // Process bullet points - standardize all bullet point styles to •.
    // Also handle cases where the model uses bolded items like "**Title*:" as list markers.
    const boldListItemMatch = line.match(/^\s*\*\*(.+?)\*?:\s*(.*)$/); // Matches **Title**: Desc, **Title*: Desc, or **Title**: Desc
    
    // Helper function to check for list items with parenthesis (a), b), 1), etc.)
    function isListItemWithParenthesis(text: string): boolean {
      if (text.length < 2) return false;
      const firstChar = text[0];
      const secondChar = text[1];
      return ((firstChar >= 'a' && firstChar <= 'z') || 
              (firstChar >= 'A' && firstChar <= 'Z') ||
              (firstChar >= '0' && firstChar <= '9')) && 
             secondChar === ')';
    }
    
    const isStandardListMarker = 
      line.startsWith('•') || 
      line.startsWith('-') || 
      /^\d+\./.test(line) ||
      (line.startsWith('*') && !line.startsWith('**')) || 
      isListItemWithParenthesis(line);
      
    // Check if line is just a URL or has a URL-like pattern
    const isJustUrl = /^(https?:\/\/[^\s]+)$/.test(line.trim());
    const containsLink = /\(https?:\/\//.test(line) || /\(\w+:\s*https?:\/\//.test(line) || /https?:\/\/\S+/.test(line); // Updated to catch URLs in various formats
    
    // Skip empty bullet points and list items with no content
    if (line === '•' || line === '-' || line === '*' || line.trim() === '•' || line.trim() === '-' || line.trim() === '*') {
      continue;
    }
    
    if (
      isStandardListMarker ||
      boldListItemMatch ||
      // Implicit list item: contains a link and follows a header or is already in a list, and is not a header itself
      (containsLink && !isPotentialHeaderText(line) && (inList || (compacted.length > 0 && compacted[compacted.length -1].trim().startsWith("**") && compacted[compacted.length -1].trim().endsWith("**"))))
    ) {
      inList = true;
      
      // Convert all bullet types to the • symbol for consistency
      let itemContent = '';

      if (boldListItemMatch) {
        const title = boldListItemMatch[1].trim(); // Title part, e.g., "Eleven Madison Park, New York City"
        const description = boldListItemMatch[2].trim(); // Description part
        itemContent = `• **${title}**:${description ? ' ' + description : ''}`;
      } else if (line.startsWith('-')) {
        itemContent = '• ' + line.substring(1).trim();
      } else if (line.match(/^\d+\./)) {
        itemContent = '• ' + line.replace(/^\d+\.\s*/, '').trim();
      } else if (line.startsWith('*') && !line.startsWith('**')) {
        itemContent = '• ' + line.substring(1).trim();
      } else if (line.match(/^[a-zA-Z\d]\)/)) {
        itemContent = '• ' + line.replace(/^[a-zA-Z\d]\)\s*/, '').trim();
      } else if (line.startsWith('•')) {
        // Already has bullet, just keep as is
        itemContent = line;
      } else if (containsLink && !isStandardListMarker && !boldListItemMatch) { // Implicit list item with link
        // Fix standalone URLs to be properly formatted
        if (isJustUrl) {
          itemContent = `• ${line.trim()}`;
        } else {
          // Convert raw URLs to properly formatted links if not already formatted
          const linkFixedLine = line.replace(/(?<!\()https?:\/\/\S+/g, url => `(${url})`);
          itemContent = '• ' + linkFixedLine;
        }
      } else {
        // This case should be rare if the above conditions are comprehensive.
        // If a line wasn't handled by any specific case, keep it as is
        itemContent = line; 
      }
      
      // Skip if the item is empty after processing
      if (itemContent.trim() === '•' || itemContent.trim().length <= 2) {
        continue;
      }
      
      compacted.push(itemContent.trim());
    } else if (isPotentialHeaderText(line)) {
      // If the previous line in compacted was also a header, ensure a blank line
      if (compacted.length > 0 && compacted[compacted.length -1].trim().startsWith("**") && compacted[compacted.length -1].trim().endsWith("**")) {
        if (compacted[compacted.length -1].trim() !== "") compacted.push(""); // Add blank line if previous wasn't already blank
      }
      compacted.push(`**${line}**`);
      inList = false; // A header resets the list context
    } else {
      inList = false;
      
      // Check if it's a plain URL and format it properly
      if (isJustUrl) {
        compacted.push(`• ${line.trim()}`);
      } else {
        compacted.push(line);
      }
    }
  }
  
  // Filter out multiple consecutive blank lines from compacted
  let finalLines = [];
  for (let i = 0; i < compacted.length; i++) {
    if (compacted[i].trim() === "" && finalLines.length > 0 && finalLines[finalLines.length - 1].trim() === "") {
      continue;
    }
    finalLines.push(compacted[i]);
  }

  // Remove leading/trailing blank lines from the final set
  while (finalLines.length > 0 && finalLines[0].trim() === '') finalLines.shift();
  while (finalLines.length > 0 && finalLines[finalLines.length - 1].trim() === '') finalLines.pop();
  
  // Clean up URL formatting - ensure proper spacing and format
  for (let i = 0; i < finalLines.length; i++) {
    // Fix lines that start with colons (often seen in granite3.2 output)
    if (finalLines[i].trim().startsWith(':')) {
      const textAfterColon = finalLines[i].trim().substring(1).trim();
      // If it looks like a header/title, make it a bullet point
      if (isPotentialHeaderText(textAfterColon)) {
        finalLines[i] = `• **${textAfterColon}**`;
      } else {
        finalLines[i] = `• ${textAfterColon}`;
      }
    }

    // Fix "Source: )" or "(Source: )" with missing URL
    finalLines[i] = finalLines[i].replace(/\(Source:\s*\)/g, '');
    finalLines[i] = finalLines[i].replace(/Source:\s*\)/g, '');
    
    // Fix standalone "(Source:" with missing URL by removing it
    finalLines[i] = finalLines[i].replace(/\(Source:(\s*)$/g, '');
    
    // Fix lines that are just URLs without bullets
    if (/^https?:\/\/\S+$/.test(finalLines[i].trim())) {
      finalLines[i] = `• ${finalLines[i].trim()}`;
    }
    
    // Fix raw URLs in text to be properly formatted
    finalLines[i] = finalLines[i].replace(/(?<!\(|\s\()https?:\/\/\S+/g, url => ` (${url})`);
    
    // Fix inconsistent bullet spacing
    if (finalLines[i].startsWith('•')) {
      finalLines[i] = '• ' + finalLines[i].substring(1).trim();
    }
    
    // Fix URLs with no space after colon in (Source: URL) format
    finalLines[i] = finalLines[i].replace(/\(([^:]+):(\s*)https?:\/\//g, '($1: https://');
  }
  
  // Remove empty bullet points after URL cleaning
  finalLines = finalLines.filter(line => {
    const trimmed = line.trim();
    return !(trimmed === '•' || trimmed === '• ' || trimmed === '•  ' || trimmed === '*' || trimmed === '- ');
  });
  
  // Fix cases where a title with asterisks is on one line and content on the next
  for (let i = 0; i < finalLines.length - 1; i++) {
    const currentLine = finalLines[i].trim();
    const nextLine = finalLines[i+1].trim();
    
    // Check for patterns like "*Elite Traveler" followed by "offers an in-depth analysis..."
    if (currentLine.startsWith('*') && currentLine.endsWith('*') && 
        !currentLine.startsWith('**') && !nextLine.startsWith('•') && nextLine.length > 0) {
      // Combine the lines with proper formatting
      const title = currentLine.substring(1, currentLine.length - 1).trim();
      finalLines[i] = `• **${title}** ${nextLine}`;
      finalLines.splice(i+1, 1); // Remove the next line as we've merged it
    }
    // Also check for cases where the title has a single asterisk
    else if (currentLine.startsWith('*') && !currentLine.startsWith('**') && 
             !currentLine.endsWith('*') && !nextLine.startsWith('•') && nextLine.length > 0) {
      const title = currentLine.substring(1).trim();
      finalLines[i] = `• **${title}** ${nextLine}`;
      finalLines.splice(i+1, 1); // Remove the next line as we've merged it
    }
  }
  
  // Remove sections that have just a header followed by nothing
  for (let i = 0; i < finalLines.length - 1; i++) {
    if (finalLines[i].trim().startsWith('**') && 
        finalLines[i].trim().endsWith('**') && 
        (i === finalLines.length - 1 || finalLines[i+1].trim() === '')) {
      // Remove isolated headers with no content
      finalLines.splice(i, 1);
      i--; // Adjust index after removal
    }
  }
  
  // Handle title and subtitle logic on finalLines
  if (finalLines.length > 0) {
    let firstContentLine = finalLines[0].trim();
    let titleSet = false;
    // Check if the second line is a subtitle for the first (often starts with ':')
    if (finalLines.length > 1 && finalLines[1].trim().startsWith(':')) {
        const subtitle = finalLines[1].trim().substring(1).trim();
        firstContentLine = `${firstContentLine.replace(/\*$/, '').replace(/^\*/, '')}: ${subtitle}`;
        finalLines.splice(1, 1); // Remove the original subtitle line
        finalLines[0] = `**${firstContentLine}**`;
        titleSet = true;
    } else if (!firstContentLine.startsWith('**') || !firstContentLine.endsWith('**')) {
        finalLines[0] = `**${firstContentLine.replace(/\*$/, '').replace(/^\*/, '')}**`;
        titleSet = true;
    }
    if (!titleSet && (!finalLines[0].startsWith('**') || !finalLines[0].endsWith('**'))) {
        finalLines.unshift('**Research Summary**', ''); 
    }
  } else {
    finalLines = ['**Research Summary**'];
  }
  
  formatted = finalLines.join('\n');
  
  // Ensure proper spacing after headers
  formatted = formatted.replace(/(\*\*[^_][^*]+?[^_]\*\*)\n([^\n•\s])/g, '$1\n\n$2'); // Ensure blank line after header if not followed by list/blank
  
  // Fix potential nested bold errors (**nested **bold** text**)
  formatted = formatted.replace(/\*\*([^*]*)\*\*([^*]*)\*\*([^*]*)\*\*/g, '**$1$2$3**');
  
  // Clean up any empty bullet points that might have been created
  formatted = formatted.replace(/^•\s*$/gm, '');
  
  // Fix excessive spacing between bullet points
  formatted = formatted.replace(/\n\n(•\s)/g, '\n$1');
  
  // Ensure bullet points are indented consistently after headers
  formatted = formatted.replace(/(\*\*[^*]+\*\*)\n\n(•)/g, '$1\n$2');
  
  // Remove any trailing whitespace from all lines
  formatted = formatted.split('\n').map(line => line.trimRight()).join('\n');
  
  // Finally, ensure we don't have trailing whitespace
  formatted = formatted.trim();
  
  // One last pass for consistent spacing around headers and lists
  formatted = formatted.replace(/\n{3,}/g, '\n\n'); // Consolidate multiple newlines
  
  return formatted;
}

// Exported wrapper function to call the flow
export async function askResearchAssistant(
  input: ResearchAssistantInput
): Promise<ResearchAssistantOutput> {
  return researchAssistantFlow(input);
} 

// --- Automated Response Grading Flow ---

const GradingInputSchema = z.object({
  originalQuery: z.string().describe("The original query posed by the user."),
  modelResponse: z.string().describe("The response generated by the AI model that needs to be graded."),
  modelUsed: z.string().describe("The name of the model that generated the response (e.g., 'ollama/qwen3:8b')."),
  // Optional: You could add expected key points or specific instructions for the evaluator here
});
export type GradingInput = z.infer<typeof GradingInputSchema>;

const GradingOutputSchema = z.object({
  overallGrade: z.enum(["Excellent", "Good", "Fair", "Poor", "Very Poor", "Error in Evaluation"])
    .describe("The overall assessment of the model's response."),
  criteriaFeedback: z.object({
    Relevance: z.string().describe("Assessment of how well the response addresses the query."),
    Accuracy: z.string().describe("Assessment of the factual accuracy of the information provided (high-level)."),
    "Clarity and Coherence": z.string().describe("Assessment of the response's readability and logical flow."),
    Completeness: z.string().describe("Assessment of whether the response covers the query's main aspects."),
    Conciseness: z.string().describe("Assessment of whether the response is to the point."),
    Formatting: z.string().describe("Assessment of the response's formatting for readability."),
    Helpfulness: z.string().describe("Overall assessment of how helpful the response is."),
    "Absence of Issues": z.string().describe("Assessment for common problems like hallucinations, repetition, or generic non-answers."),
    Error: z.string().optional().describe("Used if there was an error during the evaluation process itself."),
  }).describe("Detailed feedback for each evaluation criterion."),
  justification: z.string().describe("A brief justification for the overall grade."),
});
export type GradingOutput = z.infer<typeof GradingOutputSchema>;

const gradeResponseFlow = ai.defineFlow(
  {
    name: 'gradeResponseFlow',
    inputSchema: GradingInputSchema,
    outputSchema: GradingOutputSchema,
  },
  async (input: GradingInput): Promise<GradingOutput> => {
    // Choose your evaluator model. For Ollama, instruction-tuned models are better.
    // For higher accuracy, you might use a more powerful model (even proprietary if available).
    const evaluatorModel = 'ollama/llama3:8b-instruct-q4_K_M'; // Example: Llama 3 Instruct
    // const evaluatorModel = 'ollama/mistral:instruct'; // Alternative

    console.log(`[gradeResponseFlow] Evaluating response from ${input.modelUsed} using evaluator ${evaluatorModel}`);

    const gradingCriteriaDetails = [
      { key: "Relevance", description: "Does the response directly and comprehensively address the original query?" },
      { key: "Accuracy", description: "Based on general knowledge, does the information seem plausible and accurate? (Note: This is a high-level check, not deep fact-verification)." },
      { key: "Clarity and Coherence", description: "Is the response well-written, easy to understand, and logically structured?" },
      { key: "Completeness", description: "Does the response cover the main aspects of the query sufficiently?" },
      { key: "Conciseness", description: "Is the response to the point, avoiding unnecessary verbosity or repetition?" },
      { key: "Formatting", description: "Is the response well-formatted for readability (e.g., use of paragraphs, lists if appropriate)?" },
      { key: "Helpfulness", description: "Overall, how helpful is this response to the user who asked the original query?" },
      { key: "Absence of Issues", description: "Does the response avoid common issues like hallucinations, repetitive loops, generic non-answers, or inappropriate content?" }
    ];

    const prompt = `
You are an AI Response Quality Evaluator. Your task is to meticulously assess the quality of a response generated by another AI model based on a user's query.

**Original User Query:**
${input.originalQuery}

**AI Model That Generated the Response:**
${input.modelUsed}

**AI's Response to Grade:**
--- RESPONSE START ---
${input.modelResponse}
--- RESPONSE END ---

**Evaluation Criteria:**
${gradingCriteriaDetails.map(c => `- **${c.key}:** ${c.description}`).join("\n")}

**Instructions for Evaluation:**
1. For each criterion listed above, provide a brief, specific assessment.
2. After assessing all criteria, provide an overall grade from the following options: "Excellent", "Good", "Fair", "Poor", "Very Poor".
3. Provide a concise justification for your overall grade.

**Output Format (Strictly follow this JSON structure, ensuring all specified keys are present):**
${JSON.stringify({
  overallGrade: "Excellent | Good | Fair | Poor | Very Poor",
  criteriaFeedback: {
    Relevance: "Your assessment...",
    Accuracy: "Your assessment...",
    "Clarity and Coherence": "Your assessment...",
    Completeness: "Your assessment...",
    Conciseness: "Your assessment...",
    Formatting: "Your assessment...",
    Helpfulness: "Your assessment...",
    "Absence of Issues": "Your assessment..."
  },
  justification: "Your overall justification..."
}, null, 2)}
    `;

    try {
      const evaluationResult = await ai.generate({
        model: evaluatorModel,
        prompt: prompt,
        output: {
          format: 'json',
          schema: GradingOutputSchema,
        },
        config: { temperature: 0.1 }, // Lower temperature for more deterministic and consistent evaluations
      });

      // Genkit with a capable model and `output.schema` should directly give structured output.
      // The `output` field of `evaluationResult` will be the JavaScript object.
      return evaluationResult.output as GradingOutput;

    } catch (error: any) {
      console.error(`[gradeResponseFlow] Error during evaluation with ${evaluatorModel}:`, error);
      return {
        overallGrade: "Error in Evaluation",
        criteriaFeedback: { 
          Relevance: "Error during evaluation",
          Accuracy: "Error during evaluation",
          "Clarity and Coherence": "Error during evaluation",
          Completeness: "Error during evaluation",
          Conciseness: "Error during evaluation",
          Formatting: "Error during evaluation",
          Helpfulness: "Error during evaluation",
          "Absence of Issues": "Error during evaluation",
          Error: `Evaluation failed: ${error.message}`
        },
        justification: `The evaluator model (${evaluatorModel}) encountered an error or failed to produce a valid structured response.`,
      };
    }
  }
);

// Exported wrapper function to call the grading flow
export async function gradeResponse(
  input: GradingInput
): Promise<GradingOutput> {
  return gradeResponseFlow(input);
}

// Example of how you might use this:
/*
async function evaluateResearchAssistantResponse() {
  const query = "What are the latest advancements in quantum computing?";
  const researchInput: ResearchAssistantInput = { query, model: 'ollama/qwen3:8b' };
  
  // 1. Get a response from your research assistant
  const researchOutput = await askResearchAssistant(researchInput);
  console.log("Research Assistant Summary:", researchOutput.summary);

  // 2. Grade the response
  if (researchOutput.summary && !researchOutput.summary.startsWith("**Research Error**")) {
    const gradingInput: GradingInput = {
      originalQuery: query,
      modelResponse: researchOutput.summary,
      modelUsed: researchInput.model || 'ollama/qwen3:8b' // or the actual model used if fallback occurred
    };
    const grade = await gradeResponse(gradingInput);
    console.log("\n--- Response Grade ---");
    console.log("Overall Grade:", grade.overallGrade);
    console.log("Justification:", grade.justification);
    console.log("Criteria Feedback:");
    for (const [criterion, feedback] of Object.entries(grade.criteriaFeedback)) {
      console.log(`  - ${criterion}: ${feedback}`);
    }
  } else {
    console.log("\nSkipping grading due to research error or empty summary.");
  }
}

// To run the example:
// evaluateResearchAssistantResponse().catch(console.error);
*/ 
/**
 * @fileOverview A web search tool for Genkit using the Brave Search API.
 *
 * - webSearchTool - A Genkit tool that performs web search via Brave Search API.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { BraveSearch } from '@langchain/community/tools/brave_search';

console.log('[webSearchTool] Tool file loaded.');

// Simplified input schema for testing with Ollama plugin
export const WebSearchInputSchema = z.object({
  searchQuery: z.string(),
});

export type WebSearchInput = z.infer<typeof WebSearchInputSchema>;

export const WebSearchOutputSchema = z.object({
  searchResults: z.string().describe('A formatted string of search results, including titles, snippets, and URLs.'),
  resultsArray: z.array(z.object({
    title: z.string(),
    link: z.string().url(),
    snippet: z.string(),
  })).optional().describe('An array of search result objects.'),
});

export type WebSearchOutput = z.infer<typeof WebSearchOutputSchema>;

export const webSearchTool = ai.defineTool(
  {
    name: 'webSearchTool',
    description: 'Performs a web search for the given query using the Brave Search API and returns a summary of the top results. Use this to find information about current events, specific topics, or anything you would typically search the web for.',
    inputSchema: WebSearchInputSchema,
    outputSchema: WebSearchOutputSchema,
  },
  async (input: WebSearchInput) => {
    console.log('[webSearchTool] Called with input:', input);
    const apiKey = process.env.BRAVE_SEARCH_API_KEY;
    if (!apiKey) {
      console.error('[webSearchTool] BRAVE_SEARCH_API_KEY is not set.');
      throw new Error('BRAVE_SEARCH_API_KEY environment variable not set.');
    }
    console.log('[webSearchTool] Using API Key (first 5 chars):', apiKey.substring(0, 5));

    const searchTool = new BraveSearch({ apiKey });

    console.log(`[webSearchTool] Performing search for query: "${input.searchQuery}"`);

    try {
      const rawResults = await searchTool.call(input.searchQuery);
      console.log('[webSearchTool] Raw data from Brave API (first 200 chars of stringified):', rawResults.substring(0, 200));

      // Assuming rawResults is a string that needs to be parsed if it's JSON from BraveSearch
      // Or if it's already structured, adapt this part.
      // For now, let's assume it's a string of already formatted results or needs simple processing.
      // The BraveSearch tool from langchain might return a string of concatenated results.

      let resultsArray: Array<{ title: string; link: string; snippet: string; }> = [];
      let formattedResultsString = "No detailed results parsed.";

      if (typeof rawResults === 'string') {
        // Attempt to parse if it looks like a JSON string of an array
        try {
          const parsed = JSON.parse(rawResults);
          if (Array.isArray(parsed)) {
            resultsArray = parsed.map((item: any) => ({
              title: item.title || 'N/A',
              link: item.link || 'N/A',
              snippet: item.snippet || 'N/A',
            }));
            // Re-format into a string for the searchResults field
            formattedResultsString = resultsArray.map((r, i) => 
              `${i+1}. ${r.title}\nURL: ${r.link}\nSnippet: ${r.snippet}`
            ).join('\n---\n');
          } else {
            // If it's a string but not JSON array, use it directly for searchResults
            formattedResultsString = rawResults;
          } 
        } catch (e) {
          // Not a JSON string, assume it's pre-formatted text results
          formattedResultsString = rawResults;
          // We could try to create a basic resultsArray entry if needed
          // For now, if it's not parseable JSON array, resultsArray will be empty or based on a simpler heuristic
        }
      }
      
      console.log('[webSearchTool] Returning formatted results (first 200 chars):', formattedResultsString.substring(0, 200));
      return {
        searchResults: formattedResultsString,
        resultsArray: resultsArray.length > 0 ? resultsArray : undefined,
      };
    } catch (error) {
      console.error('[webSearchTool] Error during search:', error);
      throw error;
    }
  }
);

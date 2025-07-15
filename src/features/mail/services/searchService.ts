/**
 * Gmail Search Service - Phase 2.1
 * 
 * Comprehensive search functionality with advanced filters, operators,
 * search history, and intelligent suggestions.
 */

import { 
  SearchQuery, 
  SearchFilter, 
  SearchOperator, 
  SearchSuggestion, 
  SearchResult, 
  SearchFacet, 
  SearchHistory, 
  AdvancedSearchFilters,
  SearchConfig,
  GMAIL_SEARCH_OPERATORS,
  PREDEFINED_SEARCHES
} from '../types/search';
import { GmailTauriService } from './gmailTauriService';
import { ParsedEmail } from '../types';

export class SearchService {
  private static instance: SearchService;
  private searchHistory: SearchHistory;
  private config: SearchConfig;
  private recentSuggestions: SearchSuggestion[] = [];

  private constructor() {
    this.searchHistory = {
      recentSearches: [],
      savedSearches: [],
      searchStats: {
        totalSearches: 0,
        mostUsedOperators: [],
        averageSearchTime: 0,
        lastSearchAt: undefined
      }
    };

    this.config = {
      maxRecentSearches: 50,
      maxSavedSearches: 20,
      enableSmartSuggestions: true,
      enableSearchHistory: true,
      enableAutoComplete: true,
      searchDelay: 300,
      highlightResults: true,
      saveSearchHistory: true
    };

    this.loadSearchHistory();
  }

  static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  // ==========================================================================
  // Search Operations
  // ==========================================================================

  async search(
    query: string, 
    filters: SearchFilter[] = [],
    accountId: string,
    pageToken?: string
  ): Promise<SearchResult> {
    const startTime = Date.now();
    
    try {
      // Build Gmail search query
      const gmailQuery = this.buildGmailQuery(query, filters);
      
      // Get Gmail service
      const gmailService = new GmailTauriService(accountId);
      
      // Execute search
      const response = await gmailService.searchMessages(
        gmailQuery, 
        undefined, // labelIds handled in query
        25, // maxResults
        pageToken
      );

      const searchTime = Date.now() - startTime;
      
      // Build search result
      const result: SearchResult = {
        query: gmailQuery,
        filters,
        messages: response.messages.map(msg => msg.id),
        totalCount: response.result_size_estimate || response.messages.length,
        nextPageToken: response.next_page_token,
        searchTime,
        facets: this.generateFacets(response.messages as any[]),
        suggestions: await this.getSmartSuggestions(query, response.messages as any[])
      };

      // Update search history
      await this.updateSearchHistory(query, filters, accountId, searchTime);

      return result;
    } catch (error) {
      console.error('Search failed:', error);
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchWithAdvancedFilters(
    filters: AdvancedSearchFilters,
    accountId: string,
    pageToken?: string
  ): Promise<SearchResult> {
    const query = this.buildAdvancedQuery(filters);
    const searchFilters = this.convertAdvancedFiltersToSearchFilters(filters);
    
    return this.search(query, searchFilters, accountId, pageToken);
  }

  // ==========================================================================
  // Query Building
  // ==========================================================================

  private buildGmailQuery(query: string, filters: SearchFilter[]): string {
    const parts: string[] = [];

    // Add base query
    if (query && query.trim()) {
      parts.push(query.trim());
    }

    // Add filters
    filters.forEach(filter => {
      const filterQuery = this.buildFilterQuery(filter);
      if (filterQuery) {
        parts.push(filterQuery);
      }
    });

    return parts.join(' ').trim() || 'in:inbox';
  }

  private buildFilterQuery(filter: SearchFilter): string {
    switch (filter.operator) {
      case 'from':
        return `from:${filter.value}`;
      case 'to':
        return `to:${filter.value}`;
      case 'subject':
        return `subject:${filter.value}`;
      case 'body':
        return `body:${filter.value}`;
      case 'has':
        return `has:${filter.value}`;
      case 'is':
        return `is:${filter.value}`;
      case 'label':
        return `label:${filter.value}`;
      case 'in':
        return `in:${filter.value}`;
      case 'after':
        return `after:${this.formatDate(filter.value)}`;
      case 'before':
        return `before:${this.formatDate(filter.value)}`;
      case 'older_than':
        return `older_than:${filter.value}`;
      case 'newer_than':
        return `newer_than:${filter.value}`;
      case 'size':
        return `size:${filter.value}`;
      case 'larger':
        return `larger:${filter.value}`;
      case 'smaller':
        return `smaller:${filter.value}`;
      default:
        return '';
    }
  }

  private buildAdvancedQuery(filters: AdvancedSearchFilters): string {
    const parts: string[] = [];

    if (filters.from) parts.push(`from:${filters.from}`);
    if (filters.to) parts.push(`to:${filters.to}`);
    if (filters.subject) parts.push(`subject:${filters.subject}`);
    if (filters.body) parts.push(`body:${filters.body}`);
    
    if (filters.hasAttachment) parts.push('has:attachment');
    if (filters.attachmentType) parts.push(`has:${filters.attachmentType}`);
    
    if (filters.dateRange?.start) {
      parts.push(`after:${this.formatDate(filters.dateRange.start)}`);
    }
    if (filters.dateRange?.end) {
      parts.push(`before:${this.formatDate(filters.dateRange.end)}`);
    }
    if (filters.dateRange?.preset) {
      parts.push(this.getPresetDateQuery(filters.dateRange.preset));
    }
    
    if (filters.sizeRange?.min) {
      parts.push(`larger:${filters.sizeRange.min}${filters.sizeRange.unit.toLowerCase()}`);
    }
    if (filters.sizeRange?.max) {
      parts.push(`smaller:${filters.sizeRange.max}${filters.sizeRange.unit.toLowerCase()}`);
    }
    
    if (filters.labels?.length) {
      filters.labels.forEach(label => parts.push(`label:${label}`));
    }
    if (filters.excludeLabels?.length) {
      filters.excludeLabels.forEach(label => parts.push(`-label:${label}`));
    }
    
    if (filters.isRead === true) parts.push('is:read');
    if (filters.isRead === false) parts.push('is:unread');
    if (filters.isStarred === true) parts.push('is:starred');
    if (filters.isImportant === true) parts.push('is:important');
    if (filters.inFolder) parts.push(`in:${filters.inFolder}`);
    
    return parts.join(' ').trim();
  }

  private convertAdvancedFiltersToSearchFilters(filters: AdvancedSearchFilters): SearchFilter[] {
    const searchFilters: SearchFilter[] = [];
    let id = 0;

    const addFilter = (type: any, operator: string, value: any, label: string) => {
      if (value !== undefined && value !== null && value !== '') {
        searchFilters.push({
          id: `filter_${id++}`,
          type,
          operator,
          value,
          label,
          description: `${label}: ${value}`
        });
      }
    };

    addFilter('text', 'from', filters.from, 'From');
    addFilter('text', 'to', filters.to, 'To');
    addFilter('text', 'subject', filters.subject, 'Subject');
    addFilter('text', 'body', filters.body, 'Body');
    addFilter('boolean', 'has', filters.hasAttachment ? 'attachment' : undefined, 'Has Attachment');
    addFilter('text', 'has', filters.attachmentType, 'Attachment Type');
    addFilter('date', 'after', filters.dateRange?.start, 'After Date');
    addFilter('date', 'before', filters.dateRange?.end, 'Before Date');
    addFilter('boolean', 'is', filters.isRead ? 'read' : (filters.isRead === false ? 'unread' : undefined), 'Read Status');
    addFilter('boolean', 'is', filters.isStarred ? 'starred' : undefined, 'Starred');
    addFilter('boolean', 'is', filters.isImportant ? 'important' : undefined, 'Important');
    addFilter('text', 'in', filters.inFolder, 'In Folder');

    return searchFilters;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0].replace(/-/g, '/');
  }

  private getPresetDateQuery(preset: string): string {
    switch (preset) {
      case 'today':
        return 'newer_than:1d';
      case 'yesterday':
        return 'older_than:1d newer_than:2d';
      case 'last7days':
        return 'newer_than:7d';
      case 'last30days':
        return 'newer_than:30d';
      case 'last90days':
        return 'newer_than:90d';
      case 'lastyear':
        return 'newer_than:365d';
      default:
        return '';
    }
  }

  // ==========================================================================
  // Search Suggestions
  // ==========================================================================

  async getSuggestions(query: string, accountId: string): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];
    
    // Add operator suggestions
    const operatorSuggestions = this.getOperatorSuggestions(query);
    suggestions.push(...operatorSuggestions);
    
    // Add recent search suggestions
    const recentSuggestions = this.getRecentSearchSuggestions(query);
    suggestions.push(...recentSuggestions);
    
    // Add saved search suggestions
    const savedSuggestions = this.getSavedSearchSuggestions(query);
    suggestions.push(...savedSuggestions);
    
    // Add predefined search suggestions
    const predefinedSuggestions = this.getPredefinedSearchSuggestions(query);
    suggestions.push(...predefinedSuggestions);
    
    // Add smart suggestions (if enabled)
    if (this.config.enableSmartSuggestions) {
      const smartSuggestions = await this.getSmartSuggestions(query, []);
      suggestions.push(...smartSuggestions);
    }
    
    // Sort by priority and relevance
    return suggestions
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 10); // Limit to top 10 suggestions
  }

  private getOperatorSuggestions(query: string): SearchSuggestion[] {
    const lowerQuery = query.toLowerCase();
    
    return GMAIL_SEARCH_OPERATORS
      .filter(op => 
        op.key.toLowerCase().includes(lowerQuery) || 
        op.label.toLowerCase().includes(lowerQuery) ||
        op.description.toLowerCase().includes(lowerQuery)
      )
      .map(op => ({
        id: `operator_${op.key}`,
        type: 'operator' as const,
        text: op.key,
        description: op.description,
        insertText: `${op.key}:`,
        priority: op.category === 'basic' ? 100 : 80
      }));
  }

  private getRecentSearchSuggestions(query: string): SearchSuggestion[] {
    const lowerQuery = query.toLowerCase();
    
    return this.searchHistory.recentSearches
      .filter(search => search.query.toLowerCase().includes(lowerQuery))
      .slice(0, 5)
      .map(search => ({
        id: `recent_${search.id}`,
        type: 'recent' as const,
        text: search.query,
        description: `Recent search • ${search.usageCount} times`,
        query: search.query,
        priority: 60 + search.usageCount
      }));
  }

  private getSavedSearchSuggestions(query: string): SearchSuggestion[] {
    const lowerQuery = query.toLowerCase();
    
    return this.searchHistory.savedSearches
      .filter(search => 
        search.query.toLowerCase().includes(lowerQuery) ||
        search.name?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 5)
      .map(search => ({
        id: `saved_${search.id}`,
        type: 'saved' as const,
        text: search.name || search.query,
        description: `Saved search • ${search.description || search.query}`,
        query: search.query,
        priority: 90
      }));
  }

  private getPredefinedSearchSuggestions(query: string): SearchSuggestion[] {
    const lowerQuery = query.toLowerCase();
    
    return PREDEFINED_SEARCHES
      .filter(search => 
        search.name?.toLowerCase().includes(lowerQuery) ||
        search.query?.toLowerCase().includes(lowerQuery) ||
        search.description?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 5)
      .map((search, index) => ({
        id: `predefined_${index}`,
        type: 'smart' as const,
        text: search.name || search.query || '',
        description: search.description || '',
        query: search.query,
        priority: 70
      }));
  }

  private async getSmartSuggestions(query: string, messages: ParsedEmail[]): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];
    
    // Smart suggestions based on message content
    if (messages.length > 0) {
      const commonSenders = this.getCommonSenders(messages);
      const commonLabels = this.getCommonLabels(messages);
      
      commonSenders.forEach((sender, index) => {
        suggestions.push({
          id: `smart_sender_${index}`,
          type: 'smart',
          text: `from:${sender}`,
          description: `Search emails from ${sender}`,
          insertText: `from:${sender}`,
          priority: 50
        });
      });
      
      commonLabels.forEach((label, index) => {
        suggestions.push({
          id: `smart_label_${index}`,
          type: 'smart',
          text: `label:${label}`,
          description: `Search emails with label ${label}`,
          insertText: `label:${label}`,
          priority: 50
        });
      });
    }
    
    return suggestions;
  }

  private getCommonSenders(messages: ParsedEmail[]): string[] {
    const senderCounts: { [key: string]: number } = {};
    
    messages.forEach(msg => {
      const sender = msg.from?.email || msg.from?.name || '';
      if (sender) {
        senderCounts[sender] = (senderCounts[sender] || 0) + 1;
      }
    });
    
    return Object.entries(senderCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([sender]) => sender);
  }

  private getCommonLabels(messages: ParsedEmail[]): string[] {
    const labelCounts: { [key: string]: number } = {};
    
    messages.forEach(msg => {
      msg.labels?.forEach(label => {
        if (label !== 'INBOX' && label !== 'UNREAD') {
          labelCounts[label] = (labelCounts[label] || 0) + 1;
        }
      });
    });
    
    return Object.entries(labelCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([label]) => label);
  }

  // ==========================================================================
  // Search Facets
  // ==========================================================================

  private generateFacets(messages: ParsedEmail[]): SearchFacet[] {
    const facets: SearchFacet[] = [];
    
    // Sender facets
    const senderCounts: { [key: string]: number } = {};
    messages.forEach(msg => {
      const sender = msg.from?.email || msg.from?.name || 'Unknown';
      senderCounts[sender] = (senderCounts[sender] || 0) + 1;
    });
    
    Object.entries(senderCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([sender, count]) => {
        facets.push({
          type: 'sender',
          label: sender,
          count,
          value: sender,
          query: `from:${sender}`
        });
      });
    
    // Label facets
    const labelCounts: { [key: string]: number } = {};
    messages.forEach(msg => {
      msg.labels?.forEach(label => {
        if (label !== 'INBOX' && label !== 'UNREAD') {
          labelCounts[label] = (labelCounts[label] || 0) + 1;
        }
      });
    });
    
    Object.entries(labelCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([label, count]) => {
        facets.push({
          type: 'label',
          label,
          count,
          value: label,
          query: `label:${label}`
        });
      });
    
    // Date facets
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const todayCount = messages.filter(msg => msg.date && msg.date >= today).length;
    const yesterdayCount = messages.filter(msg => msg.date && msg.date >= yesterday && msg.date < today).length;
    const lastWeekCount = messages.filter(msg => msg.date && msg.date >= lastWeek && msg.date < yesterday).length;
    
    if (todayCount > 0) {
      facets.push({
        type: 'date',
        label: 'Today',
        count: todayCount,
        value: 'today',
        query: 'newer_than:1d'
      });
    }
    
    if (yesterdayCount > 0) {
      facets.push({
        type: 'date',
        label: 'Yesterday',
        count: yesterdayCount,
        value: 'yesterday',
        query: 'older_than:1d newer_than:2d'
      });
    }
    
    if (lastWeekCount > 0) {
      facets.push({
        type: 'date',
        label: 'Last week',
        count: lastWeekCount,
        value: 'lastweek',
        query: 'older_than:2d newer_than:7d'
      });
    }
    
    return facets;
  }

  // ==========================================================================
  // Search History
  // ==========================================================================

  private async updateSearchHistory(
    query: string, 
    filters: SearchFilter[], 
    accountId: string, 
    searchTime: number
  ): Promise<void> {
    if (!this.config.saveSearchHistory) return;
    
    const now = new Date();
    const searchQuery: SearchQuery = {
      id: `search_${now.getTime()}`,
      query,
      filters,
      accountId,
      createdAt: now,
      lastUsed: now,
      usageCount: 1,
      isSaved: false
    };
    
    // Check if this search already exists
    const existingIndex = this.searchHistory.recentSearches.findIndex(
      s => s.query === query && s.accountId === accountId
    );
    
    if (existingIndex >= 0) {
      // Update existing search
      this.searchHistory.recentSearches[existingIndex].lastUsed = now;
      this.searchHistory.recentSearches[existingIndex].usageCount++;
    } else {
      // Add new search
      this.searchHistory.recentSearches.unshift(searchQuery);
      
      // Limit recent searches
      if (this.searchHistory.recentSearches.length > this.config.maxRecentSearches) {
        this.searchHistory.recentSearches = this.searchHistory.recentSearches.slice(0, this.config.maxRecentSearches);
      }
    }
    
    // Update search stats
    this.searchHistory.searchStats.totalSearches++;
    this.searchHistory.searchStats.lastSearchAt = now;
    
    // Update average search time
    const currentAvg = this.searchHistory.searchStats.averageSearchTime;
    const totalSearches = this.searchHistory.searchStats.totalSearches;
    this.searchHistory.searchStats.averageSearchTime = 
      (currentAvg * (totalSearches - 1) + searchTime) / totalSearches;
    
    // Save to storage
    await this.saveSearchHistory();
  }

  private async loadSearchHistory(): Promise<void> {
    try {
      const stored = localStorage.getItem('gmail_search_history');
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Convert date strings back to Date objects
        parsed.recentSearches = parsed.recentSearches.map((search: any) => ({
          ...search,
          createdAt: new Date(search.createdAt),
          lastUsed: new Date(search.lastUsed)
        }));
        
        parsed.savedSearches = parsed.savedSearches.map((search: any) => ({
          ...search,
          createdAt: new Date(search.createdAt),
          lastUsed: new Date(search.lastUsed)
        }));
        
        if (parsed.searchStats.lastSearchAt) {
          parsed.searchStats.lastSearchAt = new Date(parsed.searchStats.lastSearchAt);
        }
        
        this.searchHistory = parsed;
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }

  private async saveSearchHistory(): Promise<void> {
    try {
      localStorage.setItem('gmail_search_history', JSON.stringify(this.searchHistory));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  getOperators(): SearchOperator[] {
    return GMAIL_SEARCH_OPERATORS;
  }

  getSearchHistory(): SearchHistory {
    return this.searchHistory;
  }

  async saveSearch(query: SearchQuery): Promise<void> {
    query.isSaved = true;
    
    // Remove from recent searches if it exists
    this.searchHistory.recentSearches = this.searchHistory.recentSearches.filter(
      s => s.id !== query.id
    );
    
    // Add to saved searches
    this.searchHistory.savedSearches.unshift(query);
    
    // Limit saved searches
    if (this.searchHistory.savedSearches.length > this.config.maxSavedSearches) {
      this.searchHistory.savedSearches = this.searchHistory.savedSearches.slice(0, this.config.maxSavedSearches);
    }
    
    await this.saveSearchHistory();
  }

  async deleteSearch(searchId: string): Promise<void> {
    this.searchHistory.recentSearches = this.searchHistory.recentSearches.filter(
      s => s.id !== searchId
    );
    this.searchHistory.savedSearches = this.searchHistory.savedSearches.filter(
      s => s.id !== searchId
    );
    
    await this.saveSearchHistory();
  }

  async clearSearchHistory(): Promise<void> {
    this.searchHistory.recentSearches = [];
    this.searchHistory.savedSearches = [];
    this.searchHistory.searchStats = {
      totalSearches: 0,
      mostUsedOperators: [],
      averageSearchTime: 0,
      lastSearchAt: undefined
    };
    
    await this.saveSearchHistory();
  }

  updateConfig(config: Partial<SearchConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Save config to storage
    localStorage.setItem('gmail_search_config', JSON.stringify(this.config));
  }

  getConfig(): SearchConfig {
    return this.config;
  }
}

export const searchService = SearchService.getInstance(); 

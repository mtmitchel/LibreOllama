/**
 * Gmail Search Types - Phase 2.1
 * 
 * Comprehensive search functionality with advanced filters, operators,
 * and search history management.
 */

export interface SearchFilter {
  id: string;
  type: 'text' | 'date' | 'boolean' | 'select' | 'multiselect';
  label: string;
  description: string;
  operator: string;
  value: any;
  placeholder?: string;
  options?: { label: string; value: any }[];
}

export interface SearchQuery {
  id: string;
  query: string;
  filters: SearchFilter[];
  accountId: string;
  createdAt: Date;
  lastUsed: Date;
  usageCount: number;
  isSaved: boolean;
  name?: string;
  description?: string;
}

export interface SearchOperator {
  key: string;
  label: string;
  description: string;
  example: string;
  category: 'basic' | 'advanced' | 'date' | 'size' | 'label';
}

export interface SearchSuggestion {
  id: string;
  type: 'operator' | 'recent' | 'saved' | 'smart';
  text: string;
  description: string;
  query?: string;
  insertText?: string;
  priority: number;
}

export interface SearchResult {
  query: string;
  filters: SearchFilter[];
  messages: string[]; // Message IDs
  totalCount: number;
  nextPageToken?: string;
  searchTime: number;
  facets: SearchFacet[];
  suggestions: SearchSuggestion[];
}

export interface SearchFacet {
  type: 'sender' | 'label' | 'date' | 'size' | 'attachment';
  label: string;
  count: number;
  value: string;
  query: string;
}

export interface SearchHistory {
  recentSearches: SearchQuery[];
  savedSearches: SearchQuery[];
  searchStats: {
    totalSearches: number;
    mostUsedOperators: string[];
    averageSearchTime: number;
    lastSearchAt?: Date;
  };
}

export interface AdvancedSearchFilters {
  from?: string;
  to?: string;
  subject?: string;
  body?: string;
  hasAttachment?: boolean;
  attachmentType?: string;
  dateRange?: {
    start?: Date;
    end?: Date;
    preset?: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'last90days' | 'lastyear';
  };
  sizeRange?: {
    min?: number;
    max?: number;
    unit: 'bytes' | 'KB' | 'MB' | 'GB';
  };
  labels?: string[];
  excludeLabels?: string[];
  isRead?: boolean;
  isStarred?: boolean;
  isImportant?: boolean;
  hasAttachments?: boolean;
  inFolder?: string;
  priority?: 'high' | 'normal' | 'low';
}

export interface SearchConfig {
  maxRecentSearches: number;
  maxSavedSearches: number;
  enableSmartSuggestions: boolean;
  enableSearchHistory: boolean;
  enableAutoComplete: boolean;
  searchDelay: number; // milliseconds
  highlightResults: boolean;
  saveSearchHistory: boolean;
}

export interface SearchState {
  currentQuery: string;
  currentFilters: SearchFilter[];
  isSearching: boolean;
  results: SearchResult | null;
  history: SearchHistory;
  config: SearchConfig;
  suggestions: SearchSuggestion[];
  isAdvancedSearchOpen: boolean;
  selectedFacets: SearchFacet[];
  searchError: string | null;
}

export interface SearchActions {
  // Basic search
  search: (query: string, filters?: SearchFilter[]) => Promise<void>;
  clearSearch: () => void;
  
  // Advanced search
  setAdvancedFilters: (filters: AdvancedSearchFilters) => Promise<void>;
  toggleAdvancedSearch: () => void;
  
  // Search history
  saveSearch: (query: SearchQuery) => Promise<void>;
  deleteSearch: (searchId: string) => Promise<void>;
  loadRecentSearches: () => Promise<void>;
  clearSearchHistory: () => Promise<void>;
  
  // Search suggestions
  getSuggestions: (query: string) => Promise<SearchSuggestion[]>;
  
  // Search operators
  getOperators: () => SearchOperator[];
  
  // Search facets
  applyFacet: (facet: SearchFacet) => Promise<void>;
  removeFacet: (facet: SearchFacet) => Promise<void>;
  
  // Search config
  updateConfig: (config: Partial<SearchConfig>) => void;
}

// Gmail Search Operators
export const GMAIL_SEARCH_OPERATORS: SearchOperator[] = [
  // Basic operators
  {
    key: 'from',
    label: 'From',
    description: 'Search emails from specific sender',
    example: 'from:john@example.com',
    category: 'basic'
  },
  {
    key: 'to',
    label: 'To',
    description: 'Search emails sent to specific recipient',
    example: 'to:mary@example.com',
    category: 'basic'
  },
  {
    key: 'subject',
    label: 'Subject',
    description: 'Search emails with specific subject',
    example: 'subject:meeting',
    category: 'basic'
  },
  {
    key: 'body',
    label: 'Body',
    description: 'Search within email body',
    example: 'body:project update',
    category: 'basic'
  },
  
  // Advanced operators
  {
    key: 'has',
    label: 'Has',
    description: 'Search emails with specific content',
    example: 'has:attachment',
    category: 'advanced'
  },
  {
    key: 'is',
    label: 'Is',
    description: 'Search emails with specific status',
    example: 'is:unread',
    category: 'advanced'
  },
  {
    key: 'label',
    label: 'Label',
    description: 'Search emails with specific label',
    example: 'label:important',
    category: 'label'
  },
  {
    key: 'in',
    label: 'In',
    description: 'Search emails in specific folder',
    example: 'in:inbox',
    category: 'label'
  },
  
  // Date operators
  {
    key: 'after',
    label: 'After',
    description: 'Search emails after specific date',
    example: 'after:2023/01/01',
    category: 'date'
  },
  {
    key: 'before',
    label: 'Before',
    description: 'Search emails before specific date',
    example: 'before:2023/12/31',
    category: 'date'
  },
  {
    key: 'older_than',
    label: 'Older Than',
    description: 'Search emails older than specified time',
    example: 'older_than:7d',
    category: 'date'
  },
  {
    key: 'newer_than',
    label: 'Newer Than',
    description: 'Search emails newer than specified time',
    example: 'newer_than:2h',
    category: 'date'
  },
  
  // Size operators
  {
    key: 'size',
    label: 'Size',
    description: 'Search emails by size',
    example: 'size:5MB',
    category: 'size'
  },
  {
    key: 'larger',
    label: 'Larger',
    description: 'Search emails larger than specified size',
    example: 'larger:10MB',
    category: 'size'
  },
  {
    key: 'smaller',
    label: 'Smaller',
    description: 'Search emails smaller than specified size',
    example: 'smaller:1MB',
    category: 'size'
  }
];

// Predefined search queries
export const PREDEFINED_SEARCHES: Partial<SearchQuery>[] = [
  {
    name: 'Unread emails',
    query: 'is:unread',
    description: 'All unread emails'
  },
  {
    name: 'Starred emails',
    query: 'is:starred',
    description: 'All starred emails'
  },
  {
    name: 'Important emails',
    query: 'is:important',
    description: 'All important emails'
  },
  {
    name: 'Emails with attachments',
    query: 'has:attachment',
    description: 'All emails with attachments'
  },
  {
    name: 'Large emails',
    query: 'larger:5MB',
    description: 'Emails larger than 5MB'
  },
  {
    name: 'Recent emails',
    query: 'newer_than:1d',
    description: 'Emails from the last day'
  },
  {
    name: 'This week',
    query: 'newer_than:1w',
    description: 'Emails from this week'
  },
  {
    name: 'Last month',
    query: 'older_than:1w newer_than:1m',
    description: 'Emails from last month'
  }
]; 

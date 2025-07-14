import React, { useState, useRef, useEffect } from 'react';
import { Search, BookOpen, Calendar, Scale, Tag, Zap, ChevronDown, ChevronUp, Copy, Plus } from 'lucide-react';
import { SearchOperator, GMAIL_SEARCH_OPERATORS } from '../types/search';

interface SearchOperatorsProps {
  isOpen: boolean;
  onClose: () => void;
  onOperatorSelect: (operator: SearchOperator, value?: string) => void;
  onInsertQuery: (query: string) => void;
  currentQuery?: string;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

const categoryIcons = {
  basic: Search,
  advanced: Zap,
  date: Calendar,
  size: Scale,
  label: Tag
};

const categoryLabels = {
  basic: 'Basic Search',
  advanced: 'Advanced',
  date: 'Date & Time',
  size: 'Size',
  label: 'Labels & Folders'
};

const SearchOperators: React.FC<SearchOperatorsProps> = ({
  isOpen,
  onClose,
  onOperatorSelect,
  onInsertQuery,
  currentQuery = '',
  triggerRef
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOperators, setExpandedOperators] = useState<Set<string>>(new Set());
  const [position, setPosition] = useState({ top: 0, left: 0 });
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Calculate position relative to trigger
  useEffect(() => {
    if (isOpen && triggerRef?.current) {
      const trigger = triggerRef.current;
      const rect = trigger.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      const dropdownHeight = 500;
      const dropdownWidth = 400;

      let top = rect.bottom + 8;
      let left = rect.left;

      // Adjust if dropdown goes below viewport
      if (top + dropdownHeight > viewportHeight) {
        top = rect.top - dropdownHeight - 8;
      }

      // Adjust if dropdown goes beyond right edge
      if (left + dropdownWidth > viewportWidth) {
        left = viewportWidth - dropdownWidth - 16;
      }

      // Ensure dropdown doesn't go beyond left edge
      if (left < 16) {
        left = 16;
      }

      setPosition({ top, left });
    }
  }, [isOpen, triggerRef]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        (!triggerRef?.current || !triggerRef.current.contains(event.target as Node))
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, triggerRef, onClose]);

  const filteredOperators = GMAIL_SEARCH_OPERATORS.filter(operator => {
    const matchesSearch = searchTerm === '' || 
      operator.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      operator.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      operator.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === null || operator.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const operatorsByCategory = filteredOperators.reduce((acc, operator) => {
    if (!acc[operator.category]) {
      acc[operator.category] = [];
    }
    acc[operator.category].push(operator);
    return acc;
  }, {} as Record<string, SearchOperator[]>);

  const categories = Object.keys(operatorsByCategory);

  const toggleOperatorExpanded = (operatorKey: string) => {
    setExpandedOperators(prev => {
      const newSet = new Set(prev);
      if (newSet.has(operatorKey)) {
        newSet.delete(operatorKey);
      } else {
        newSet.add(operatorKey);
      }
      return newSet;
    });
  };

  const handleOperatorClick = (operator: SearchOperator) => {
    onOperatorSelect(operator);
    toggleOperatorExpanded(operator.key);
  };

  const handleInsertOperator = (operator: SearchOperator, value: string = '') => {
    const query = value ? `${operator.key}:${value}` : `${operator.key}:`;
    onInsertQuery(query);
  };

  const handleCopyExample = (example: string) => {
    navigator.clipboard.writeText(example);
    // TODO: Show toast notification
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="fixed bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-96 max-h-[500px] overflow-hidden"
      style={{ top: position.top, left: position.left }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
            <h3 className="font-medium text-gray-900">Search Operators</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search operators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mt-3">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              selectedCategory === null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          {Object.keys(categoryLabels).map(category => {
            const Icon = categoryIcons[category as keyof typeof categoryIcons];
            const operatorCount = GMAIL_SEARCH_OPERATORS.filter(op => op.category === category).length;
            
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex items-center space-x-1 px-3 py-1 text-xs rounded-full transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Icon className="h-3 w-3" />
                <span>{categoryLabels[category as keyof typeof categoryLabels]}</span>
                <span className="text-xs opacity-75">({operatorCount})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-h-80 overflow-y-auto">
        {categories.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No operators found matching "{searchTerm}"
          </div>
        ) : (
          <div className="p-2">
            {categories.map(category => {
              const Icon = categoryIcons[category as keyof typeof categoryIcons];
              const operators = operatorsByCategory[category];
              
              return (
                <div key={category} className="mb-4">
                  <div className="flex items-center space-x-2 px-2 py-1 text-sm font-medium text-gray-700 bg-gray-50 rounded">
                    <Icon className="h-4 w-4" />
                    <span>{categoryLabels[category as keyof typeof categoryLabels]}</span>
                    <span className="text-xs text-gray-500">({operators.length})</span>
                  </div>
                  
                  <div className="mt-2 space-y-1">
                    {operators.map(operator => {
                      const isExpanded = expandedOperators.has(operator.key);
                      
                      return (
                        <div key={operator.key} className="border border-gray-100 rounded-lg">
                          {/* Operator Header */}
                          <button
                            onClick={() => handleOperatorClick(operator)}
                            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left"
                          >
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <code className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-mono">
                                  {operator.key}:
                                </code>
                                <span className="font-medium text-gray-900">{operator.label}</span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{operator.description}</p>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            )}
                          </button>

                          {/* Expanded Content */}
                          {isExpanded && (
                            <div className="px-3 pb-3 border-t border-gray-100">
                              <div className="mt-2">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Example:
                                </label>
                                <div className="flex items-center space-x-2">
                                  <code className="flex-1 px-3 py-2 bg-gray-100 text-gray-800 rounded text-sm font-mono">
                                    {operator.example}
                                  </code>
                                  <button
                                    onClick={() => handleCopyExample(operator.example)}
                                    className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                                    title="Copy example"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleInsertOperator(operator, operator.example.split(':')[1])}
                                    className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                                    title="Insert into search"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Quick Insert Options */}
                              <div className="mt-3">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Quick Actions:
                                </label>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleInsertOperator(operator)}
                                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                  >
                                    Insert operator
                                  </button>
                                  <button
                                    onClick={() => onInsertQuery(operator.example)}
                                    className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                                  >
                                    Use example
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-600 text-center">
          Click an operator to expand, or use quick actions to insert into your search.
        </p>
      </div>
    </div>
  );
};

export default SearchOperators; 
/**
 * Custom hook for search functionality with debouncing and state management
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { searchService, SearchType, SearchField } from '../services/searchService';
import type { SearchOptions, SearchResult, SearchStats, SearchSuggestion } from '../services/searchService';
import { useDataContext } from '../context/DataContext';
import type { DonorWithType } from '../types/donor';

export interface UseSearchOptions {
  defaultSearchType?: SearchType;
  defaultSearchField?: SearchField;
  debounceDelay?: number;
  maxResults?: number;
  fuzzyThreshold?: number;
  enableSuggestions?: boolean;
  enableHistory?: boolean;
}

export interface UseSearchReturn {
  // Search state
  query: string;
  searchType: SearchType;
  searchField: SearchField;
  results: SearchResult[];
  stats: SearchStats | null;
  isSearching: boolean;
  
  // Search actions
  setQuery: (query: string) => void;
  setSearchType: (type: SearchType) => void;
  setSearchField: (field: SearchField) => void;
  clearSearch: () => void;
  
  // Suggestions
  suggestions: SearchSuggestion[];
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  
  // History
  searchHistory: string[];
  clearHistory: () => void;
  
  // Advanced filtering
  filters: {
    governmentOnly: boolean;
    nonGovernmentOnly: boolean;
    contributorTypes: string[];
  };
  setFilters: (filters: Partial<UseSearchReturn['filters']>) => void;
  
  // Quick actions
  searchFromHistory: (historyQuery: string) => void;
  searchFromSuggestion: (suggestion: SearchSuggestion) => void;
}

const defaultOptions: UseSearchOptions = {
  defaultSearchType: SearchType.FUZZY,
  defaultSearchField: SearchField.ALL,
  debounceDelay: 300,
  maxResults: 100,
  fuzzyThreshold: 0.3,
  enableSuggestions: true,
  enableHistory: true,
};

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const { donorsWithTypes } = useDataContext();
  const opts = { ...defaultOptions, ...options };

  // Search state
  const [query, setQueryState] = useState('');
  const [searchType, setSearchType] = useState<SearchType>(opts.defaultSearchType!);
  const [searchField, setSearchField] = useState<SearchField>(opts.defaultSearchField!);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [stats, setStats] = useState<SearchStats | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // Suggestions state
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // History state
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  // Filters state
  const [filters, setFiltersState] = useState({
    governmentOnly: false,
    nonGovernmentOnly: false,
    contributorTypes: [] as string[],
  });

  // Initialize search service with data
  useEffect(() => {
    if (donorsWithTypes && donorsWithTypes.length > 0) {
      try {
        searchService.updateData(donorsWithTypes);
        if (opts.enableHistory) {
          setSearchHistory(searchService.getSearchHistory());
        }
      } catch (error) {
        console.error('Error initializing search service:', error);
      }
    }
  }, [donorsWithTypes, opts.enableHistory]);

  // Create search options object
  const searchOptions = useMemo((): SearchOptions => ({
    searchType,
    searchField,
    fuzzyThreshold: opts.fuzzyThreshold!,
    includeScore: true,
    includeMatches: true,
    maxResults: opts.maxResults,
  }), [searchType, searchField, opts.fuzzyThreshold, opts.maxResults]);

  // Debounced search function
  const debouncedSearch = useMemo(
    () => searchService.createDebouncedSearch(opts.debounceDelay),
    [opts.debounceDelay]
  );

  // Apply filters to results
  const applyFilters = useCallback((searchResults: SearchResult[]): SearchResult[] => {
    return searchResults.filter(result => {
      const donor = result.item;
      
      // Government/Non-government filter
      if (filters.governmentOnly && donor.TYPE !== '1') return false;
      if (filters.nonGovernmentOnly && donor.TYPE !== '0') return false;
      
      // Contributor type filter
      if (filters.contributorTypes.length > 0) {
        const contributorType = donor['CONTRIBUTOR TYPE'];
        if (!filters.contributorTypes.includes(contributorType)) return false;
      }
      
      return true;
    });
  }, [filters]);

  // Perform search
  const performSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setStats(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    debouncedSearch(searchQuery, searchOptions, (searchResult) => {
      const filteredResults = applyFilters(searchResult.results);
      setResults(filteredResults);
      setStats({
        ...searchResult.stats,
        totalResults: filteredResults.length,
      });
      setIsSearching(false);
    });
  }, [debouncedSearch, searchOptions, applyFilters]);

  // Update suggestions when query changes
  useEffect(() => {
    if (opts.enableSuggestions && query.trim()) {
      const newSuggestions = searchService.getSuggestions(query, 8);
      setSuggestions(newSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [query, opts.enableSuggestions]);

  // Perform search when query, search type, or filters change
  useEffect(() => {
    performSearch(query);
  }, [query, performSearch]);

  // Re-apply filters when they change
  useEffect(() => {
    if (results.length > 0) {
      const filteredResults = applyFilters(results);
      setResults(filteredResults);
      
      if (stats) {
        setStats({
          ...stats,
          totalResults: filteredResults.length,
        });
      }
    }
  }, [filters, applyFilters]); // Don't include results and stats in deps to avoid infinite loop

  // Update search history when search is performed
  useEffect(() => {
    if (opts.enableHistory) {
      setSearchHistory(searchService.getSearchHistory());
    }
  }, [stats, opts.enableHistory]);

  // Public API
  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery);
    if (newQuery.trim()) {
      setShowSuggestions(true);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setQueryState('');
    setResults([]);
    setStats(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setIsSearching(false);
  }, []);

  const setFilters = useCallback((newFilters: Partial<UseSearchReturn['filters']>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearHistory = useCallback(() => {
    searchService.clearSearchHistory();
    setSearchHistory([]);
  }, []);

  const searchFromHistory = useCallback((historyQuery: string) => {
    setQuery(historyQuery);
    setShowSuggestions(false);
  }, [setQuery]);

  const searchFromSuggestion = useCallback((suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    
    // Adjust search field based on suggestion type
    if (suggestion.type === 'name') {
      setSearchField(SearchField.NAME);
    } else if (suggestion.type === 'code') {
      setSearchField(SearchField.CEB_CODE);
    }
  }, [setQuery]);

  return {
    // Search state
    query,
    searchType,
    searchField,
    results,
    stats,
    isSearching,
    
    // Search actions
    setQuery,
    setSearchType,
    setSearchField,
    clearSearch,
    
    // Suggestions
    suggestions,
    showSuggestions,
    setShowSuggestions,
    
    // History
    searchHistory,
    clearHistory,
    
    // Filters
    filters,
    setFilters,
    
    // Quick actions
    searchFromHistory,
    searchFromSuggestion,
  };
}

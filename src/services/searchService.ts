/**
 * Enhanced Search Service with multiple search algorithms
 * Supports exact, partial, fuzzy (Fuse.js), and soundex matching
 */

import Fuse from 'fuse.js';
import type { FuseResult } from 'fuse.js';
import { debounce } from 'lodash';
import type { DonorWithType } from '../types/donor';
import { soundex, soundexMatch } from '../utils/soundex';

type FuseResultMatch = FuseResult<any>['matches'];
type FuseOptions = Fuse.IFuseOptions<any>;

export const SearchType = {
  EXACT: 'exact',
  PARTIAL: 'partial',
  FUZZY: 'fuzzy',
  SOUNDEX: 'soundex'
} as const

export const SearchField = {
  NAME: 'NAME',
  CEB_CODE: 'CEB CODE',
  ALL: 'ALL'
} as const

export interface SearchOptions {
  searchType: typeof SearchType[keyof typeof SearchType];
  searchField: typeof SearchField[keyof typeof SearchField];
  fuzzyThreshold?: number; // 0.0 (exact) to 1.0 (very fuzzy)
  includeScore?: boolean;
  includeMatches?: boolean;
  maxResults?: number;
}

export interface SearchResult {
  item: DonorWithType;
  score?: number;
  matches?: FuseResultMatch;
  highlightedName?: string;
  highlightedCode?: string;
}

export interface SearchSuggestion {
  text: string;
  type: 'name' | 'code' | 'type';
  count: number;
}

export interface SearchStats {
  totalResults: number;
  searchTime: number;
  searchType: SearchType;
  query: string;
}

class SearchService {
  private fuseInstance: Fuse<DonorWithType> | null = null;
  private donors: DonorWithType[] = [];
  private searchHistory: string[] = [];
  private maxHistorySize = 10;

  // Fuse.js configuration for different search scenarios
  private getFuseOptions(searchField: typeof SearchField[keyof typeof SearchField], threshold: number = 0.3): FuseOptions {
    const keys = searchField === SearchField.ALL 
      ? ['NAME', 'CEB CODE', 'contributorTypeInfo.NAME']
      : [searchField];

    return {
      keys,
      threshold,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
      distance: 100,
      location: 0,
      ignoreLocation: false,
      findAllMatches: true,
      sortFn: (a, b) => {
        // Convert Fuse.js scores to relevance percentages (lower Fuse score = higher relevance)
        const relevanceA = (1 - (a.score ?? 1)) * 100; // Convert to percentage (higher = better)
        const relevanceB = (1 - (b.score ?? 1)) * 100;
        
        // Sort by relevance (highest first), then by name length (shorter first)
        if (Math.abs(relevanceA - relevanceB) > 0.01) return relevanceB - relevanceA; // Higher relevance first
        
        const nameA = a.item?.NAME ?? '';
        const nameB = b.item?.NAME ?? '';
        return nameA.length - nameB.length;
      }
    };
  }

  /**
   * Initialize or update the search service with donor data
   */
  updateData(donors: DonorWithType[]): void {
    this.donors = donors;
    // Create a new Fuse instance with default configuration
    this.fuseInstance = new Fuse(donors, this.getFuseOptions(SearchField.ALL));
  }

  /**
   * Perform search with specified options
   */
  search(query: string, options: SearchOptions): { results: SearchResult[]; stats: SearchStats } {
    const startTime = performance.now();
    
    if (!query.trim()) {
      return {
        results: [],
        stats: {
          totalResults: 0,
          searchTime: 0,
          searchType: options.searchType,
          query: ''
        }
      };
    }

    // Add to search history
    this.addToHistory(query);

    let results: SearchResult[] = [];

    switch (options.searchType) {
      case SearchType.EXACT:
        results = this.exactSearch(query, options);
        break;
      case SearchType.PARTIAL:
        results = this.partialSearch(query, options);
        break;
      case SearchType.FUZZY:
        results = this.fuzzySearch(query, options);
        break;
      case SearchType.SOUNDEX:
        results = this.soundexSearch(query, options);
        break;
    }

    // Apply max results limit
    if (options.maxResults && results.length > options.maxResults) {
      results = results.slice(0, options.maxResults);
    }

    const endTime = performance.now();
    
    return {
      results,
      stats: {
        totalResults: results.length,
        searchTime: endTime - startTime,
        searchType: options.searchType,
        query
      }
    };
  }

  /**
   * Exact match search
   */
  private exactSearch(query: string, options: SearchOptions): SearchResult[] {
    const normalizedQuery = query.toLowerCase().trim();
    
    return this.donors
      .filter(donor => {
        if (options.searchField === SearchField.NAME) {
          return donor.NAME.toLowerCase() === normalizedQuery;
        } else if (options.searchField === SearchField.CEB_CODE) {
          return donor['CEB CODE'].toLowerCase() === normalizedQuery;
        } else {
          return donor.NAME.toLowerCase() === normalizedQuery || 
                 donor['CEB CODE'].toLowerCase() === normalizedQuery;
        }
      })
      .map(item => ({ item, score: 1.0 }));
  }

  /**
   * Partial match search (improved regex)
   */
  private partialSearch(query: string, options: SearchOptions): SearchResult[] {
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQuery, 'gi');
    
    return this.donors
      .filter(donor => {
        if (options.searchField === SearchField.NAME) {
          return regex.test(donor.NAME);
        } else if (options.searchField === SearchField.CEB_CODE) {
          return regex.test(donor['CEB CODE']);
        } else {
          return regex.test(donor.NAME) || regex.test(donor['CEB CODE']);
        }
      })
      .map(item => {
        // Calculate simple relevance score based on match position and length
        const nameMatch = item.NAME.toLowerCase().indexOf(query.toLowerCase());
        const codeMatch = item['CEB CODE'].toLowerCase().indexOf(query.toLowerCase());
        
        let score = 0.5;
        if (nameMatch === 0) score = 0.9; // Starts with query
        else if (nameMatch > 0) score = 0.7; // Contains query
        if (codeMatch === 0) score = Math.max(score, 0.95); // Code starts with query
        else if (codeMatch > 0) score = Math.max(score, 0.75); // Code contains query
        
        return { item, score };
      })
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Fuzzy search using Fuse.js
   */
  private fuzzySearch(query: string, options: SearchOptions): SearchResult[] {
    if (!this.fuseInstance || !this.donors || this.donors.length === 0) return [];

    try {
      // Create Fuse instance with specific configuration for this search
      const fuseOptions = this.getFuseOptions(options.searchField, options.fuzzyThreshold);
      const fuse = new Fuse(this.donors, fuseOptions);
      
      const fuseResults = fuse.search(query);
      
      return fuseResults
        .filter(result => result && result.item) // Filter out any null/undefined results
        .map(result => ({
          item: result.item,
          score: 1 - (result.score ?? 1), // Convert Fuse.js score to relevance percentage (higher = better)
          matches: result.matches,
          highlightedName: this.highlightMatches(result.item?.NAME || '', result.matches?.find(m => m.key === 'NAME')),
          highlightedCode: this.highlightMatches(result.item?.['CEB CODE'] || '', result.matches?.find(m => m.key === 'CEB CODE'))
        }));
    } catch (error) {
      console.error('Fuzzy search error:', error);
      return [];
    }
  }

  /**
   * Soundex "sounds like" search
   */
  private soundexSearch(query: string, options: SearchOptions): SearchResult[] {
    const queryWords = query.trim().split(/\s+/);
    
    return this.donors
      .filter(donor => {
        if (options.searchField === SearchField.NAME) {
          const nameWords = donor.NAME.split(/\s+/);
          return queryWords.some(qWord => 
            nameWords.some(nWord => soundexMatch(qWord, nWord))
          );
        } else if (options.searchField === SearchField.CEB_CODE) {
          return soundexMatch(query, donor['CEB CODE']);
        } else {
          const nameWords = donor.NAME.split(/\s+/);
          return queryWords.some(qWord => 
            nameWords.some(nWord => soundexMatch(qWord, nWord))
          ) || soundexMatch(query, donor['CEB CODE']);
        }
      })
      .map(item => {
        // Calculate soundex similarity score
        const nameWords = item.NAME.split(/\s+/);
        const queryWords = query.split(/\s+/);
        
        let maxSimilarity = 0;
        queryWords.forEach(qWord => {
          nameWords.forEach(nWord => {
            const similarity = soundex(qWord) === soundex(nWord) ? 1 : 0.5;
            maxSimilarity = Math.max(maxSimilarity, similarity);
          });
        });
        
        return { item, score: maxSimilarity };
      })
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Get search suggestions based on current data
   */
  getSuggestions(query: string, maxSuggestions: number = 10): SearchSuggestion[] {
    if (!query.trim()) return [];

    const normalizedQuery = query.toLowerCase();
    const suggestions: Map<string, SearchSuggestion> = new Map();

    this.donors.forEach(donor => {
      // Name suggestions
      if (donor.NAME.toLowerCase().includes(normalizedQuery)) {
        const key = `name:${donor.NAME}`;
        const existing = suggestions.get(key);
        suggestions.set(key, {
          text: donor.NAME,
          type: 'name',
          count: (existing?.count || 0) + 1
        });
      }

      // Code suggestions
      if (donor['CEB CODE'].toLowerCase().includes(normalizedQuery)) {
        const key = `code:${donor['CEB CODE']}`;
        const existing = suggestions.get(key);
        suggestions.set(key, {
          text: donor['CEB CODE'],
          type: 'code',
          count: (existing?.count || 0) + 1
        });
      }

      // Type suggestions
      if (donor.contributorTypeInfo?.NAME.toLowerCase().includes(normalizedQuery)) {
        const key = `type:${donor.contributorTypeInfo.NAME}`;
        const existing = suggestions.get(key);
        suggestions.set(key, {
          text: donor.contributorTypeInfo.NAME,
          type: 'type',
          count: (existing?.count || 0) + 1
        });
      }
    });

    return Array.from(suggestions.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, maxSuggestions);
  }

  /**
   * Get search history
   */
  getSearchHistory(): string[] {
    return [...this.searchHistory];
  }

  /**
   * Clear search history
   */
  clearSearchHistory(): void {
    this.searchHistory = [];
  }

  /**
   * Add query to search history
   */
  private addToHistory(query: string): void {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    // Remove if already exists
    const index = this.searchHistory.indexOf(trimmedQuery);
    if (index > -1) {
      this.searchHistory.splice(index, 1);
    }

    // Add to beginning
    this.searchHistory.unshift(trimmedQuery);

    // Limit history size
    if (this.searchHistory.length > this.maxHistorySize) {
      this.searchHistory = this.searchHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Highlight matched text in search results
   */
  private highlightMatches(text: string, match?: Fuse.FuseResultMatch): string {
    if (!match || !match.indices) return text;

    let highlightedText = '';
    let lastIndex = 0;

    match.indices.forEach(([start, end]) => {
      highlightedText += text.slice(lastIndex, start);
      highlightedText += `<mark>${text.slice(start, end + 1)}</mark>`;
      lastIndex = end + 1;
    });

    highlightedText += text.slice(lastIndex);
    return highlightedText;
  }

  /**
   * Create debounced search function
   */
  createDebouncedSearch(delay: number = 300) {
    return debounce((query: string, options: SearchOptions, callback: (results: { results: SearchResult[]; stats: SearchStats }) => void) => {
      try {
        const results = this.search(query, options);
        callback(results);
      } catch (error) {
        console.error('Search error:', error);
        callback({
          results: [],
          stats: {
            totalResults: 0,
            searchTime: 0,
            searchType: options.searchType,
            query
          }
        });
      }
    }, delay);
  }
}

// Export singleton instance
export const searchService = new SearchService();
export default searchService;

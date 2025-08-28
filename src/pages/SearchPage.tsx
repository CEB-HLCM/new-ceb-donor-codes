import React, { useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Container,
  Card,
  CardContent,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import { useSearch } from '../hooks/useSearch';
import { SearchType, SearchField } from '../services/searchService';
import SearchFilters from '../components/search/SearchFilters';
import SearchSuggestions from '../components/search/SearchSuggestions';
import SearchResults from '../components/search/SearchResults';

const SearchPage: React.FC = () => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const {
    query,
    searchType,
    searchField,
    results,
    stats,
    isSearching,
    setQuery,
    setSearchType,
    setSearchField,
    clearSearch,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    searchHistory,
    clearHistory,
    filters,
    setFilters,
    searchFromHistory,
    searchFromSuggestion,
  } = useSearch({
    defaultSearchType: SearchType.FUZZY,
    defaultSearchField: SearchField.ALL,
    debounceDelay: 300,
    maxResults: 100,
    fuzzyThreshold: 0.3,
    enableSuggestions: true,
    enableHistory: true,
  });

  // Focus search input on component mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowSuggestions]);

  const handleClearFilters = () => {
    setFilters({
      governmentOnly: false,
      nonGovernmentOnly: false,
      contributorTypes: [],
    });
  };

  const handleExportResults = () => {
    // Create CSV data
    const headers = ['NAME', 'CEB CODE', 'TYPE', 'CONTRIBUTOR TYPE', 'RELEVANCE SCORE'];
    const csvData = [
      headers.join(','),
      ...results.map(result => [
        `"${result.item.NAME}"`,
        `"${result.item['CEB CODE']}"`,
        result.item.TYPE === '1' ? 'Government' : 'Non-government',
        `"${result.item.contributorTypeInfo?.NAME || 'Unknown'}"`,
        result.score ? Math.round(result.score * 100) : 'N/A'
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donor-search-results-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Page Header */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Advanced Donor Search
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Find donors using intelligent search with multiple algorithms
        </Typography>
      </Box>

      {/* Search Input with Suggestions */}
      <Card sx={{ mb: 3, overflow: 'visible' }}>
        <CardContent sx={{ overflow: 'visible' }}>
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <TextField
              ref={searchInputRef}
              fullWidth
              placeholder="Search for donors, organizations, or CEB codes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              size="medium"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="primary" />
                  </InputAdornment>
                ),
                endAdornment: query && (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={clearSearch}
                      edge="end"
                      size="small"
                      title="Clear search"
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
                sx: {
                  fontSize: '1.1rem',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
            
            {/* Search Tips Help Icon */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Tooltip
                title={
                  <Box sx={{ p: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Search Tips:
                    </Typography>
                    <Typography variant="body2" component="div" sx={{ lineHeight: 1.4 }}>
                      • <strong>Smart Search (Fuzzy):</strong> Handles typos and variations<br/>
                      &nbsp;&nbsp;(e.g., "unted nations" finds "United Nations")<br/>
                      • <strong>Sounds Like:</strong> Finds similar sounding names<br/>
                      &nbsp;&nbsp;(e.g., "Smith" finds "Smyth")<br/>
                      • <strong>Partial Match:</strong> Finds text anywhere in the field<br/>
                      • <strong>Exact Match:</strong> Finds only exact matches<br/>
                      • Use filters to narrow down results by organization type
                    </Typography>
                  </Box>
                }
                arrow
                placement="bottom-end"
                sx={{ zIndex: 1500 }}
              >
                <IconButton
                  color="primary"
                  size="small"
                  sx={{ 
                    opacity: 0.7,
                    '&:hover': { 
                      opacity: 1,
                      backgroundColor: 'primary.main',
                      color: 'white' 
                    }
                  }}
                >
                  <HelpIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            
            {/* Search Suggestions Dropdown */}
            <SearchSuggestions
              suggestions={suggestions}
              searchHistory={searchHistory}
              query={query}
              show={showSuggestions}
              onSuggestionClick={searchFromSuggestion}
              onHistoryClick={searchFromHistory}
              onClose={() => setShowSuggestions(false)}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Search Filters */}
      <SearchFilters
        searchType={searchType}
        searchField={searchField}
        filters={filters}
        onSearchTypeChange={setSearchType}
        onSearchFieldChange={setSearchField}
        onFiltersChange={setFilters}
        onClearFilters={handleClearFilters}
      />

      {/* Search Results */}
      <SearchResults
        results={results}
        stats={stats}
        isSearching={isSearching}
        onExportResults={handleExportResults}
      />

      {/* Search History Management */}
      {searchHistory.length > 0 && !query && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Recent Searches</Typography>
              <IconButton onClick={clearHistory} size="small" title="Clear history">
                <ClearIcon />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {searchHistory.map((historyItem, index) => (
                <Typography
                  key={index}
                  variant="body2"
                  component="button"
                  onClick={() => searchFromHistory(historyItem)}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    px: 2,
                    py: 0.5,
                    backgroundColor: 'background.paper',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      borderColor: 'primary.main',
                    }
                  }}
                >
                  {historyItem}
                </Typography>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default SearchPage;

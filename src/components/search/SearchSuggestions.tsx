/**
 * Search suggestions dropdown component
 */

import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Typography,
  Chip,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  Code as CodeIcon,
  Category as CategoryIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import type { SearchSuggestion } from '../../services/searchService';

interface SearchSuggestionsProps {
  suggestions: SearchSuggestion[];
  searchHistory: string[];
  query: string;
  show: boolean;
  onSuggestionClick: (suggestion: SearchSuggestion) => void;
  onHistoryClick: (query: string) => void;
  onClose: () => void;
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  suggestions,
  searchHistory,
  query,
  show,
  onSuggestionClick,
  onHistoryClick,
  onClose,
}) => {
  if (!show || (suggestions.length === 0 && searchHistory.length === 0)) {
    return null;
  }

  const getIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'name': return <PersonIcon fontSize="small" />;
      case 'code': return <CodeIcon fontSize="small" />;
      case 'type': return <CategoryIcon fontSize="small" />;
      default: return <PersonIcon fontSize="small" />;
    }
  };

  const getTypeLabel = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'name': return 'Name';
      case 'code': return 'Code';
      case 'type': return 'Type';
      default: return '';
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;
    
    return (
      <>
        {text.slice(0, index)}
        <strong>{text.slice(index, index + query.length)}</strong>
        {text.slice(index + query.length)}
      </>
    );
  };

  // Filter history to only show items that match current query
  const filteredHistory = searchHistory
    .filter(item => item.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 3); // Limit to 3 history items

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        zIndex: 1400, // Higher than Modal (1300) and AppBar (1100)
        maxHeight: 400,
        overflow: 'auto',
        mt: 1,
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Search History */}
      {filteredHistory.length > 0 && (
        <>
          <Box sx={{ px: 2, py: 1, bgcolor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
              Recent Searches
            </Typography>
          </Box>
          <List dense>
            {filteredHistory.map((historyItem, index) => (
              <ListItem
                key={`history-${index}`}
                component="div"
                onClick={() => {
                  onHistoryClick(historyItem);
                  onClose();
                }}
                sx={{ 
                  py: 0.5,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <HistoryIcon fontSize="small" color="action" />
                </ListItemIcon>
                <ListItemText
                  primary={highlightMatch(historyItem, query)}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
          {suggestions.length > 0 && <Divider />}
        </>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <>
          <Box sx={{ px: 2, py: 1, bgcolor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
              Suggestions
            </Typography>
          </Box>
          <List dense>
            {suggestions.map((suggestion, index) => (
              <ListItem
                key={`suggestion-${index}`}
                component="div"
                onClick={() => {
                  onSuggestionClick(suggestion);
                  onClose();
                }}
                sx={{ 
                  py: 0.5,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {getIcon(suggestion.type)}
                </ListItemIcon>
                <ListItemText
                  primary={highlightMatch(suggestion.text, query)}
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Chip
                        label={getTypeLabel(suggestion.type)}
                        size="small"
                        variant="outlined"
                        sx={{ height: 16, fontSize: '0.6rem' }}
                      />
                      {suggestion.count > 1 && (
                        <Chip
                          label={`${suggestion.count} matches`}
                          size="small"
                          color="primary"
                          sx={{ height: 16, fontSize: '0.6rem' }}
                        />
                      )}
                    </Box>
                  }
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItem>
            ))}
          </List>
        </>
      )}

      {/* No suggestions message */}
      {suggestions.length === 0 && filteredHistory.length === 0 && query.trim() && (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No suggestions found for "{query}"
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default SearchSuggestions;

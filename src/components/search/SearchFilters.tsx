/**
 * Advanced search filters component
 */

import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormControlLabel,
  Checkbox,
  Typography,
  Divider,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { SearchType, SearchField } from '../../services/searchService';
import type { UseSearchReturn } from '../../hooks/useSearch';

interface SearchFiltersProps {
  searchType: SearchType;
  searchField: SearchField;
  filters: UseSearchReturn['filters'];
  onSearchTypeChange: (type: SearchType) => void;
  onSearchFieldChange: (field: SearchField) => void;
  onFiltersChange: (filters: Partial<UseSearchReturn['filters']>) => void;
  onClearFilters: () => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  searchType,
  searchField,
  filters,
  onSearchTypeChange,
  onSearchFieldChange,
  onFiltersChange,
  onClearFilters,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Contributor type descriptions based on CONTRIBUTOR_TYPES.csv
  const contributorTypeDescriptions = {
    'C01': {
      name: 'Government',
      description: 'Local Government - Any local (sub national) government organisation in either contributor or recipient country.\nOther Public Sector – Any other public sector organization falling within the government'
    },
    'C02': {
      name: 'NGOs',
      description: 'Non-Governmental Organizations - Independent, non-profit organizations that operate independently of government'
    },
    'C03': {
      name: 'Foundations',
      description: 'Private or public foundations that provide funding for charitable, educational, religious, or other activities'
    },
    'C04': {
      name: 'Academic, Training and Research',
      description: 'Universities, research institutions, training centers, and academic organizations'
    },
    'C05': {
      name: 'Private Sector',
      description: 'Private companies, corporations, and for-profit business entities'
    },
    'C06': {
      name: 'Multilateral - UN organizations excluding pooled funds',
      description: 'United Nations agencies and organizations, excluding pooled funding mechanisms'
    },
    'C07': {
      name: 'Multilateral - Others',
      description: 'Other multilateral organizations and institutions not covered by other categories'
    },
    'C08': {
      name: 'Other - Other Contributor',
      description: 'Contributors that do not fit into the standard categories above'
    },
    'C09': {
      name: 'Public Private Partnership',
      description: 'Collaborative arrangements between public and private sector entities'
    },
    'C10': {
      name: 'Other Categories',
      description: 'Additional contributor types including Global vertical funds, International Financial Institutions, and European Union'
    }
  };

  const contributorTypeOptions = Object.keys(contributorTypeDescriptions);

  const handleContributorTypeToggle = (type: string) => {
    const newTypes = filters.contributorTypes.includes(type)
      ? filters.contributorTypes.filter(t => t !== type)
      : [...filters.contributorTypes, type];
    
    onFiltersChange({ contributorTypes: newTypes });
  };

  const getSearchTypeLabel = (type: SearchType): string => {
    switch (type) {
      case SearchType.EXACT: return 'Exact Match';
      case SearchType.PARTIAL: return 'Partial Match';
      case SearchType.FUZZY: return 'Smart Search (Fuzzy)';
      case SearchType.SOUNDEX: return 'Sounds Like';
      default: return type;
    }
  };

  const getSearchTypeDescription = (type: SearchType): string => {
    switch (type) {
      case SearchType.EXACT: return 'Find exact matches only';
      case SearchType.PARTIAL: return 'Find partial matches within text';
      case SearchType.FUZZY: return 'Intelligent search that handles typos and variations';
      case SearchType.SOUNDEX: return 'Find names that sound similar (phonetic matching)';
      default: return '';
    }
  };

  const hasActiveFilters = filters.governmentOnly || filters.nonGovernmentOnly || filters.contributorTypes.length > 0;

  return (
    <Box sx={{ mb: 3 }}>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            Search Options
            {hasActiveFilters && (
              <Chip
                label={`${filters.contributorTypes.length + (filters.governmentOnly ? 1 : 0) + (filters.nonGovernmentOnly ? 1 : 0)} filters active`}
                color="primary"
                size="small"
                sx={{ ml: 2 }}
              />
            )}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Search Type and Field */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Search Type</InputLabel>
                <Select
                  value={searchType}
                  label="Search Type"
                  onChange={(e) => onSearchTypeChange(e.target.value as SearchType)}
                >
                  {Object.values(SearchType).map((type) => (
                    <MenuItem key={type} value={type}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {getSearchTypeLabel(type)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {getSearchTypeDescription(type)}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Search In</InputLabel>
                <Select
                  value={searchField}
                  label="Search In"
                  onChange={(e) => onSearchFieldChange(e.target.value as SearchField)}
                >
                  <MenuItem value={SearchField.ALL}>All Fields</MenuItem>
                  <MenuItem value={SearchField.NAME}>Name Only</MenuItem>
                  <MenuItem value={SearchField.CEB_CODE}>CEB Code Only</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Divider />

            {/* Type Filters */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Organization Type
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.governmentOnly}
                      onChange={(e) => onFiltersChange({ 
                        governmentOnly: e.target.checked,
                        nonGovernmentOnly: e.target.checked ? false : filters.nonGovernmentOnly
                      })}
                    />
                  }
                  label="Government Only"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.nonGovernmentOnly}
                      onChange={(e) => onFiltersChange({ 
                        nonGovernmentOnly: e.target.checked,
                        governmentOnly: e.target.checked ? false : filters.governmentOnly
                      })}
                    />
                  }
                  label="Non-Government Only"
                />
              </Box>
            </Box>

            {/* Contributor Type Filters */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Contributor Types
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {contributorTypeOptions.map((type) => {
                  const typeInfo = contributorTypeDescriptions[type as keyof typeof contributorTypeDescriptions];
                  const chipElement = (
                    <Chip
                      key={type}
                      label={`${type} - ${typeInfo.name}`}
                      clickable
                      color={filters.contributorTypes.includes(type) ? 'primary' : 'default'}
                      onClick={() => handleContributorTypeToggle(type)}
                      variant={filters.contributorTypes.includes(type) ? 'filled' : 'outlined'}
                      sx={{ maxWidth: '100%' }}
                    />
                  );

                  // For desktop: wrap in tooltip, for mobile: show description below
                  return isMobile ? chipElement : (
                    <Tooltip
                      key={type}
                      title={
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {type} - {typeInfo.name}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {typeInfo.description.split('\n').map((line, index) => (
                              <React.Fragment key={index}>
                                {line}
                                {index < typeInfo.description.split('\n').length - 1 && <br />}
                              </React.Fragment>
                            ))}
                          </Typography>
                        </Box>
                      }
                      arrow
                      placement="top"
                    >
                      {chipElement}
                    </Tooltip>
                  );
                })}
              </Box>
              
              {/* Mobile: Show descriptions for selected types */}
              {isMobile && filters.contributorTypes.length > 0 && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                    Selected Types:
                  </Typography>
                  {filters.contributorTypes.map((type) => {
                    const typeInfo = contributorTypeDescriptions[type as keyof typeof contributorTypeDescriptions];
                    return (
                      <Box key={type} sx={{ mt: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                          {type}: {typeInfo.name}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.25 }}>
                          {typeInfo.description.split('\n').map((line, index) => (
                            <React.Fragment key={index}>
                              {line}
                              {index < typeInfo.description.split('\n').length - 1 && <br />}
                            </React.Fragment>
                          ))}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={onClearFilters}
                  size="small"
                >
                  Clear All Filters
                </Button>
              </Box>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default SearchFilters;

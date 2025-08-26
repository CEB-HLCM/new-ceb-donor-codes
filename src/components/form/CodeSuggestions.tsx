// Code suggestions selector component

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Stack,
  Tooltip,
  Alert
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import type { GeneratedCodeSuggestion } from '../../types/request';

interface CodeSuggestionsProps {
  suggestions: GeneratedCodeSuggestion[];
  selectedCode: string;
  onCodeSelect: (code: string) => void;
  allowCustomInput?: boolean;
  customCode?: string;
  onCustomCodeChange?: (code: string) => void;
  customCodeValidation?: {
    isValid: boolean;
    isAvailable: boolean;
    issues: string[];
    suggestions: string[];
  };
}

const CodeSuggestions: React.FC<CodeSuggestionsProps> = ({
  suggestions,
  selectedCode,
  onCodeSelect,
  allowCustomInput = true,
  customCode = '',
  onCustomCodeChange,
  customCodeValidation
}) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'success';
    if (confidence >= 60) return 'warning';
    return 'error';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 80) return <CheckIcon fontSize="small" />;
    if (confidence >= 60) return <WarningIcon fontSize="small" />;
    return <ErrorIcon fontSize="small" />;
  };

  const SuggestionOption: React.FC<{ suggestion: GeneratedCodeSuggestion }> = ({ suggestion }) => (
    <Box
      sx={{
        p: 2,
        border: 1,
        borderColor: selectedCode === suggestion.code ? 'primary.main' : 'divider',
        borderRadius: 1,
        backgroundColor: selectedCode === suggestion.code ? 'primary.50' : 'background.paper',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: 'primary.main',
          backgroundColor: 'primary.25'
        }
      }}
      onClick={() => onCodeSelect(suggestion.code)}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Radio
            checked={selectedCode === suggestion.code}
            value={suggestion.code}
            size="small"
          />
          <Typography variant="subtitle1" fontWeight="medium">
            {suggestion.code}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            icon={getConfidenceIcon(suggestion.confidence)}
            label={`${suggestion.confidence}%`}
            size="small"
            color={getConfidenceColor(suggestion.confidence)}
            variant="outlined"
          />
          {!suggestion.isUnique && (
            <Tooltip title="This code conflicts with existing donors">
              <ErrorIcon color="error" fontSize="small" />
            </Tooltip>
          )}
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, ml: 4 }}>
        {suggestion.reasoning}
      </Typography>

      <Box sx={{ ml: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          label={suggestion.pattern.type}
          size="small"
          variant="outlined"
          sx={{ fontSize: '0.7rem' }}
        />
        <Typography variant="caption" color="text.secondary">
          {suggestion.pattern.example}
        </Typography>
      </Box>
    </Box>
  );

  if (suggestions.length === 0) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            No code suggestions available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <FormControl component="fieldset" fullWidth>
          <FormLabel component="legend">
            <Typography variant="h6" gutterBottom>
              Select a Code
            </Typography>
          </FormLabel>

          <RadioGroup
            value={selectedCode}
            onChange={(e) => onCodeSelect(e.target.value)}
          >
            <Stack spacing={2}>
              {/* Generated suggestions */}
              {suggestions.map((suggestion, index) => (
                <FormControlLabel
                  key={`suggestion-${index}`}
                  value={suggestion.code}
                  control={<Box sx={{ display: 'none' }} />} // Hide default radio
                  label=""
                  sx={{ m: 0 }}
                >
                  <SuggestionOption suggestion={suggestion} />
                </FormControlLabel>
              ))}

              {/* Custom code input option */}
              {allowCustomInput && (
                <Box>
                  <FormControlLabel
                    value="custom"
                    control={
                      <Radio
                        checked={selectedCode === 'custom' || (!suggestions.some(s => s.code === selectedCode) && selectedCode !== '')}
                        size="small"
                      />
                    }
                    label={
                      <Typography variant="subtitle1" fontWeight="medium">
                        Use custom code
                      </Typography>
                    }
                    onClick={() => onCodeSelect('custom')}
                    sx={{ mb: 1 }}
                  />
                  
                  {(selectedCode === 'custom' || (!suggestions.some(s => s.code === selectedCode) && selectedCode !== '')) && (
                    <Box sx={{ ml: 4 }}>
                      <Box sx={{ mb: 2 }}>
                        <input
                          type="text"
                          value={customCode}
                          onChange={(e) => onCustomCodeChange?.(e.target.value.toUpperCase())}
                          placeholder="Enter custom code..."
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            fontSize: '14px',
                            fontFamily: 'monospace'
                          }}
                        />
                      </Box>

                      {/* Custom code validation */}
                      {customCode && customCodeValidation && (
                        <Box>
                          {!customCodeValidation.isValid && (
                            <Alert severity="error" sx={{ mb: 1 }}>
                              <Typography variant="body2">
                                Code format issues:
                              </Typography>
                              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                {customCodeValidation.issues.map((issue, i) => (
                                  <li key={i}>
                                    <Typography variant="caption">{issue}</Typography>
                                  </li>
                                ))}
                              </ul>
                            </Alert>
                          )}

                          {customCodeValidation.isValid && !customCodeValidation.isAvailable && (
                            <Alert severity="warning" sx={{ mb: 1 }}>
                              <Typography variant="body2">
                                This code is already in use. Try these alternatives:
                              </Typography>
                              <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {customCodeValidation.suggestions.map((suggestion, i) => (
                                  <Button
                                    key={i}
                                    size="small"
                                    variant="outlined"
                                    onClick={() => {
                                      onCustomCodeChange?.(suggestion);
                                      onCodeSelect(suggestion);
                                    }}
                                  >
                                    {suggestion}
                                  </Button>
                                ))}
                              </Box>
                            </Alert>
                          )}

                          {customCodeValidation.isValid && customCodeValidation.isAvailable && (
                            <Alert severity="success">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CheckIcon fontSize="small" />
                                <Typography variant="body2">
                                  Custom code is valid and available!
                                </Typography>
                              </Box>
                            </Alert>
                          )}
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              )}
            </Stack>
          </RadioGroup>

          {/* Help text */}
          <Box sx={{ mt: 2, p: 1, backgroundColor: 'grey.50', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                <strong>Confidence scores:</strong> Higher percentages indicate better matches with the entity name and uniqueness.
                {' '}
                <strong>Patterns:</strong> Different generation strategies used to create the codes.
              </Typography>
            </Box>
          </Box>
        </FormControl>
      </CardContent>
    </Card>
  );
};

export default CodeSuggestions;

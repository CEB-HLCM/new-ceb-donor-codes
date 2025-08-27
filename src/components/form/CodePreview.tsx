// Live code generation preview component

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  IconButton,
  Stack
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import type { CodeGenerationResult, GeneratedCodeSuggestion } from '../../types/request';

interface CodePreviewProps {
  result: CodeGenerationResult | null;
  isGenerating: boolean;
  error: string | null;
  onRegenerate?: () => void;
  entityName?: string;
  selectedCode?: string;
  onCodeSelect?: (code: string) => void;
}

const CodePreview: React.FC<CodePreviewProps> = ({
  result,
  isGenerating,
  error,
  onRegenerate,
  entityName,
  selectedCode,
  onCodeSelect
}) => {
  if (isGenerating) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary">
              Generating codes for "{entityName}"...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Alert 
            severity="error" 
            action={
              onRegenerate && (
                <IconButton size="small" onClick={onRegenerate}>
                  <RefreshIcon />
                </IconButton>
              )
            }
          >
            <Typography variant="body2">
              {error}
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            Enter an entity name to generate code suggestions
          </Typography>
        </CardContent>
      </Card>
    );
  }

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

  const CodeSuggestionCard: React.FC<{ 
    suggestion: GeneratedCodeSuggestion; 
    isPrimary?: boolean;
  }> = ({ suggestion, isPrimary = false }) => {
    const isSelected = selectedCode === suggestion.code;
    
    return (
      <Box
        sx={{
          p: 2,
          border: 1,
          borderColor: isSelected ? 'primary.main' : (isPrimary ? 'primary.main' : 'divider'),
          borderRadius: 1,
          backgroundColor: isSelected ? 'primary.100' : (isPrimary ? 'primary.50' : 'background.paper'),
          cursor: onCodeSelect ? 'pointer' : 'default',
          transition: 'all 0.2s ease',
          '&:hover': onCodeSelect ? {
            borderColor: 'primary.main',
            backgroundColor: isSelected ? 'primary.100' : 'primary.25'
          } : {}
        }}
        onClick={() => onCodeSelect?.(suggestion.code)}
      >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography 
            variant={isPrimary ? 'h6' : 'subtitle1'} 
            component="span"
            fontWeight={isPrimary ? 'bold' : 'medium'}
          >
            {suggestion.code}
          </Typography>
          {isPrimary && (
            <Chip 
              label="Recommended" 
              size="small" 
              color="primary" 
              variant="outlined"
            />
          )}
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

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        {suggestion.reasoning}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          label={suggestion.pattern.type}
          size="small"
          variant="outlined"
          sx={{ fontSize: '0.7rem' }}
        />
        <Tooltip title={suggestion.pattern.description}>
          <IconButton size="small">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
    );
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" component="h3">
            Generated Codes
          </Typography>
          {onRegenerate && (
            <Tooltip title="Regenerate codes">
              <IconButton size="small" onClick={onRegenerate}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Stack spacing={2}>
          {/* Primary suggestion */}
          <Box>
            <Typography variant="subtitle2" gutterBottom color="primary">
              Primary Suggestion
            </Typography>
            <CodeSuggestionCard suggestion={result.primary} isPrimary />
          </Box>

          {/* Alternative suggestions */}
          {result.alternatives.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Alternative Options
              </Typography>
              <Stack spacing={1}>
                {result.alternatives.map((suggestion, index) => (
                  <CodeSuggestionCard 
                    key={`alt-${index}`} 
                    suggestion={suggestion} 
                  />
                ))}
              </Stack>
            </Box>
          )}

          {/* Generation stats */}
          <Box sx={{ mt: 2, p: 1, backgroundColor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Generated {result.stats.totalGenerated} options in {result.stats.processingTimeMs}ms
              {' • '}
              {result.stats.uniqueCount} unique codes
              {' • '}
              Average confidence: {result.stats.averageConfidence}%
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default CodePreview;

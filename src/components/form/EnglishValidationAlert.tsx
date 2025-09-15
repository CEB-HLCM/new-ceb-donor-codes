// Component for displaying English name validation warnings and suggestions
import React from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  TextField,
  Collapse,
  Button,
  Chip
} from '@mui/material';
import { TranslateOutlined, WarningAmberOutlined, InfoOutlined } from '@mui/icons-material';
import type { EnglishValidationResult } from '../../utils/englishValidation';

interface EnglishValidationAlertProps {
  validation: EnglishValidationResult;
  entityName: string;
  acknowledged: boolean;
  justification: string;
  onAcknowledgeChange: (acknowledged: boolean) => void;
  onJustificationChange: (justification: string) => void;
  onSuggestionApply?: (suggestion: string) => void;
  showJustificationField?: boolean;
}

const EnglishValidationAlert: React.FC<EnglishValidationAlertProps> = ({
  validation,
  entityName,
  acknowledged,
  justification,
  onAcknowledgeChange,
  onJustificationChange,
  onSuggestionApply,
  showJustificationField = true
}) => {
  // Show alert if there are any issues, regardless of overall validity
  // In permissive mode, isValid can be true even with warnings
  if (validation.issues.length === 0) {
    return null;
  }

  const hasErrors = validation.issues.some(issue => issue.type === 'error');
  const hasWarnings = validation.issues.some(issue => issue.type === 'warning');
  const hasInfo = validation.issues.some(issue => issue.type === 'info');

  // Determine alert severity
  const severity = hasErrors ? 'error' : hasWarnings ? 'warning' : 'info';
  const icon = hasErrors ? <WarningAmberOutlined /> : hasWarnings ? <TranslateOutlined /> : <InfoOutlined />;

  return (
    <Alert 
      severity={severity} 
      icon={icon}
      sx={{ mt: 2 }}
    >
      <AlertTitle>
        {hasErrors ? 'Name Language Error' : hasWarnings ? 'Name Language Warning' : 'Name Language Notice'}
      </AlertTitle>
      
      {/* Display validation issues */}
      <Box sx={{ mb: 2 }}>
        {validation.issues.map((issue, index) => (
          <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
            <Chip 
              component="span"
              label={issue.type.toUpperCase()} 
              size="small" 
              color={issue.type === 'error' ? 'error' : issue.type === 'warning' ? 'warning' : 'info'}
              sx={{ mr: 1, fontSize: '0.7rem', height: '20px' }}
            />
            {issue.message}
          </Typography>
        ))}
      </Box>

      {/* Show confidence score if available */}
      {validation.confidence < 0.8 && (
        <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
          Confidence: {Math.round(validation.confidence * 100)}% English
        </Typography>
      )}

      {/* Display suggestions */}
      {validation.suggestions && validation.suggestions.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
            Suggestions:
          </Typography>
          {validation.suggestions.map((suggestion, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                • {suggestion}
              </Typography>
              {onSuggestionApply && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    // Extract the suggested name from the suggestion text
                    const match = suggestion.match(/"([^"]+)"/);
                    if (match) {
                      onSuggestionApply(match[1]);
                    }
                  }}
                  sx={{ ml: 1 }}
                >
                  Apply
                </Button>
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* Acknowledgment checkbox for warnings/errors */}
      {(hasWarnings || hasErrors) && (
        <Box sx={{ mb: showJustificationField ? 2 : 0 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={acknowledged}
                onChange={(e) => onAcknowledgeChange(e.target.checked)}
                size="small"
              />
            }
            label={
              <Typography variant="body2">
                I understand this name may not be in English and will provide justification
              </Typography>
            }
          />
        </Box>
      )}

      {/* Justification field */}
      <Collapse in={acknowledged && showJustificationField}>
        <TextField
          label="Justification for Non-English Name"
          multiline
          rows={3}
          fullWidth
          value={justification}
          onChange={(e) => onJustificationChange(e.target.value)}
          helperText="Please explain why this entity name cannot be provided in English (e.g., official name, legal requirement, etc.)"
          placeholder="Example: This is the official legal name of the organization as registered in France..."
          sx={{ mt: 1 }}
        />
      </Collapse>

      {/* Additional guidance */}
      <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
        <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
          Why English names are preferred:
        </Typography>
        <Typography variant="body2" component="ul" sx={{ m: 0, pl: 2 }}>
          <li>Ensures consistency in the CEB donor database</li>
          <li>Improves searchability and reduces confusion</li>
          <li>Facilitates international communication and reporting</li>
          <li>Aligns with UN system standardization practices</li>
        </Typography>
      </Box>
    </Alert>
  );
};

export default EnglishValidationAlert;

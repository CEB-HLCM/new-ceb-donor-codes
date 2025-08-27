// Form validation summary component

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Chip,
  Stack
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';

interface ValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface ValidationSummaryProps {
  issues: ValidationIssue[];
  isValid: boolean;
  completionPercentage: number;
  showProgress?: boolean;
  compact?: boolean;
}

const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  issues = [],
  isValid,
  completionPercentage,
  showProgress = true,
  compact = false
}) => {
  // Defensive programming: ensure issues is always an array
  const safeIssues = Array.isArray(issues) ? issues : [];
  
  const errorCount = safeIssues.filter(issue => issue.severity === 'error').length;
  const warningCount = safeIssues.filter(issue => issue.severity === 'warning').length;
  const infoCount = safeIssues.filter(issue => issue.severity === 'info').length;

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <ErrorIcon color="error" fontSize="small" />;
      case 'warning':
        return <WarningIcon color="warning" fontSize="small" />;
      case 'info':
        return <InfoIcon color="info" fontSize="small" />;
      default:
        return <CheckIcon color="success" fontSize="small" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'success';
    }
  };

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {showProgress && (
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Form Completion
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {Math.round(completionPercentage)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={completionPercentage}
              color={isValid ? 'success' : 'warning'}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}
        
        <Stack direction="row" spacing={1}>
          {errorCount > 0 && (
            <Chip
              icon={<ErrorIcon fontSize="small" />}
              label={errorCount}
              size="small"
              color="error"
              variant="outlined"
            />
          )}
          {warningCount > 0 && (
            <Chip
              icon={<WarningIcon fontSize="small" />}
              label={warningCount}
              size="small"
              color="warning"
              variant="outlined"
            />
          )}
          {isValid && safeIssues.length === 0 && (
            <Chip
              icon={<CheckIcon fontSize="small" />}
              label="Valid"
              size="small"
              color="success"
              variant="outlined"
            />
          )}
        </Stack>
      </Box>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Form Validation
        </Typography>

        {showProgress && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Completion Progress
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {Math.round(completionPercentage)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={completionPercentage}
              color={isValid ? 'success' : 'warning'}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )}

        {/* Summary stats */}
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckIcon 
              color={isValid ? 'success' : 'disabled'} 
              fontSize="small" 
            />
            <Typography variant="body2">
              {isValid ? 'Valid' : 'Issues found'}
            </Typography>
          </Box>
          
          {errorCount > 0 && (
            <Chip
              icon={<ErrorIcon fontSize="small" />}
              label={`${errorCount} Error${errorCount !== 1 ? 's' : ''}`}
              size="small"
              color="error"
              variant="outlined"
            />
          )}
          
          {warningCount > 0 && (
            <Chip
              icon={<WarningIcon fontSize="small" />}
              label={`${warningCount} Warning${warningCount !== 1 ? 's' : ''}`}
              size="small"
              color="warning"
              variant="outlined"
            />
          )}
          
          {infoCount > 0 && (
            <Chip
              icon={<InfoIcon fontSize="small" />}
              label={`${infoCount} Tip${infoCount !== 1 ? 's' : ''}`}
              size="small"
              color="info"
              variant="outlined"
            />
          )}
        </Stack>

        {/* Issue list */}
        {safeIssues.length > 0 ? (
          <List dense>
            {safeIssues.map((issue, index) => (
              <ListItem key={index} sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {getIcon(issue.severity)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" component="span">
                        <strong>{issue.field}:</strong> {issue.message}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Alert severity="success" sx={{ mt: 1 }}>
            <Typography variant="body2">
              All form fields are valid! You can proceed with submission.
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default ValidationSummary;

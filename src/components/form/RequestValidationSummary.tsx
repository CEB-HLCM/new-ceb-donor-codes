// Enhanced request validation summary component for Phase 5

import React, { useMemo } from 'react';
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
  Chip,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ExpandMore as ExpandIcon,
  Code as CodeIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

import type { DonorRequest } from '../../types/request';
import { useAppData } from '../../hooks/useAppData';

interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  field?: string;
  suggestion?: string;
}

interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100
  issues: ValidationIssue[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

interface RequestValidationSummaryProps {
  requests: DonorRequest[];
  onValidationComplete?: (results: { [requestId: string]: ValidationResult }) => void;
}

const RequestValidationSummary: React.FC<RequestValidationSummaryProps> = ({
  requests,
  onValidationComplete
}) => {
  const { donors } = useAppData();

  // Comprehensive validation logic
  const validationResults = useMemo(() => {
    const results: { [requestId: string]: ValidationResult } = {};

    requests.forEach(request => {
      const issues: ValidationIssue[] = [];

      // 1. Entity Name Validation
      if (!request.entityName.trim()) {
        issues.push({
          type: 'error',
          message: 'Entity name is required',
          field: 'entityName'
        });
      } else if (request.entityName.length < 3) {
        issues.push({
          type: 'warning',
          message: 'Entity name is very short',
          field: 'entityName',
          suggestion: 'Consider using the full organization name'
        });
      } else if (!/^[a-zA-Z0-9\s\-\(\)\/&\.]+$/.test(request.entityName)) {
        issues.push({
          type: 'warning',
          message: 'Entity name contains special characters',
          field: 'entityName',
          suggestion: 'Ensure special characters are appropriate for an organization name'
        });
      }

      // 2. Code Validation (relaxed for removal requests)
      const proposedCode = request.customCode || request.suggestedCode;
      if (!proposedCode.trim()) {
        issues.push({
          type: 'error',
          message: 'Donor code is required',
          field: 'code'
        });
      } else {
        // For removal requests, be much more lenient with code validation
        if (request.action === 'remove') {
          // For removal: only check if code exists in database (more lenient)
          const existingDonor = donors.find(d => d['CEB CODE'] === proposedCode);
          if (!existingDonor) {
            issues.push({
              type: 'warning',
              message: `Code "${proposedCode}" not found in current database`,
              field: 'code',
              suggestion: 'Verify this is the correct code to remove, or it may have been removed already'
            });
          }
          
          // Only basic format check for removal (allow more flexibility)
          if (proposedCode.length < 2 || proposedCode.length > 15) {
            issues.push({
              type: 'info',
              message: 'Code length seems unusual for removal',
              field: 'code',
              suggestion: 'Double-check this is the correct code'
            });
          }
        } else {
          // For new/update requests: strict validation as before
          if (!/^[A-Z0-9]+$/.test(proposedCode)) {
            issues.push({
              type: 'error',
              message: 'Code must contain only uppercase letters and numbers',
              field: 'code'
            });
          }

          if (proposedCode.length < 3 || proposedCode.length > 10) {
            issues.push({
              type: 'warning',
              message: 'Code length should be between 3-10 characters',
              field: 'code'
            });
          }

          // Check for conflicts with existing codes (only for new requests)
          const existingDonor = donors.find(d => d['CEB CODE'] === proposedCode);
          if (existingDonor && request.action === 'new') {
            issues.push({
              type: 'error',
              message: `Code "${proposedCode}" is already used by "${existingDonor.NAME}"`,
              field: 'code',
              suggestion: 'Choose a different code or verify if this is an update request'
            });
          }

          // Check for similar codes (potential confusion) - only for new/update
          const similarCodes = donors.filter(d => 
            d['CEB CODE'] !== proposedCode && 
            (d['CEB CODE'].includes(proposedCode) || proposedCode.includes(d['CEB CODE']))
          );
          if (similarCodes.length > 0 && request.action === 'new') {
            issues.push({
              type: 'info',
              message: `Similar codes exist: ${similarCodes.slice(0, 3).map(d => d['CEB CODE']).join(', ')}`,
              field: 'code',
              suggestion: 'Verify this won\'t cause confusion'
            });
          }
        }
      }

      // 3. Contact Information Validation
      if (!request.contactName.trim()) {
        issues.push({
          type: 'error',
          message: 'Contact name is required',
          field: 'contactName'
        });
      }

      if (!request.contactEmail.trim()) {
        issues.push({
          type: 'error',
          message: 'Contact email is required',
          field: 'contactEmail'
        });
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.contactEmail)) {
        issues.push({
          type: 'error',
          message: 'Invalid email format',
          field: 'contactEmail'
        });
      }

      // 4. Justification Validation
      if (!request.justification.trim()) {
        issues.push({
          type: 'error',
          message: 'Justification is required',
          field: 'justification'
        });
      } else if (request.justification.length < 20) {
        issues.push({
          type: 'warning',
          message: 'Justification is quite brief',
          field: 'justification',
          suggestion: 'Provide more detailed reasoning for the request'
        });
      }

      // 5. Action-Specific Validation
      if (request.action === 'update' || request.action === 'remove') {
        if (!request.originalDonor) {
          issues.push({
            type: 'error',
            message: 'Original donor information is missing',
            field: 'originalDonor'
          });
        }
      }

      if (request.action === 'remove' && !request.removalJustification) {
        issues.push({
          type: 'warning',
          message: 'No specific removal justification provided',
          field: 'removalJustification',
          suggestion: 'Consider adding specific reasons for removal'
        });
      }

      // 6. Contributor Type Validation
      if (!request.contributorType) {
        issues.push({
          type: 'error',
          message: 'Contributor type is required',
          field: 'contributorType'
        });
      }

      // Calculate validation score
      const errorCount = issues.filter(i => i.type === 'error').length;
      const warningCount = issues.filter(i => i.type === 'warning').length;
      const infoCount = issues.filter(i => i.type === 'info').length;

      let score = 100;
      score -= errorCount * 25; // -25 per error
      score -= warningCount * 10; // -10 per warning
      score -= infoCount * 2; // -2 per info
      score = Math.max(0, score);

      results[request.id] = {
        isValid: errorCount === 0,
        score,
        issues,
        summary: {
          errors: errorCount,
          warnings: warningCount,
          info: infoCount
        }
      };
    });

    return results;
  }, [requests, donors]);

  // Notify parent component of validation results
  React.useEffect(() => {
    if (onValidationComplete) {
      onValidationComplete(validationResults);
    }
  }, [validationResults, onValidationComplete]);

  // Overall validation summary
  const overallSummary = useMemo(() => {
    const totalRequests = requests.length;
    const validRequests = Object.values(validationResults).filter(r => r.isValid).length;
    const averageScore = totalRequests > 0 
      ? Math.round(Object.values(validationResults).reduce((sum, r) => sum + r.score, 0) / totalRequests)
      : 0;
    
    const totalErrors = Object.values(validationResults).reduce((sum, r) => sum + r.summary.errors, 0);
    const totalWarnings = Object.values(validationResults).reduce((sum, r) => sum + r.summary.warnings, 0);
    const totalInfo = Object.values(validationResults).reduce((sum, r) => sum + r.summary.info, 0);

    return {
      totalRequests,
      validRequests,
      averageScore,
      totalErrors,
      totalWarnings,
      totalInfo
    };
  }, [requests.length, validationResults]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const getIssueIcon = (type: ValidationIssue['type']) => {
    switch (type) {
      case 'error': return <ErrorIcon color="error" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'info': return <InfoIcon color="info" />;
      default: return <InfoIcon />;
    }
  };

  if (requests.length === 0) {
    return (
      <Alert severity="info">
        No requests to validate. Add some requests to see validation results.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Overall Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Validation Summary
          </Typography>
          
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <Chip 
              icon={<SuccessIcon />}
              label={`${overallSummary.validRequests}/${overallSummary.totalRequests} Valid`}
              color={overallSummary.validRequests === overallSummary.totalRequests ? 'success' : 'default'}
            />
            <Chip 
              label={`Score: ${overallSummary.averageScore}%`}
              color={getScoreColor(overallSummary.averageScore) as any}
            />
            {overallSummary.totalErrors > 0 && (
              <Chip 
                icon={<ErrorIcon />}
                label={`${overallSummary.totalErrors} Errors`}
                color="error"
              />
            )}
            {overallSummary.totalWarnings > 0 && (
              <Chip 
                icon={<WarningIcon />}
                label={`${overallSummary.totalWarnings} Warnings`}
                color="warning"
              />
            )}
          </Stack>

          <LinearProgress 
            variant="determinate" 
            value={overallSummary.averageScore} 
            color={getScoreColor(overallSummary.averageScore) as any}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </CardContent>
      </Card>

      {/* Individual Request Validation */}
      {requests.map(request => {
        const result = validationResults[request.id];
        if (!result) return null;

        return (
          <Accordion key={request.id} sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Chip
                  icon={getIssueIcon(result.isValid ? 'info' : 'error')}
                  label={request.action}
                  size="small"
                  color={
                    request.action === 'new' ? 'success' :
                    request.action === 'update' ? 'primary' : 'error'
                  }
                />
                <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                  {request.entityName}
                </Typography>
                <Chip 
                  label={`${result.score}%`}
                  size="small"
                  color={getScoreColor(result.score) as any}
                />
                {result.summary.errors > 0 && (
                  <Chip 
                    label={result.summary.errors}
                    size="small"
                    color="error"
                    sx={{ minWidth: 'auto', '& .MuiChip-label': { px: 1 } }}
                  />
                )}
                {result.summary.warnings > 0 && (
                  <Chip 
                    label={result.summary.warnings}
                    size="small"
                    color="warning"
                    sx={{ minWidth: 'auto', '& .MuiChip-label': { px: 1 } }}
                  />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {result.issues.length === 0 ? (
                <Alert severity="success" icon={<SuccessIcon />}>
                  No validation issues found. This request is ready for submission.
                </Alert>
              ) : (
                <List dense>
                  {result.issues.map((issue, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        {getIssueIcon(issue.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={issue.message}
                        secondary={issue.suggestion}
                        secondaryTypographyProps={{
                          color: 'text.secondary',
                          fontStyle: 'italic'
                        }}
                      />
                      {issue.field && (
                        <Chip 
                          label={issue.field}
                          size="small"
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </ListItem>
                  ))}
                </List>
              )}
            </AccordionDetails>
          </Accordion>
        );
      })}

      {/* Submission Readiness */}
      {overallSummary.totalErrors === 0 ? (
        <Alert severity="success" sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Ready for Submission! 🎉
          </Typography>
          All requests passed validation. You can proceed with submission.
        </Alert>
      ) : (
        <Alert severity="error" sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Cannot Submit Yet
          </Typography>
          Please fix all validation errors before submitting your requests.
        </Alert>
      )}
    </Box>
  );
};

export default RequestValidationSummary;

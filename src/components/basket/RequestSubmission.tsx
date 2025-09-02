// Request submission component with enhanced EmailJS integration

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  LinearProgress,
  Card,
  CardContent,
  Stack,
  Chip,
  Divider
} from '@mui/material';
import {
  Send as SendIcon,
  Email as EmailIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

import { useBasket } from '../../hooks/useBasket';
import { useContactPersistence } from '../../hooks/useContactPersistence';
import { emailService } from '../../services/emailService';
import RequestValidationSummary from '../form/RequestValidationSummary';
import type { EmailSubmissionResult } from '../../services/emailService';

interface RequestSubmissionProps {
  open: boolean;
  onClose: () => void;
  onSubmissionComplete?: (success: boolean, submissionId?: string) => void;
}

const RequestSubmission: React.FC<RequestSubmissionProps> = ({
  open,
  onClose,
  onSubmissionComplete
}) => {
  const { basket, getStats, clearBasket } = useBasket();
  const { contactDetails, updateContactDetails } = useContactPersistence();
  
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<EmailSubmissionResult | null>(null);
  const [step, setStep] = useState<'prepare' | 'validate' | 'submitting' | 'success' | 'error'>('prepare');
  const [validationResults, setValidationResults] = useState<any>(null);
  const [canSubmit, setCanSubmit] = useState(false);

  const stats = getStats();

  // Handle validation completion
  const handleValidationComplete = useCallback((results: any) => {
    setValidationResults(results);
    const hasErrors = Object.values(results).some((result: any) => result.summary.errors > 0);
    setCanSubmit(!hasErrors);
  }, []);

  // Handle moving to validation step
  const handleProceedToValidation = () => {
    setStep('validate');
  };

  // Handle submission
  const handleSubmit = useCallback(async () => {
    if (!contactDetails.contactName || !contactDetails.contactEmail) {
      alert('Please provide contact details before submitting.');
      return;
    }

    setIsSubmitting(true);
    setStep('submitting');

    try {
      // Prepare submission package
      const submission = basket.requests.length > 0 ? {
        requests: basket.requests,
        submissionId: `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        submittedAt: new Date(),
        submittedBy: {
          name: contactDetails.contactName,
          email: contactDetails.contactEmail
        },
        notes: submissionNotes.trim() || undefined
      } : null;

      if (!submission) {
        throw new Error('No requests to submit');
      }

      // Submit via email service
      const result = await emailService.submitRequests(submission);
      
      setSubmissionResult(result);
      
      if (result.success) {
        setStep('success');
        
        // Clear basket after successful submission
        setTimeout(() => {
          clearBasket();
        }, 2000);
        
        // Call completion callback
        onSubmissionComplete?.(true, result.submissionId);
      } else {
        setStep('error');
        onSubmissionComplete?.(false);
      }

    } catch (error) {
      console.error('Submission failed:', error);
      setSubmissionResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown submission error'
      });
      setStep('error');
      onSubmissionComplete?.(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [basket.requests, contactDetails, submissionNotes, clearBasket, onSubmissionComplete]);

  // Handle close with confirmation if needed
  const handleClose = useCallback(() => {
    if (isSubmitting) {
      return; // Don't allow closing during submission
    }
    
    if (step === 'success') {
      // Close immediately after success
      onClose();
      setStep('prepare');
      setSubmissionResult(null);
      setSubmissionNotes('');
      setValidationResults(null);
      setCanSubmit(false);
    } else if (step === 'error') {
      // Allow closing after error
      onClose();
      setStep('prepare');
      setSubmissionResult(null);
      setValidationResults(null);
      setCanSubmit(false);
    } else {
      // Normal close
      onClose();
      if (step === 'validate') {
        setStep('prepare');
        setValidationResults(null);
        setCanSubmit(false);
      }
    }
  }, [isSubmitting, step, onClose]);

  // Update contact details
  const handleContactChange = (field: 'contactName' | 'contactEmail', value: string) => {
    updateContactDetails({ [field]: value });
  };

  if (basket.requests.length === 0) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>No Requests to Submit</DialogTitle>
        <DialogContent>
          <Alert severity="info">
            Your basket is empty. Add some requests before submitting.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      disableEscapeKeyDown={isSubmitting}
      aria-labelledby="submission-dialog-title"
    >
      <DialogTitle id="submission-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <EmailIcon />
        {step === 'prepare' && 'Submit Requests'}
        {step === 'validate' && 'Validate Requests'}
        {step === 'submitting' && 'Submitting Requests...'}
        {step === 'success' && 'Submission Successful'}
        {step === 'error' && 'Submission Failed'}
      </DialogTitle>

      <DialogContent>
        {step === 'prepare' && (
          <Stack spacing={3}>
            {/* Submission Summary */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Submission Summary
                </Typography>
                
                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                  <Chip 
                    label={`Total: ${stats.total}`} 
                    color="primary" 
                    variant="outlined" 
                  />
                  {stats.byAction.new > 0 && (
                    <Chip 
                      label={`New: ${stats.byAction.new}`} 
                      color="success" 
                      variant="outlined" 
                    />
                  )}
                  {stats.byAction.update > 0 && (
                    <Chip 
                      label={`Update: ${stats.byAction.update}`} 
                      color="primary" 
                      variant="outlined" 
                    />
                  )}
                  {stats.byAction.remove > 0 && (
                    <Chip 
                      label={`Remove: ${stats.byAction.remove}`} 
                      color="error" 
                      variant="outlined" 
                    />
                  )}
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  All requests will be sent to the CEB IT Team for processing.
                </Typography>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
              
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Your Name"
                  value={contactDetails.contactName}
                  onChange={(e) => handleContactChange('contactName', e.target.value)}
                  required
                  helperText="Your name will be included in the submission"
                />
                
                <TextField
                  fullWidth
                  label="Your Email"
                  type="email"
                  value={contactDetails.contactEmail}
                  onChange={(e) => handleContactChange('contactEmail', e.target.value)}
                  required
                  helperText="Email for follow-up communication"
                />
              </Stack>
            </Box>

            {/* Additional Notes */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Additional Notes (Optional)
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Additional information for the CEB IT Team"
                value={submissionNotes}
                onChange={(e) => setSubmissionNotes(e.target.value)}
                placeholder="Any additional context or special instructions..."
                helperText={`${submissionNotes.length}/500 characters`}
                inputProps={{ maxLength: 500 }}
              />
            </Box>
          </Stack>
        )}

        {step === 'validate' && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Request Validation
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Please review the validation results below. All errors must be resolved before submission.
            </Typography>
            
            <RequestValidationSummary
              requests={basket.requests}
              onValidationComplete={handleValidationComplete}
            />
          </Box>
        )}

        {step === 'submitting' && (
          <Box sx={{ py: 4 }}>
            <LinearProgress sx={{ mb: 2 }} />
            <Typography align="center" variant="h6" gutterBottom>
              Sending your requests...
            </Typography>
            <Typography align="center" color="text.secondary">
              Please don't close this window while we submit your requests.
            </Typography>
          </Box>
        )}

        {step === 'success' && submissionResult?.success && (
          <Stack spacing={2} alignItems="center" sx={{ py: 4 }}>
            <SuccessIcon color="success" sx={{ fontSize: 64 }} />
            <Typography variant="h6" align="center">
              Requests Submitted Successfully!
            </Typography>
            <Typography align="center" color="text.secondary">
              Submission ID: {submissionResult.submissionId}
            </Typography>
            <Alert severity="success" sx={{ mt: 2 }}>
              Your requests have been sent to the CEB IT Team. 
              You will receive email confirmation and updates on the processing status.
            </Alert>
          </Stack>
        )}

        {step === 'error' && (
          <Stack spacing={2} alignItems="center" sx={{ py: 4 }}>
            <ErrorIcon color="error" sx={{ fontSize: 64 }} />
            <Typography variant="h6" align="center">
              Email Submission Failed
            </Typography>
            <Alert severity="error">
              {submissionResult?.error || 'An unknown error occurred during submission.'}
            </Alert>
            
            {/* Fallback options when email fails */}
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Alternative Options:
              </Typography>
              <Typography variant="body2">
                • Download your requests as CSV and email manually<br/>
                • Save requests in basket and try submitting later<br/>
                • Contact IT support to fix email configuration
              </Typography>
            </Alert>
            
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  // Use basket's export functionality
                  const csvContent = basket.requests.map(req => [
                    req.action.toUpperCase(),
                    req.entityName,
                    req.customCode || req.suggestedCode,
                    req.contributorType,
                    req.contactName,
                    req.contactEmail,
                    req.justification
                  ].map(cell => `"${cell}"`).join(',')).join('\n');
                  
                  const headers = ['Action', 'Entity Name', 'Code', 'Type', 'Contact Name', 'Contact Email', 'Justification'].map(h => `"${h}"`).join(',');
                  const fullCsv = headers + '\n' + csvContent;
                  
                  const blob = new Blob([fullCsv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `donor-requests-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                startIcon={<DownloadIcon />}
              >
                Download CSV
              </Button>
              
              <Button
                variant="outlined"
                onClick={() => {
                  // Keep requests in basket, just close dialog
                  onClose();
                }}
              >
                Keep in Basket
              </Button>
            </Stack>
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        {step === 'prepare' && (
          <>
            <Button onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleProceedToValidation}
              disabled={!contactDetails.contactName || !contactDetails.contactEmail}
            >
              Validate & Submit
            </Button>
          </>
        )}

        {step === 'validate' && (
          <>
            <Button onClick={() => setStep('prepare')}>
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              startIcon={<SendIcon />}
              color={canSubmit ? 'success' : 'primary'}
            >
              {canSubmit ? `Submit ${stats.total} Request${stats.total !== 1 ? 's' : ''}` : 'Fix Errors First'}
            </Button>
          </>
        )}

        {step === 'submitting' && (
          <Button disabled>
            Submitting...
          </Button>
        )}

        {(step === 'success' || step === 'error') && (
          <Button onClick={handleClose} variant="contained">
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default RequestSubmission;

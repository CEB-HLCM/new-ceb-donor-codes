import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Container,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Divider,
  Stack,
  FormHelperText
} from '@mui/material';
import {
  Save as SaveIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  Code as CodeIcon
} from '@mui/icons-material';

import { useDataContext } from '../context/DataContext';
import { useCodeGeneration } from '../hooks/useCodeGeneration';
import CodePreview from '../components/form/CodePreview';
import CodeSuggestions from '../components/form/CodeSuggestions';
import ValidationSummary from '../components/form/ValidationSummary';

import { donorRequestSchema } from '../schemas/donorRequestSchema';
import type { DonorRequestFormData } from '../schemas/donorRequestSchema';
import { z } from 'zod';

const steps = [
  'Entity Information',
  'Code Selection', 
  'Contact Details',
  'Review & Submit'
];

const DonorRequestPage: React.FC = () => {
  const { contributorTypes } = useDataContext();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedCode, setSelectedCode] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [showCodePreview, setShowCodePreview] = useState(false);

  // Form management
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    trigger,
    getValues
  } = useForm<DonorRequestFormData>({
    resolver: zodResolver(donorRequestSchema),
    defaultValues: {
      entityName: '',
      suggestedCode: '',
      customCode: '',
      contributorType: '',
      justification: '',
      contactEmail: '',
      contactName: '',
      priority: 'normal',
      additionalNotes: ''
    },
    mode: 'onChange'
  });

  // Watch form values for real-time updates
  const entityName = watch('entityName');
  const contributorType = watch('contributorType');
  
  // Code generation
  const {
    result: codeResult,
    isGenerating,
    error: codeError,
    generateCodes,
    validateCustomCode,
    primarySuggestion,
    alternativeSuggestions
  } = useCodeGeneration();

  // Simple draft management without complex hooks to prevent infinite loops
  const [hasDraft, setHasDraft] = useState(false);

  // Auto-generate codes when entity name changes
  useEffect(() => {
    if (entityName && entityName.length >= 3) {
      generateCodes(entityName, { contributorType });
      setShowCodePreview(true);
    } else {
      setShowCodePreview(false);
    }
  }, [entityName, contributorType, generateCodes]);

  // Simple manual save to localStorage - no complex hooks
  const handleSaveDraft = useCallback(() => {
    const formData = getValues();
    try {
      localStorage.setItem('donor-request-draft', JSON.stringify(formData));
      setHasDraft(true);
      console.log('Draft saved successfully');
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [getValues]);

  // Simple clear draft function
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem('donor-request-draft');
      setHasDraft(false);
      console.log('Draft cleared successfully');
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, []);

  // Simple load draft on mount - no complex hooks
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('donor-request-draft');
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        Object.entries(draft).forEach(([key, value]) => {
          if (value) {
            setValue(key as keyof DonorRequestFormData, value);
          }
        });
        setHasDraft(true);
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  }, [setValue]); // Only setValue dependency

  // Code selection handling
  const handleCodeSelect = (code: string) => {
    setSelectedCode(code);
    if (code === 'custom') {
      setValue('suggestedCode', customCode);
    } else {
      setValue('suggestedCode', code);
      setCustomCode('');
    }
    trigger('suggestedCode');
  };

  const handleCustomCodeChange = (code: string) => {
    setCustomCode(code);
    if (selectedCode === 'custom' || selectedCode === '') {
      setValue('suggestedCode', code);
      trigger('suggestedCode');
    }
  };

  // Step navigation with step-specific validation
  const handleNext = async () => {
    let fieldsToValidate: (keyof DonorRequestFormData)[] = [];
    
    // Define fields to validate for each step
    switch (activeStep) {
      case 0: // Step 1: Entity Information
        fieldsToValidate = ['entityName', 'contributorType', 'justification'];
        break;
      case 1: // Step 2: Code Selection
        // For step 2, check if a code is selected or custom code is entered
        const currentCode = watch('suggestedCode');
        if (!currentCode || currentCode.trim() === '') {
          alert('Please select a code or enter a custom code before continuing.');
          return;
        }
        fieldsToValidate = ['suggestedCode'];
        break;
      case 2: // Step 3: Contact Details
        // Check required fields for step 3
        const contactName = watch('contactName');
        const contactEmail = watch('contactEmail');
        const priority = watch('priority');
        
        if (!contactName || contactName.length < 2) {
          alert('Please enter a contact name (at least 2 characters).');
          return;
        }
        if (!contactEmail || !z.string().email().safeParse(contactEmail).success) {
          alert('Please enter a valid email address.');
          return;
        }
        if (!priority || priority === '') {
          alert('Please select a priority level.');
          return;
        }
        fieldsToValidate = ['contactName', 'contactEmail', 'priority'];
        break;
      default:
        fieldsToValidate = []; // Step 4 is review, no new validation
    }
    
    const isStepValid = fieldsToValidate.length === 0 || await trigger(fieldsToValidate);
    if (isStepValid) {
      setActiveStep((prev) => prev + 1);
    } else {
      console.log('Step validation failed for fields:', fieldsToValidate);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  // Form submission
  const onSubmit = async (data: DonorRequestFormData) => {
    try {
      console.log('Submitting donor request:', data);
      // TODO: Implement EmailJS submission
      clearDraft();
      alert('Request submitted successfully! (EmailJS integration pending)');
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit request. Please try again.');
    }
  };

  // Calculate form completion percentage
  const calculateCompletion = () => {
    const formData = getValues();
    const requiredFields = ['entityName', 'suggestedCode', 'contributorType', 'justification', 'contactEmail', 'contactName'];
    const completed = requiredFields.filter(field => formData[field as keyof DonorRequestFormData]).length;
    return (completed / requiredFields.length) * 100;
  };

  // Validation issues for summary
  const getValidationIssues = () => {
    const issues: Array<{field: string; message: string; severity: 'error' | 'warning' | 'info'}> = [];
    
    Object.entries(errors).forEach(([field, error]) => {
      if (error?.message) {
        issues.push({
          field: field.charAt(0).toUpperCase() + field.slice(1),
          message: error.message,
          severity: 'error'
        });
      }
    });

    return issues;
  };

  const customCodeValidation = customCode ? validateCustomCode(customCode) : null;
  const allSuggestions = codeResult ? [codeResult.primary, ...codeResult.alternatives] : [];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Request New Donor Code
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Submit a request for a new donor entity code. Our intelligent system will generate suggestions based on the entity name.
      </Typography>

      {hasDraft && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Draft found! Your previous progress has been restored.
          <Button size="small" onClick={clearDraft} sx={{ ml: 2 }}>
            Clear Draft
          </Button>
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Main Form */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Stepper activeStep={activeStep} orientation="vertical">
                {/* Step 1: Entity Information */}
                <Step>
                  <StepLabel>Entity Information</StepLabel>
                  <StepContent>
                    <Box sx={{ mb: 2 }}>
                      <Controller
                        name="entityName"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Entity Name"
                            placeholder="e.g., World Health Organization"
                            error={!!errors.entityName}
                            helperText={errors.entityName?.message}
                            sx={{ mb: 3 }}
                          />
                        )}
                      />

                      <Controller
                        name="contributorType"
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth error={!!errors.contributorType} sx={{ mb: 3 }}>
                            <InputLabel>Contributor Type</InputLabel>
                            <Select {...field} label="Contributor Type">
                              {contributorTypes.map((type) => (
                                <MenuItem key={type.TYPE} value={type.TYPE}>
                                  {type.TYPE} - {type.NAME}
                                </MenuItem>
                              ))}
                            </Select>
                            {errors.contributorType && (
                              <FormHelperText>{errors.contributorType.message}</FormHelperText>
                            )}
                          </FormControl>
                        )}
                      />

                      <Controller
                        name="justification"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            multiline
                            rows={3}
                            label="Justification"
                            placeholder="Explain why this entity needs a donor code..."
                            error={!!errors.justification}
                            helperText={errors.justification?.message}
                          />
                        )}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button variant="contained" onClick={handleNext}>
                        Continue
                      </Button>
                    </Box>
                  </StepContent>
                </Step>

                {/* Step 2: Code Selection */}
                <Step>
                  <StepLabel>Code Selection</StepLabel>
                  <StepContent>
                    <Box sx={{ mb: 2 }}>
                      {showCodePreview && (
                        <Box sx={{ mb: 3 }}>
                          <CodePreview
                            result={codeResult}
                            isGenerating={isGenerating}
                            error={codeError}
                            entityName={entityName}
                            onRegenerate={() => generateCodes(entityName, { contributorType })}
                          />
                        </Box>
                      )}

                      {allSuggestions.length > 0 && (
                        <CodeSuggestions
                          suggestions={allSuggestions}
                          selectedCode={selectedCode}
                          onCodeSelect={handleCodeSelect}
                          customCode={customCode}
                          onCustomCodeChange={handleCustomCodeChange}
                          customCodeValidation={customCodeValidation}
                        />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button onClick={handleBack}>Back</Button>
                      <Button variant="contained" onClick={handleNext}>
                        Continue
                      </Button>
                    </Box>
                  </StepContent>
                </Step>

                {/* Step 3: Contact Details */}
                <Step>
                  <StepLabel>Contact Details</StepLabel>
                  <StepContent>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Controller
                          name="contactName"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Contact Name"
                              error={!!errors.contactName}
                              helperText={errors.contactName?.message}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Controller
                          name="contactEmail"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Contact Email"
                              type="email"
                              error={!!errors.contactEmail}
                              helperText={errors.contactEmail?.message}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Controller
                          name="priority"
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth>
                              <InputLabel>Priority</InputLabel>
                              <Select {...field} label="Priority">
                                <MenuItem value="low">Low</MenuItem>
                                <MenuItem value="normal">Normal</MenuItem>
                                <MenuItem value="high">High</MenuItem>
                              </Select>
                            </FormControl>
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Controller
                          name="additionalNotes"
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              multiline
                              rows={3}
                              label="Additional Notes (Optional)"
                              placeholder="Any additional information..."
                            />
                          )}
                        />
                      </Grid>
                    </Grid>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button onClick={handleBack}>Back</Button>
                      <Button variant="contained" onClick={handleNext}>
                        Review
                      </Button>
                    </Box>
                  </StepContent>
                </Step>

                {/* Step 4: Review & Submit */}
                <Step>
                  <StepLabel>Review & Submit</StepLabel>
                  <StepContent>
                    <Paper sx={{ p: 2, mb: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Request Summary
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="subtitle2">Entity:</Typography>
                          <Typography>{watch('entityName')}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="subtitle2">Code:</Typography>
                          <Typography fontFamily="monospace" fontWeight="bold">
                            {watch('suggestedCode')}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="subtitle2">Contact:</Typography>
                          <Typography>{watch('contactName')}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="subtitle2">Email:</Typography>
                          <Typography>{watch('contactEmail')}</Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button onClick={handleBack}>Back</Button>
                      <Button
                        variant="contained"
                        onClick={handleSubmit(onSubmit)}
                        disabled={!isValid}
                        startIcon={<SendIcon />}
                      >
                        Submit Request
                      </Button>
                    </Box>
                  </StepContent>
                </Step>
              </Stepper>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>
            {/* Validation Summary */}
            <ValidationSummary
              issues={getValidationIssues()}
              isValid={isValid}
              completionPercentage={calculateCompletion()}
              compact
            />

            {/* Quick Actions */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Stack spacing={1}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveDraft}
                  >
                    Save Draft
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={() => generateCodes(entityName)}
                    disabled={!entityName || isGenerating}
                  >
                    Regenerate Codes
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DonorRequestPage;

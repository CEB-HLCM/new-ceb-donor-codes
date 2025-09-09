import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';

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
import { useContactPersistence } from '../hooks/useContactPersistence';
import { useBasket } from '../hooks/useBasket';
import CodePreview from '../components/form/CodePreview';
import CodeSuggestions from '../components/form/CodeSuggestions';
import ValidationSummary from '../components/form/ValidationSummary';
import EnglishValidationAlert from '../components/form/EnglishValidationAlert';

import { validateEnglishName, getDefaultEnglishValidationConfig } from '../utils/englishValidation';
import type { EnglishValidationResult } from '../utils/englishValidation';

import { donorRequestSchema } from '../schemas/donorRequestSchema';
import type { DonorRequestFormData } from '../schemas/donorRequestSchema';
import type { DonorRequest } from '../types/request';
import { z } from 'zod';

const steps = [
  'Entity Information',
  'Code Selection', 
  'Contact Details',
  'Review & Submit'
];

const DonorRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const { contributorTypes } = useDataContext();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedCode, setSelectedCode] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [showCodePreview, setShowCodePreview] = useState(false);
  
  // English validation state
  const [englishValidation, setEnglishValidation] = useState<EnglishValidationResult | null>(null);
  const [showEnglishWarning, setShowEnglishWarning] = useState(false);

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
      donorType: '0' as const,
      justification: '',
      contactEmail: '',
      contactName: '',
      priority: 'normal' as const,
      additionalNotes: '',
      nonEnglishJustification: '',
      acknowledgeNonEnglish: false
    },
    mode: 'onChange'
  });

  // Watch form values for real-time updates
  const entityName = watch('entityName');
  const contributorType = watch('contributorType');
  const acknowledgeNonEnglish = watch('acknowledgeNonEnglish');
  const nonEnglishJustification = watch('nonEnglishJustification');
  
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

  // Smart contact details persistence
  const { contactDetails, isLoaded: contactLoaded, updateContactDetails } = useContactPersistence();
  
  // Basket management
  const { addRequest } = useBasket();

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

  // Validate English name when entity name changes
  useEffect(() => {
    if (entityName && entityName.length >= 2) {
      const config = getDefaultEnglishValidationConfig();
      const validation = validateEnglishName(entityName, config);
      setEnglishValidation(validation);
      setShowEnglishWarning(!validation.isValid);
    } else {
      setEnglishValidation(null);
      setShowEnglishWarning(false);
    }
  }, [entityName]);

  // Auto-fill contact details from storage when loaded
  useEffect(() => {
    if (contactLoaded && contactDetails.contactName && contactDetails.contactEmail) {
      setValue('contactName', contactDetails.contactName);
      setValue('contactEmail', contactDetails.contactEmail);
    }
  }, [contactLoaded, contactDetails, setValue]);

  // Save contact details when they change and are valid
  const handleContactUpdate = useCallback((field: 'contactName' | 'contactEmail', value: string) => {
    setValue(field, value);
    updateContactDetails({ [field]: value });
  }, [setValue, updateContactDetails]);

  // Simple manual save to localStorage - no complex hooks
  const handleSaveDraft = useCallback(() => {
    const formData = getValues();
    try {
      localStorage.setItem('donor-request-draft', JSON.stringify(formData));
      setHasDraft(true);
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [getValues]);

  // Simple clear draft function
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem('donor-request-draft');
      setHasDraft(false);
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
            setValue(key as keyof DonorRequestFormData, value as any);
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

  // English validation handlers
  const handleAcknowledgeNonEnglish = (acknowledged: boolean) => {
    setValue('acknowledgeNonEnglish', acknowledged);
  };

  const handleNonEnglishJustificationChange = (justification: string) => {
    setValue('nonEnglishJustification', justification);
  };

  const handleSuggestionApply = (suggestion: string) => {
    setValue('entityName', suggestion);
    // Re-trigger validation after applying suggestion
    trigger('entityName');
  };

  // Step navigation with step-specific validation
  const handleNext = async () => {
    let fieldsToValidate: (keyof DonorRequestFormData)[] = [];
    
    // Define fields to validate for each step
    switch (activeStep) {
      case 0: // Step 1: Entity Information
        fieldsToValidate = ['entityName', 'contributorType', 'donorType', 'justification'];
        break;
      case 1: // Step 2: Code Selection
        const currentCode = watch('suggestedCode');
        if (!currentCode || currentCode.trim() === '') {
          alert('Please select a code or enter a custom code before continuing.');
          return;
        }
        fieldsToValidate = ['suggestedCode'];
        break;
      case 2: // Step 3: Contact Details
        fieldsToValidate = ['contactName', 'contactEmail', 'priority'];
        break;
      default:
        fieldsToValidate = []; // Review step
    }
    
    // Perform validation
    const isStepValid = fieldsToValidate.length === 0 || await trigger(fieldsToValidate);
    if (isStepValid) {
      setActiveStep((prev) => prev + 1);
    } else {
      // Show user-friendly error messages
      if (fieldsToValidate.length > 0) {
        const fieldLabels = {
          entityName: 'Entity Name',
          contributorType: 'Contributor Type',
          suggestedCode: 'Suggested Code',
          justification: 'Justification',
          contactName: 'Contact Name',
          contactEmail: 'Contact Email',
          priority: 'Priority',
          removalReason: 'Removal Reason'
        };
        
        const invalidFields = fieldsToValidate
          .filter(field => errors[field])
          .map(field => fieldLabels[field] || field);
          
        if (invalidFields.length > 0) {
          alert(`Please fix the following fields: ${invalidFields.join(', ')}`);
        }
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  // Form submission
  const onSubmit = async (data: DonorRequestFormData) => {
    try {
      // Save contact details for future use
      updateContactDetails({
        contactName: data.contactName,
        contactEmail: data.contactEmail
      });
      
      // Create request object for basket
      const request: DonorRequest = {
        id: `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        action: 'new',
        entityName: data.entityName,
        suggestedCode: data.suggestedCode,
        customCode: data.customCode || undefined,
        contributorType: data.contributorType,
        justification: data.justification,
        contactEmail: data.contactEmail,
        contactName: data.contactName,
        priority: data.priority,
        additionalNotes: data.additionalNotes || undefined,
        createdAt: new Date(),
        status: 'draft'
      };
      
      // Add to basket
      addRequest(request);
      
      // Clear draft and form
      clearDraft();
      
      alert('Request added to basket successfully! You can review and submit multiple requests from the Request Management page.');
      navigate('/requests-list');
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to add request to basket. Please try again.');
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

  // Step content rendering
  const renderStepContent = (stepIndex: number) => {
    return renderNewRequestStep(stepIndex);
  };

  const renderNewRequestStep = (stepIndex: number) => {
    switch (stepIndex) {
      case 0: // Entity Information
        return (
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

            {/* English validation alert */}
            {showEnglishWarning && englishValidation && (
              <EnglishValidationAlert
                validation={englishValidation}
                entityName={entityName}
                acknowledged={acknowledgeNonEnglish || false}
                justification={nonEnglishJustification || ''}
                onAcknowledgeChange={handleAcknowledgeNonEnglish}
                onJustificationChange={handleNonEnglishJustificationChange}
                onSuggestionApply={handleSuggestionApply}
                showJustificationField={true}
              />
            )}

            <Controller
              name="contributorType"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.contributorType} sx={{ mb: 3 }}>
                  <InputLabel>Contributor Type</InputLabel>
                  <Select {...field} label="Contributor Type">
                    {contributorTypes && contributorTypes.length > 0 ? (
                      contributorTypes.map((type) => (
                        <MenuItem key={type.TYPE} value={type.TYPE}>
                          {type.TYPE} - {type.NAME}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled value="">
                        Loading contributor types...
                      </MenuItem>
                    )}
                  </Select>
                  {errors.contributorType && (
                    <FormHelperText>{errors.contributorType.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />

            <Controller
              name="donorType"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.donorType} sx={{ mb: 3 }}>
                  <InputLabel>Donor Type</InputLabel>
                  <Select {...field} label="Donor Type">
                    <MenuItem value="1">Government</MenuItem>
                    <MenuItem value="0">Non-Government</MenuItem>
                  </Select>
                  {errors.donorType && (
                    <FormHelperText>{errors.donorType.message}</FormHelperText>
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
        );
      case 1: // Code Selection
        return (
          <Box>
            {allSuggestions.length > 0 ? (
              <CodeSuggestions
                suggestions={allSuggestions}
                selectedCode={selectedCode}
                onCodeSelect={(code) => {
                  setSelectedCode(code);
                  setValue('suggestedCode', code);
                }}
                customCode={customCode}
                onCustomCodeChange={handleCustomCodeChange}
                customCodeValidation={customCodeValidation}
                isGenerating={isGenerating}
                error={codeError}
                entityName={entityName}
                onRegenerate={() => generateCodes(entityName, { contributorType })}
              />
            ) : (
              <Alert severity="info">
                Enter an entity name in Step 1 to generate code suggestions
              </Alert>
            )}
          </Box>
        );
      case 2: // Contact Details
        return (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="contactName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Contact Name"
                    placeholder="Your full name"
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
                    placeholder="your.email@organization.org"
                    error={!!errors.contactEmail}
                    helperText={errors.contactEmail?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.priority}>
                    <InputLabel>Priority</InputLabel>
                    <Select {...field} label="Priority">
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="normal">Normal</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                    </Select>
                    {errors.priority && (
                      <FormHelperText>{errors.priority.message}</FormHelperText>
                    )}
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
                    placeholder="Any additional information or special requirements..."
                    error={!!errors.additionalNotes}
                    helperText={errors.additionalNotes?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        );
      case 3: // Review & Submit
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Please review your request carefully before submission. Once submitted, changes cannot be made.
            </Alert>
            
            <Typography variant="h6" gutterBottom>Request Summary</Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">Entity Name:</Typography>
                  <Typography>{entityName}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">Suggested Code:</Typography>
                  <Typography fontFamily="monospace">{selectedCode || customCode}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">Contributor Type:</Typography>
                  <Typography>{contributorType}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">Priority:</Typography>
                  <Typography>{watch('priority')}</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        );
      default:
        return null;
    }
  };



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

      {/* Main Form - Single Column Layout */}
      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((stepLabel, index) => (
              <Step key={index}>
                <StepLabel>{stepLabel}</StepLabel>
                <StepContent>
                  {renderStepContent(index)}
                  
                  {/* Navigation Buttons */}
                  <Box sx={{ mb: 1, mt: 2 }}>
                    <div>
                      <Button
                        disabled={index === 0}
                        onClick={handleBack}
                        sx={{ mt: 1, mr: 1 }}
                      >
                        Back
                      </Button>
                      <Button
                        variant="contained"
                        onClick={index === steps.length - 1 ? handleSubmit(onSubmit) : handleNext}
                        sx={{ mt: 1, mr: 1 }}
                      >
                        {index === steps.length - 1 ? 'Submit' : 'Continue'}
                      </Button>
                    </div>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>
    </Container>
  );
};

export default DonorRequestPage;
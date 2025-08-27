import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  FormHelperText,
  CircularProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  Update as UpdateIcon
} from '@mui/icons-material';

import { useDataContext } from '../context/DataContext';
import { useCodeGeneration } from '../hooks/useCodeGeneration';

import CodeSuggestions from '../components/form/CodeSuggestions';
import ValidationSummary from '../components/form/ValidationSummary';
import OriginalDonorCard from '../components/form/OriginalDonorCard';
import ChangesSummary from '../components/form/ChangesSummary';

import { donorRequestSchema } from '../schemas/donorRequestSchema';
import type { DonorRequestFormData } from '../schemas/donorRequestSchema';
import type { DonorData, DonorRequest } from '../types/request';

const steps = [
  'Review Current Information',
  'Update Entity Information', 
  'Code Selection',
  'Contact Details',
  'Review Changes & Submit'
];

const DonorUpdatePage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { donorsWithTypes, contributorTypes, loading: dataLoading } = useDataContext();
  
  const [activeStep, setActiveStep] = useState(0);
  const [selectedCode, setSelectedCode] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [showCodePreview, setShowCodePreview] = useState(false);
  const [originalDonor, setOriginalDonor] = useState<DonorData | null>(null);
  const [donorNotFound, setDonorNotFound] = useState(false);

  // Find the donor to update
  useEffect(() => {
    if (!dataLoading && donorsWithTypes.length > 0 && code) {
      const decodedCode = decodeURIComponent(code);
      const donor = donorsWithTypes.find(d => d['CEB CODE'] === decodedCode);
      
      if (donor) {
        const donorData: DonorData = {
          'CEB CODE': donor['CEB CODE'],
          'NAME': donor.NAME,
          'CONTRIBUTOR TYPE': donor['CONTRIBUTOR TYPE'],
          'TYPE': donor.TYPE
        };
        setOriginalDonor(donorData);
        
        // Pre-fill form with existing data
        setValue('entityName', donor.NAME);
        setValue('donorType', donor.TYPE);
        setValue('contributorType', donor['CONTRIBUTOR TYPE']);
        setValue('suggestedCode', donor['CEB CODE']);
        setSelectedCode(donor['CEB CODE']);
        
        setDonorNotFound(false);
      } else {
        setDonorNotFound(true);
      }
    }
  }, [dataLoading, donorsWithTypes, code]);

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
      donorType: '',
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
  const donorType = watch('donorType');
  const contributorType = watch('contributorType');
  const suggestedCode = watch('suggestedCode');
  const priority = watch('priority');
  
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

  // Auto-generate codes when entity name changes (only if different from original)
  useEffect(() => {
    if (entityName && entityName.length >= 3 && originalDonor && entityName !== originalDonor.NAME) {
      generateCodes(entityName, { contributorType });
      setShowCodePreview(true);
    } else if (entityName === originalDonor?.NAME) {
      setShowCodePreview(false);
      setSelectedCode(originalDonor['CEB CODE']);
      setValue('suggestedCode', originalDonor['CEB CODE']);
    }
  }, [entityName, contributorType, generateCodes, originalDonor]);

  // Handle step validation
  const isStepValid = useCallback(async (step: number): Promise<boolean> => {
    const fieldsToValidate: (keyof DonorRequestFormData)[] = [];
    
    switch (step) {
      case 0: // Review - always valid
        return true;
      case 1: // Entity Information
        fieldsToValidate.push('entityName', 'donorType', 'contributorType');
        break;
      case 2: // Code Selection
        fieldsToValidate.push('suggestedCode');
        break;
      case 3: // Contact Details
        fieldsToValidate.push('contactEmail', 'contactName', 'justification');
        break;
      case 4: // Review - check all
        return isValid;
      default:
        return true;
    }
    
    const result = await trigger(fieldsToValidate);
    return result;
  }, [trigger, isValid]);

  const handleNext = useCallback(async () => {
    const isCurrentStepValid = await isStepValid(activeStep);
    if (isCurrentStepValid) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  }, [activeStep, isStepValid]);

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleCodeSelect = (code: string, isCustom: boolean = false) => {
    setSelectedCode(code);
    setValue('suggestedCode', code);
    if (isCustom) {
      setCustomCode(code);
      setValue('customCode', code);
    }
    
    // Removed auto-advance - let user click Continue button
  };

  // Form submission
  const onSubmit = useCallback((data: DonorRequestFormData) => {
    if (!originalDonor) return;

    const updateRequest: DonorRequest = {
      id: `update-${Date.now()}`,
      action: 'update',
      entityName: data.entityName,
      suggestedCode: data.suggestedCode,
      customCode: data.customCode,
      contributorType: data.contributorType,
      justification: data.justification,
      contactEmail: data.contactEmail,
      contactName: data.contactName,
      priority: data.priority,
      additionalNotes: data.additionalNotes || '',
      createdAt: new Date(),
      status: 'draft',
      originalDonor: {
        name: originalDonor.NAME,
        code: originalDonor['CEB CODE'],
        contributorType: originalDonor['CONTRIBUTOR TYPE'],
        type: originalDonor.TYPE
      },
      proposedChanges: {
        name: data.entityName !== originalDonor.NAME ? 
          { from: originalDonor.NAME, to: data.entityName } : undefined,
        code: data.suggestedCode !== originalDonor['CEB CODE'] ? 
          { from: originalDonor['CEB CODE'], to: data.suggestedCode } : undefined,
        contributorType: data.contributorType !== originalDonor['CONTRIBUTOR TYPE'] ? 
          { from: originalDonor['CONTRIBUTOR TYPE'], to: data.contributorType } : undefined
      }
    };

    // TODO: Add to basket (Phase 5)
    console.log('Update request created:', updateRequest);
    
    // For now, show success and navigate back
    alert('Update request created successfully! In Phase 5, this will be added to your request basket.');
    navigate('/donors');
  }, [originalDonor, navigate]);

  // Handle custom code changes
  const handleCustomCodeChange = (code: string) => {
    setCustomCode(code);
    if (selectedCode === 'custom' || selectedCode === '') {
      setValue('suggestedCode', code);
      trigger('suggestedCode');
    }
  };

  // Combine all suggestions for unified CodeSuggestions component (like in new donor form)
  const allSuggestions = codeResult ? [codeResult.primary, ...codeResult.alternatives] : [];
  const customCodeValidation = customCode ? validateCustomCode(customCode) : null;

  if (dataLoading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading donor data...</Typography>
        </Box>
      </Container>
    );
  }

  if (donorNotFound || !originalDonor) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Donor Not Found
            </Typography>
            <Typography>
              Could not find a donor with code "{code}". Please check the code and try again.
            </Typography>
          </Alert>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/donors')}
          >
            Back to Donors List
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            variant="text"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/donors')}
            sx={{ mb: 2 }}
          >
            Back to Donors List
          </Button>
          
          <Typography variant="h4" component="h1" gutterBottom>
            <UpdateIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
            Update Donor Request
          </Typography>
          
          <Typography variant="body1" color="text.secondary">
            Request modifications to an existing donor entry. All changes will be reviewed by the CEB IT team.
          </Typography>
        </Box>

        {/* Stepper */}
        <Paper elevation={1} sx={{ mb: 4 }}>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                <StepContent>
                  {/* Step 0: Review Current Information */}
                  {index === 0 && (
                    <Box>
                      <OriginalDonorCard donor={originalDonor} />
                      
                      <Alert severity="info" sx={{ mb: 3 }}>
                        <Typography variant="body2">
                          <strong>Update Process:</strong> Review the current information above, then proceed to make your requested changes. 
                          The CEB IT team will review all modifications before applying them to the system.
                        </Typography>
                      </Alert>

                      <Box sx={{ mb: 2 }}>
                        <Button
                          variant="contained"
                          onClick={handleNext}
                          sx={{ mt: 1, mr: 1 }}
                        >
                          Continue to Update
                        </Button>
                      </Box>
                    </Box>
                  )}

                  {/* Step 1: Update Entity Information */}
                  {index === 1 && (
                    <Box>
                      <Grid container spacing={3} size={{ xs: 12 }}>
                        <Grid size={{ xs: 12 }}>
                          <Controller
                            name="entityName"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Entity Name *"
                                error={!!errors.entityName}
                                helperText={errors.entityName?.message || 'Enter the updated organization name'}
                                sx={{ mb: 2 }}
                              />
                            )}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                          <Controller
                            name="donorType"
                            control={control}
                            render={({ field }) => (
                              <FormControl fullWidth error={!!errors.donorType}>
                                <InputLabel>Donor Type *</InputLabel>
                                <Select {...field} label="Donor Type *">
                                  <MenuItem value="1">Government</MenuItem>
                                  <MenuItem value="0">Non-Government</MenuItem>
                                </Select>
                                <FormHelperText>
                                  {errors.donorType?.message || 'Select the updated donor type'}
                                </FormHelperText>
                              </FormControl>
                            )}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                          <Controller
                            name="contributorType"
                            control={control}
                            render={({ field }) => (
                              <FormControl fullWidth error={!!errors.contributorType}>
                                <InputLabel>Contributor Type *</InputLabel>
                                <Select {...field} label="Contributor Type *">
                                  {contributorTypes.map((type) => (
                                    <MenuItem key={type.TYPE} value={type.TYPE}>
                                      {type.TYPE} - {type.NAME}
                                    </MenuItem>
                                  ))}
                                </Select>
                                <FormHelperText>
                                  {errors.contributorType?.message || 'Select the updated contributor type'}
                                </FormHelperText>
                              </FormControl>
                            )}
                          />
                        </Grid>
                      </Grid>

                      <ChangesSummary 
                        originalDonor={originalDonor}
                        proposedChanges={{
                          entityName,
                          donorType,
                          contributorType,
                          suggestedCode: selectedCode
                        }}
                      />

                      <Box sx={{ mb: 2 }}>
                        <Button
                          onClick={handleBack}
                          sx={{ mt: 1, mr: 1 }}
                        >
                          Back
                        </Button>
                        <Button
                          variant="contained"
                          onClick={handleNext}
                          sx={{ mt: 1, mr: 1 }}
                          disabled={!entityName || !donorType || !contributorType}
                        >
                          Continue
                        </Button>
                      </Box>
                    </Box>
                  )}

                  {/* Step 2: Code Selection */}
                  {index === 2 && (
                    <Box>


                      {/* Unified code selection (like new donor form) */}
                      {showCodePreview && allSuggestions.length > 0 && (
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
                      )}

                      {/* Current code if no changes */}
                      {!showCodePreview && (
                        <Alert severity="info" sx={{ mb: 3 }}>
                          <Typography variant="body2">
                            <strong>No code change needed:</strong> Since the entity name hasn't changed, 
                            the current code "{originalDonor['CEB CODE']}" will be maintained.
                          </Typography>
                        </Alert>
                      )}



                      <Box sx={{ mb: 2 }}>
                        <Button
                          onClick={handleBack}
                          sx={{ mt: 1, mr: 1 }}
                        >
                          Back
                        </Button>
                        <Button
                          variant="contained"
                          onClick={handleNext}
                          sx={{ mt: 1, mr: 1 }}
                          disabled={!selectedCode}
                        >
                          Continue
                        </Button>
                      </Box>
                    </Box>
                  )}

                  {/* Step 3: Contact Details */}
                  {index === 3 && (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Contact Information
                      </Typography>
                      
                      <Grid container spacing={3} size={{ xs: 12 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Controller
                            name="contactName"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Contact Name *"
                                error={!!errors.contactName}
                                helperText={errors.contactName?.message}
                                sx={{ mb: 2 }}
                              />
                            )}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                          <Controller
                            name="contactEmail"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Contact Email *"
                                type="email"
                                error={!!errors.contactEmail}
                                helperText={errors.contactEmail?.message}
                                sx={{ mb: 2 }}
                              />
                            )}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
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
                      </Grid>

                      <Controller
                        name="justification"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            multiline
                            rows={4}
                            label="Justification for Update *"
                            placeholder="Explain why this donor information needs to be updated..."
                            error={!!errors.justification}
                            helperText={errors.justification?.message || 'Provide a clear reason for the requested changes'}
                            sx={{ mb: 2 }}
                          />
                        )}
                      />

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
                            placeholder="Any additional information or special instructions..."
                            sx={{ mb: 2 }}
                          />
                        )}
                      />

                      <Box sx={{ mb: 2 }}>
                        <Button
                          onClick={handleBack}
                          sx={{ mt: 1, mr: 1 }}
                        >
                          Back
                        </Button>
                        <Button
                          variant="contained"
                          onClick={handleNext}
                          sx={{ mt: 1, mr: 1 }}
                        >
                          Review Changes
                        </Button>
                      </Box>
                    </Box>
                  )}

                  {/* Step 4: Review & Submit */}
                  {index === 4 && (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Review Update Request
                      </Typography>

                      <OriginalDonorCard 
                        donor={originalDonor}
                        title="Original Information"
                      />

                      <ChangesSummary 
                        originalDonor={originalDonor}
                        proposedChanges={{
                          entityName,
                          donorType,
                          contributorType,
                          suggestedCode
                        }}
                      />

                      <Card variant="outlined" sx={{ mt: 3, mb: 3 }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Request Details
                          </Typography>
                          
                          <Grid container spacing={2} size={{ xs: 12 }}>
                            <Grid size={{ xs: 12, md: 6 }}>
                              <Typography variant="body2" color="text.secondary">
                                Contact Name:
                              </Typography>
                              <Typography variant="body1">
                                {watch('contactName')}
                              </Typography>
                            </Grid>
                            
                            <Grid size={{ xs: 12, md: 6 }}>
                              <Typography variant="body2" color="text.secondary">
                                Contact Email:
                              </Typography>
                              <Typography variant="body1">
                                {watch('contactEmail')}
                              </Typography>
                            </Grid>
                            
                            <Grid size={{ xs: 12, md: 6 }}>
                              <Typography variant="body2" color="text.secondary">
                                Priority:
                              </Typography>
                              <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                                {priority}
                              </Typography>
                            </Grid>
                            
                            <Grid size={{ xs: 12, md: 6 }}>
                              <Typography variant="body2" color="text.secondary">
                                Justification:
                              </Typography>
                              <Typography variant="body1">
                                {watch('justification')}
                              </Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>

                      <Alert severity="info" sx={{ mb: 3 }}>
                        <Typography variant="body2">
                          <strong>Ready to Submit:</strong> Your update request will be sent to the CEB IT team for review and approval. 
                          You will be notified of the decision via email.
                        </Typography>
                      </Alert>

                      <Box sx={{ mb: 2 }}>
                        <Button
                          onClick={handleBack}
                          sx={{ mt: 1, mr: 1 }}
                        >
                          Back
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleSubmit(onSubmit)}
                          startIcon={<SendIcon />}
                          sx={{ mt: 1, mr: 1 }}
                          disabled={!isValid}
                        >
                          Submit Update Request
                        </Button>
                      </Box>
                    </Box>
                  )}
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </Paper>
      </Box>
    </Container>
  );
};

export default DonorUpdatePage;

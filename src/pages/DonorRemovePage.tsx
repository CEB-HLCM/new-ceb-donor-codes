import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Box,
  Container,
  Typography,
  TextField,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

import { useDataContext } from '../context/DataContext';
import { useContactPersistence } from '../hooks/useContactPersistence';
import { useBasket } from '../hooks/useBasket';
import OriginalDonorCard from '../components/form/OriginalDonorCard';
import RemovalJustification from '../components/form/RemovalJustification';

import type { DonorData, DonorRequest } from '../types/request';

// Form schema for removal request
const removalRequestSchema = z.object({
  contactName: z.string().min(2, 'Contact name is required'),
  contactEmail: z.string().email('Valid email is required'),
  priority: z.enum(['low', 'normal', 'high']),
  removalReason: z.enum(['duplicate', 'obsolete', 'merged', 'incorrect', 'other']).refine(val => val !== '', { 
    message: 'Please select a reason for removal' 
  }),
  removalJustification: z.string().min(10, 'Detailed justification is required (minimum 10 characters)'),
  additionalNotes: z.string().optional()
});

type RemovalRequestFormData = z.infer<typeof removalRequestSchema>;

const steps = [
  'Review Donor Information',
  'Removal Justification',
  'Contact Details',
  'Review & Submit'
];

const DonorRemovePage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { donorsWithTypes, loading: dataLoading } = useDataContext();
  
  const [activeStep, setActiveStep] = useState(0);
  const [originalDonor, setOriginalDonor] = useState<DonorData | null>(null);
  const [donorNotFound, setDonorNotFound] = useState(false);

  // Find the donor to remove
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
  } = useForm<RemovalRequestFormData>({
    resolver: zodResolver(removalRequestSchema),
    defaultValues: {
      contactName: '',
      contactEmail: '',
      priority: 'normal' as const,
      removalReason: '',
      removalJustification: '',
      additionalNotes: ''
    },
    mode: 'onChange'
  });

  // Watch form values
  const removalReason = watch('removalReason');
  const removalJustification = watch('removalJustification');
  const priority = watch('priority');

  // Smart contact details persistence
  const { contactDetails, isLoaded: contactLoaded, updateContactDetails } = useContactPersistence();
  
  // Basket management
  const { addRequest } = useBasket();

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

  // Handle step validation
  const isStepValid = useCallback(async (step: number): Promise<boolean> => {
    const fieldsToValidate: (keyof RemovalRequestFormData)[] = [];
    
    switch (step) {
      case 0: // Review - always valid
        return true;
      case 1: // Removal Justification
        fieldsToValidate.push('removalReason', 'removalJustification');
        break;
      case 2: // Contact Details
        fieldsToValidate.push('contactEmail', 'contactName');
        break;
      case 3: // Review - check all
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

  // Form submission
  const onSubmit = useCallback((data: RemovalRequestFormData) => {
    if (!originalDonor) return;

    const removalRequest: DonorRequest = {
      id: `remove-${Date.now()}`,
      action: 'remove',
      entityName: originalDonor.NAME,
      suggestedCode: originalDonor['CEB CODE'],
      contributorType: originalDonor['CONTRIBUTOR TYPE'],
      justification: data.removalJustification,
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
      removalReason: data.removalReason,
      removalJustification: data.removalJustification
    };

    // Save contact details for future use
    updateContactDetails({
      contactName: data.contactName,
      contactEmail: data.contactEmail
    });

    // Add to basket
    addRequest(removalRequest);
    console.log('Removal request added to basket:', removalRequest);
    
    // Show success message
    alert('Removal request added to basket successfully! You can review and submit multiple requests from the Request Management page.');
    navigate('/requests-list');
  }, [originalDonor, navigate, updateContactDetails, addRequest]);

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
            <DeleteIcon sx={{ mr: 2, verticalAlign: 'middle', color: 'error.main' }} />
            Remove Donor Request
          </Typography>
          
          <Typography variant="body1" color="text.secondary">
            Request removal of a donor entry. The CEB IT team will review your request and mark the entry as obsolete if approved.
          </Typography>
        </Box>

        {/* Important Warning */}
        <Alert severity="info" icon={<WarningIcon />} sx={{ mb: 4 }}>
          <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
            <strong>Important: This is a removal REQUEST, not an immediate deletion</strong>
          </Typography>
          <Typography variant="body2" component="div">
            • No automatic deletion will occur - this creates a request for CEB IT team review<br/>
            • If approved, the donor will be marked as <strong>obsolete</strong> rather than deleted<br/>
            • Historical data will be preserved for audit and reference purposes<br/>
            • <strong>The donor code will remain permanently reserved</strong> to maintain data integrity
          </Typography>
        </Alert>

        {/* Stepper */}
        <Paper elevation={1} sx={{ mb: 4 }}>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                <StepContent>
                  {/* Step 0: Review Donor Information */}
                  {index === 0 && (
                    <Box>
                      <OriginalDonorCard 
                        donor={originalDonor}
                        title="Donor to be Removed"
                      />
                      
                      <Alert severity="info" sx={{ mb: 3 }}>
                        <Typography variant="body2">
                          <strong>Removal Request Process:</strong> Please carefully review the donor information above. 
                          You will need to provide a detailed justification for why this donor should be removed from the system.
                        </Typography>
                      </Alert>

                      <Box sx={{ mb: 2 }}>
                        <Button
                          variant="contained"
                          onClick={handleNext}
                          color="error"
                          sx={{ mt: 1, mr: 1 }}
                        >
                          Continue with Removal Request
                        </Button>
                      </Box>
                    </Box>
                  )}

                  {/* Step 1: Removal Justification */}
                  {index === 1 && (
                    <Box>
                      {/* Controlled form fields for validation */}
                      <Controller
                        name="removalReason"
                        control={control}
                        render={({ field }) => (
                          <Box sx={{ display: 'none' }}>
                            <input {...field} />
                          </Box>
                        )}
                      />
                      <Controller
                        name="removalJustification"
                        control={control}
                        render={({ field }) => (
                          <Box sx={{ display: 'none' }}>
                            <textarea {...field} />
                          </Box>
                        )}
                      />

                      <Controller
                        name="removalReason"
                        control={control}
                        render={({ field }) => (
                          <RemovalJustification
                            removalReason={field.value}
                            removalJustification={removalJustification}
                            onReasonChange={(reason) => {
                              field.onChange(reason);
                            }}
                            onJustificationChange={(justification) => {
                              setValue('removalJustification', justification);
                              trigger('removalJustification');
                            }}
                            donorName={originalDonor.NAME}
                            donorCode={originalDonor['CEB CODE']}
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
                          disabled={!removalReason || !removalJustification || removalJustification.length < 10}
                        >
                          Continue
                        </Button>
                      </Box>
                    </Box>
                  )}

                  {/* Step 2: Contact Details */}
                  {index === 2 && (
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
                          Review Request
                        </Button>
                      </Box>
                    </Box>
                  )}

                  {/* Step 3: Review & Submit */}
                  {index === 3 && (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Review Removal Request
                      </Typography>

                      <OriginalDonorCard 
                        donor={originalDonor}
                        title="Donor to be Removed"
                      />

                      <Card variant="outlined" sx={{ mt: 3, mb: 3 }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Removal Details
                          </Typography>
                          
                          <Grid container spacing={2} size={{ xs: 12 }}>
                            <Grid size={{ xs: 12, md: 6 }}>
                              <Typography variant="body2" color="text.secondary">
                                Removal Reason:
                              </Typography>
                              <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                                {removalReason?.replace(/([A-Z])/g, ' $1').trim()}
                              </Typography>
                            </Grid>
                            
                            <Grid size={{ xs: 12 }}>
                              <Typography variant="body2" color="text.secondary">
                                Detailed Justification:
                              </Typography>
                              <Typography variant="body1">
                                {removalJustification}
                              </Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>

                      <Card variant="outlined" sx={{ mb: 3 }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Request Contact
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
                          </Grid>
                        </CardContent>
                      </Card>

                      <Alert severity="info" sx={{ mb: 3 }}>
                        <Typography variant="body2">
                          <strong>Final Confirmation:</strong> This removal request will be sent to the CEB IT team for review. 
                          The donor entry will only be marked as obsolete after manual verification and approval. 
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
                          color="error"
                          onClick={handleSubmit(onSubmit)}
                          startIcon={<SendIcon />}
                          sx={{ mt: 1, mr: 1 }}
                          disabled={!isValid}
                        >
                          Submit Removal Request
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

export default DonorRemovePage;

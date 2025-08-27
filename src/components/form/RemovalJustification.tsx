import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Alert,
  Chip
} from '@mui/material';
import {
  Warning as WarningIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

interface RemovalJustificationProps {
  removalReason: string;
  removalJustification: string;
  onReasonChange: (reason: string) => void;
  onJustificationChange: (justification: string) => void;
  donorName: string;
  donorCode: string;
}

const removalReasons = [
  { value: 'duplicate', label: 'Duplicate Entry', description: 'This donor already exists with a different code' },
  { value: 'obsolete', label: 'Organization Obsolete', description: 'Organization no longer exists or operates' },
  { value: 'merged', label: 'Organization Merged', description: 'Organization has been merged with another entity' },
  { value: 'incorrect', label: 'Incorrect Information', description: 'Donor information was entered incorrectly' },
  { value: 'other', label: 'Other Reason', description: 'Please specify in the justification field below' }
];

const RemovalJustification: React.FC<RemovalJustificationProps> = ({
  removalReason,
  removalJustification,
  onReasonChange,
  onJustificationChange,
  donorName,
  donorCode
}) => {
  return (
    <Card 
      variant="outlined" 
      sx={{ 
        mb: 3,
        backgroundColor: 'grey.50',
        border: '2px solid',
        borderColor: 'grey.300'
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <DeleteIcon color="error" sx={{ mr: 1 }} />
          <Typography 
            variant="h6" 
            color="error.dark"
            sx={{ fontWeight: 'bold' }}
          >
            Removal Request Details
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Requesting removal of:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
              {donorName}
            </Typography>
            <Chip 
              label={donorCode} 
              component="span"
              variant="outlined" 
              color="error" 
              sx={{ fontFamily: 'monospace' }}
            />
          </Box>
        </Box>

        <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
          <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold' }}>
            Reason for Removal *
          </FormLabel>
          <RadioGroup
            value={removalReason}
            onChange={(e) => onReasonChange(e.target.value)}
          >
            {removalReasons.map((reason) => (
              <FormControlLabel
                key={reason.value}
                value={reason.value}
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {reason.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {reason.description}
                    </Typography>
                  </Box>
                }
                sx={{ mb: 1, alignItems: 'flex-start' }}
              />
            ))}
          </RadioGroup>
        </FormControl>

        <TextField
          fullWidth
          multiline
          rows={4}
          label="Detailed Justification *"
          placeholder="Please provide a detailed explanation for why this donor should be removed from the system..."
          value={removalJustification}
          onChange={(e) => onJustificationChange(e.target.value)}
          required
          helperText="Provide specific details to help the CEB IT team understand and process this removal request"
          sx={{ mb: 3 }}
        />

        <Alert severity="error" icon={<WarningIcon />}>
          <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
            <strong>Important Notice about Removal Requests:</strong>
          </Typography>
          <Typography variant="body2" component="div">
            • This is a <strong>request for review</strong> - no automatic deletion will occur<br/>
            • The CEB IT team will review your justification before taking action<br/>
            • If approved, the donor entry will be marked as <strong>obsolete</strong> rather than deleted<br/>
            • Historical data and references will be preserved for audit purposes<br/>
            • The donor code will become available for future reuse if appropriate
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default RemovalJustification;

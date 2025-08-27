import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import type { DonorData } from '../../types/request';
import { useDataContext } from '../../context/DataContext';

interface ChangesSummaryProps {
  originalDonor: DonorData;
  proposedChanges: {
    entityName?: string;
    donorType?: string;
    contributorType?: string;
    suggestedCode?: string;
  };
}

const ChangesSummary: React.FC<ChangesSummaryProps> = ({ 
  originalDonor, 
  proposedChanges 
}) => {
  const { contributorTypes } = useDataContext();
  
  // Helper functions
  const getDonorTypeDisplay = (type: string) => {
    return type === "1" ? "Government" : "Non-Government";
  };
  
  const getContributorTypeDisplay = (contributorTypeCode: string) => {
    const contributorType = contributorTypes.find(ct => ct.TYPE === contributorTypeCode);
    return contributorType 
      ? `${contributorType.TYPE} - ${contributorType.NAME}`
      : contributorTypeCode;
  };

  const hasChanges = Object.values(proposedChanges).some(value => value && value.trim() !== '');

  if (!hasChanges) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          No changes detected. Make modifications above to see a summary of proposed changes.
        </Typography>
      </Alert>
    );
  }

  const changes = [];

  // Name change
  if (proposedChanges.entityName && proposedChanges.entityName !== originalDonor.NAME) {
    changes.push({
      field: 'Entity Name',
      from: originalDonor.NAME,
      to: proposedChanges.entityName
    });
  }

  // Donor type change
  if (proposedChanges.donorType && proposedChanges.donorType !== originalDonor.TYPE) {
    changes.push({
      field: 'Donor Type',
      from: getDonorTypeDisplay(originalDonor.TYPE),
      to: getDonorTypeDisplay(proposedChanges.donorType)
    });
  }

  // Contributor type change
  if (proposedChanges.contributorType && proposedChanges.contributorType !== originalDonor['CONTRIBUTOR TYPE']) {
    changes.push({
      field: 'Contributor Type',
      from: getContributorTypeDisplay(originalDonor['CONTRIBUTOR TYPE']),
      to: getContributorTypeDisplay(proposedChanges.contributorType)
    });
  }

  // Code change
  if (proposedChanges.suggestedCode && proposedChanges.suggestedCode !== originalDonor['CEB CODE']) {
    changes.push({
      field: 'CEB Code',
      from: originalDonor['CEB CODE'],
      to: proposedChanges.suggestedCode
    });
  }

  if (changes.length === 0) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          The proposed values match the current donor information. No changes will be requested.
        </Typography>
      </Alert>
    );
  }

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        mb: 3,
        backgroundColor: 'grey.50',
        border: '1px solid',
        borderColor: 'grey.300'
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <EditIcon color="primary" sx={{ mr: 1 }} />
          <Typography 
            variant="h6" 
            color="text.primary"
            sx={{ fontWeight: 'bold' }}
          >
            Proposed Changes Summary
          </Typography>
        </Box>

        <List dense>
          {changes.map((change, index) => (
            <ListItem key={index} sx={{ py: 1, px: 0 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <ArrowForwardIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {change.field}:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Chip 
                        label={change.from} 
                        component="span"
                        variant="outlined" 
                        color="error" 
                        size="small"
                        sx={{ fontFamily: change.field === 'CEB Code' ? 'monospace' : 'inherit' }}
                      />
                      <ArrowForwardIcon fontSize="small" color="action" />
                      <Chip 
                        label={change.to} 
                        component="span"
                        variant="filled" 
                        color="primary" 
                        size="small"
                        sx={{ fontFamily: change.field === 'CEB Code' ? 'monospace' : 'inherit' }}
                      />
                    </Box>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Changes Summary:</strong> These modifications will be included in your update request.
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default ChangesSummary;

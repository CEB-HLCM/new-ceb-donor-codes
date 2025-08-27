import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Divider
} from '@mui/material';
import type { DonorData } from '../../types/request';
import { useDataContext } from '../../context/DataContext';

interface OriginalDonorCardProps {
  donor: DonorData;
  title?: string;
}

const OriginalDonorCard: React.FC<OriginalDonorCardProps> = ({ 
  donor, 
  title = "Current Donor Information" 
}) => {
  const { contributorTypes } = useDataContext();
  
  // Get human-readable donor type
  const getDonorTypeDisplay = (type: string) => {
    return type === "1" ? "Government" : "Non-Government";
  };
  
  // Get contributor type with name
  const getContributorTypeDisplay = (contributorTypeCode: string) => {
    const contributorType = contributorTypes.find(ct => ct.TYPE === contributorTypeCode);
    return contributorType 
      ? `${contributorType.TYPE} - ${contributorType.NAME}`
      : contributorTypeCode;
  };

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        mb: 3,
        backgroundColor: 'grey.50',
        border: '2px solid',
        borderColor: 'info.light'
      }}
    >
      <CardContent>
        <Typography 
          variant="h6" 
          gutterBottom 
          color="info.main"
          sx={{ fontWeight: 'bold' }}
        >
          {title}
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          {/* Entity Name */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
              Entity Name:
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
              {donor.NAME}
            </Typography>
          </Box>

          {/* Donor Type */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
              Donor Type:
            </Typography>
            <Chip 
              label={getDonorTypeDisplay(donor.TYPE)} 
              component="span"
              variant="filled" 
              color="secondary" 
              size="small"
            />
          </Box>

          {/* Contributor Type */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
              Contributor Type:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {getContributorTypeDisplay(donor['CONTRIBUTOR TYPE'])}
            </Typography>
          </Box>

          {/* CEB Code */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
              CEB Code:
            </Typography>
            <Chip 
              label={donor['CEB CODE']} 
              component="span"
              variant="outlined" 
              color="primary" 
              sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}
            />
          </Box>
        </Box>


      </CardContent>
    </Card>
  );
};

export default OriginalDonorCard;

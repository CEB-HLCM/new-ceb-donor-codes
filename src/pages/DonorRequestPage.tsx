import React from 'react';
import { Box, Typography } from '@mui/material';

const DonorRequestPage: React.FC = () => {
  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Add Donor
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Donor request form will be implemented in Phase 4
      </Typography>
    </Box>
  );
};

export default DonorRequestPage;

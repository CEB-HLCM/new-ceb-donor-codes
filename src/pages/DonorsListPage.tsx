import React from 'react';
import { Box, Typography } from '@mui/material';

const DonorsListPage: React.FC = () => {
  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Donors List
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Donors list with data loading will be implemented in Phase 2
      </Typography>
    </Box>
  );
};

export default DonorsListPage;

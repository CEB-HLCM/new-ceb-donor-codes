import React from 'react';
import { Box, Typography } from '@mui/material';

const SearchPage: React.FC = () => {
  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Search Donors
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Search functionality will be implemented in Phase 3
      </Typography>
    </Box>
  );
};

export default SearchPage;

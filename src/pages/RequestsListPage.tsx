import React from 'react';
import { Box, Typography } from '@mui/material';

const RequestsListPage: React.FC = () => {
  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Requests List
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Request basket functionality will be implemented in Phase 5
      </Typography>
    </Box>
  );
};

export default RequestsListPage;

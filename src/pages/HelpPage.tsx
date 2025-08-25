import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const HelpPage: React.FC = () => {
  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center' }}>
        Help & Information
      </Typography>
      
      <Paper elevation={1} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Welcome to CEB Donor Codes
        </Typography>
        <Typography variant="body1" paragraph>
          This application helps manage donor entity codes for UN organizations. 
          You can search for existing donor codes, request new ones, and track your submissions.
        </Typography>
        
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Getting Started
        </Typography>
        <Typography variant="body1" paragraph>
          • Use the <strong>Search</strong> function to find existing donor codes
        </Typography>
        <Typography variant="body1" paragraph>
          • Submit <strong>Add Donor</strong> requests for new organizations
        </Typography>
        <Typography variant="body1" paragraph>
          • View all donors in the <strong>Donors List</strong>
        </Typography>
        <Typography variant="body1" paragraph>
          • Track your submissions in <strong>Requests</strong>
        </Typography>
      </Paper>
    </Box>
  );
};

export default HelpPage;

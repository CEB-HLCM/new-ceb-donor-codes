import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  Stack,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Download as DownloadIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { useBasket } from '../hooks/useBasket';
import RequestBasket from '../components/basket/RequestBasket';
import RequestHistory from '../components/basket/RequestHistory';
import type { DonorRequest, RequestSubmission } from '../types/request';

const RequestsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { basket, getStats, downloadCSV, addRequest } = useBasket();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Get current requests from basket
  const requests = basket.requests;
  const stats = getStats();

  // Export handler using basket service
  const handleExport = () => {
    downloadCSV('donor-requests');
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, requestId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedRequest(requestId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRequest(null);
  };

  const handleRestoreFromHistory = (submission: RequestSubmission) => {
    // Add all requests from the historical submission back to the basket
    submission.requests.forEach(request => {
      // Generate new ID for restored request
      const restoredRequest = {
        ...request,
        id: `restored-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        status: 'draft' as const
      };
      addRequest(restoredRequest);
    });
    
    setShowHistory(false);
    alert(`Restored ${submission.requests.length} request(s) from submission ${submission.submissionId}`);
  };

  // Utility functions for status and priority colors (used by RequestBasket component)
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'pending': return 'warning';
      case 'submitted': return 'info';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'normal': return 'primary';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const draftCount = stats.byStatus.draft;
  const pendingCount = stats.byStatus.pending;
  const submittedCount = stats.byStatus.submitted;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Request Management
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<HistoryIcon />}
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? 'Hide' : 'Show'} History
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/donor-request')}
          >
            New Request
          </Button>
        </Stack>
      </Box>

      {/* Summary Cards */}
      <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary">
              Draft Requests
            </Typography>
            <Typography variant="h4" color="primary">
              {draftCount}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary">
              Pending Review
            </Typography>
            <Typography variant="h4" color="warning.main">
              {pendingCount}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary">
              Submitted
            </Typography>
            <Typography variant="h4" color="info.main">
              {submittedCount}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary">
              Total Requests
            </Typography>
            <Typography variant="h4">
              {requests.length}
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* Enhanced basket component */}
      <RequestBasket showAddButton={true} compact={false} />

      {/* Request History */}
      {showHistory && (
        <Box sx={{ mt: 4 }}>
          <RequestHistory onRestoreSubmission={handleRestoreFromHistory} />
        </Box>
      )}

      {/* Helpful alerts */}
      {draftCount > 0 && (
        <Alert severity="info" sx={{ mt: 3 }}>
          You have {draftCount} draft request(s). Remember to submit them for processing.
        </Alert>
      )}
    </Container>
  );
};

export default RequestsListPage;

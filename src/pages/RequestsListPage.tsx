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
import type { DonorRequest } from '../types/request';

// Mock data for demonstration
const mockRequests: DonorRequest[] = [
  {
    id: '1',
    entityName: 'World Health Organization Regional Office',
    suggestedCode: 'WHORO',
    contributorType: 'C04A',
    justification: 'Need separate code for regional operations',
    contactEmail: 'admin@who.int',
    contactName: 'John Smith',
    priority: 'high',
    createdAt: new Date('2024-01-15'),
    status: 'draft'
  },
  {
    id: '2',
    entityName: 'Gates Foundation Europe',
    suggestedCode: 'GATESEU',
    contributorType: 'C05',
    justification: 'European operations require separate tracking',
    contactEmail: 'europe@gatesfoundation.org',
    contactName: 'Sarah Johnson',
    priority: 'normal',
    createdAt: new Date('2024-01-10'),
    status: 'pending'
  },
  {
    id: '3',
    entityName: 'United Nations Development Programme',
    suggestedCode: 'UNDP01',
    contributorType: 'C04A',
    justification: 'Standard UNDP donor code for new initiatives',
    contactEmail: 'codes@undp.org',
    contactName: 'Maria Garcia',
    priority: 'normal',
    createdAt: new Date('2024-01-08'),
    status: 'submitted'
  }
];

const RequestsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<DonorRequest[]>(mockRequests);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, requestId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedRequest(requestId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRequest(null);
  };

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

  const handleDelete = (requestId: string) => {
    setRequests(prev => prev.filter(req => req.id !== requestId));
    handleMenuClose();
  };

  const handleSubmit = (requestId: string) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'submitted' as const } : req
    ));
    handleMenuClose();
  };

  const handleExport = () => {
    const csvContent = [
      ['Entity Name', 'Code', 'Type', 'Contact', 'Status', 'Priority', 'Created'],
      ...requests.map(req => [
        req.entityName,
        req.suggestedCode,
        req.contributorType,
        req.contactName,
        req.status,
        req.priority,
        req.createdAt.toISOString().split('T')[0]
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'donor-requests.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const draftCount = requests.filter(req => req.status === 'draft').length;
  const pendingCount = requests.filter(req => req.status === 'pending').length;
  const submittedCount = requests.filter(req => req.status === 'submitted').length;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Request Management
        </Typography>
        <Stack direction="row" spacing={2}>
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

      {requests.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No requests found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first donor code request to get started
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/donor-request')}
            >
              Create Request
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Entity Name</TableCell>
                    <TableCell>Suggested Code</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {request.entityName}
                        </Typography>
                        {request.justification && (
                          <Typography variant="caption" color="text.secondary">
                            {request.justification.substring(0, 50)}...
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography fontFamily="monospace" fontWeight="bold">
                          {request.suggestedCode}
                        </Typography>
                      </TableCell>
                      <TableCell>{request.contributorType}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {request.contactName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {request.contactEmail}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={request.priority}
                          size="small"
                          color={getPriorityColor(request.priority)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={request.status}
                          size="small"
                          color={getStatusColor(request.status)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {request.createdAt.toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, request.id)}
                          size="small"
                        >
                          <MoreIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => {
                navigate(`/donor-request/${selectedRequest}`);
                handleMenuClose();
              }}>
                <EditIcon fontSize="small" sx={{ mr: 1 }} />
                Edit
              </MenuItem>
              {selectedRequest && requests.find(r => r.id === selectedRequest)?.status === 'draft' && (
                <MenuItem onClick={() => selectedRequest && handleSubmit(selectedRequest)}>
                  <SendIcon fontSize="small" sx={{ mr: 1 }} />
                  Submit
                </MenuItem>
              )}
              <MenuItem onClick={() => selectedRequest && handleDelete(selectedRequest)}>
                <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                Delete
              </MenuItem>
            </Menu>
          </CardContent>
        </Card>
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

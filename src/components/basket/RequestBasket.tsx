// Enhanced request basket component with modern UX

import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Checkbox,
  Button,
  Menu,
  MenuItem,
  Stack,
  Divider,
  Alert,
  Tooltip,
  Badge
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  SelectAll as SelectAllIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  Update as UpdateIcon,
  Remove as RemoveIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { useBasket } from '../../hooks/useBasket';
import RequestSubmission from './RequestSubmission';
import type { DonorRequest } from '../../types/request';

interface RequestBasketProps {
  showAddButton?: boolean;
  compact?: boolean;
  onRequestEdit?: (request: DonorRequest) => void;
}

const RequestBasket: React.FC<RequestBasketProps> = ({
  showAddButton = true,
  compact = false,
  onRequestEdit
}) => {
  const navigate = useNavigate();
  const {
    basket,
    removeRequest,
    bulkRemoveRequests,
    bulkUpdateStatus,
    downloadCSV,
    downloadJSON,
    clearBasket
  } = useBasket();

  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRequest, setSelectedRequest] = useState<DonorRequest | null>(null);
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false);

  // Memoized request grouping
  const groupedRequests = useMemo(() => {
    const groups = {
      new: basket.requests.filter(r => r.action === 'new'),
      update: basket.requests.filter(r => r.action === 'update'),
      remove: basket.requests.filter(r => r.action === 'remove')
    };
    return groups;
  }, [basket.requests]);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedRequests.length === basket.requests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(basket.requests.map(r => r.id));
    }
  };

  const handleSelectRequest = (requestId: string) => {
    setSelectedRequests(prev => 
      prev.includes(requestId)
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, request: DonorRequest) => {
    setAnchorEl(event.currentTarget);
    setSelectedRequest(request);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRequest(null);
  };

  // Action handlers
  const handleEditRequest = (request: DonorRequest) => {
    if (onRequestEdit) {
      onRequestEdit(request);
    } else {
      // Navigate to appropriate edit page based on action
      switch (request.action) {
        case 'new':
          navigate(`/donor-request/${request.id}`);
          break;
        case 'update':
          navigate(`/donor-update/${encodeURIComponent(request.originalDonor?.code || '')}`);
          break;
        case 'remove':
          navigate(`/donor-remove/${encodeURIComponent(request.originalDonor?.code || '')}`);
          break;
      }
    }
    handleMenuClose();
  };

  const handleDeleteRequest = () => {
    if (selectedRequest) {
      removeRequest(selectedRequest.id);
    }
    handleMenuClose();
  };

  const handleBulkDelete = () => {
    if (selectedRequests.length > 0) {
      bulkRemoveRequests(selectedRequests);
      setSelectedRequests([]);
    }
  };

  const handleBulkSubmit = () => {
    if (selectedRequests.length > 0) {
      bulkUpdateStatus(selectedRequests, 'submitted');
      setSelectedRequests([]);
    }
  };

  // Utility functions
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'new': return <AddIcon fontSize="small" />;
      case 'update': return <UpdateIcon fontSize="small" />;
      case 'remove': return <RemoveIcon fontSize="small" />;
      default: return null;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'new': return 'success';
      case 'update': return 'primary';
      case 'remove': return 'error';
      default: return 'default';
    }
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

  if (basket.requests.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: compact ? 4 : 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No requests in basket
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Start by creating a new donor code request
          </Typography>
          {showAddButton && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/donor-request')}
            >
              Create Request
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        {/* Header with bulk actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2">
            Request Basket
            <Badge badgeContent={basket.totalCount} color="primary" sx={{ ml: 2 }} />
          </Typography>
          
          <Stack direction="row" spacing={1}>
            {selectedRequests.length > 0 && (
              <>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={handleBulkDelete}
                  startIcon={<DeleteIcon />}
                >
                  Delete ({selectedRequests.length})
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleBulkSubmit}
                  startIcon={<SendIcon />}
                >
                  Submit ({selectedRequests.length})
                </Button>
              </>
            )}
            
            <Button
              size="small"
              variant="outlined"
              onClick={() => downloadCSV()}
              startIcon={<DownloadIcon />}
            >
              Export CSV
            </Button>

            <Button
              size="small"
              variant="contained"
              color="success"
              onClick={() => setShowSubmissionDialog(true)}
              startIcon={<EmailIcon />}
              disabled={basket.requests.length === 0}
            >
              Submit All ({basket.totalCount})
            </Button>
            
            {showAddButton && (
              <Button
                size="small"
                variant="contained"
                onClick={() => navigate('/donor-request')}
                startIcon={<AddIcon />}
              >
                Add Request
              </Button>
            )}
          </Stack>
        </Box>

        {/* Summary stats */}
        {!compact && (
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <Chip
              icon={<AddIcon />}
              label={`New: ${groupedRequests.new.length}`}
              color="success"
              variant="outlined"
              size="small"
            />
            <Chip
              icon={<UpdateIcon />}
              label={`Update: ${groupedRequests.update.length}`}
              color="primary"
              variant="outlined"
              size="small"
            />
            <Chip
              icon={<RemoveIcon />}
              label={`Remove: ${groupedRequests.remove.length}`}
              color="error"
              variant="outlined"
              size="small"
            />
          </Stack>
        )}

        {/* Request table */}
        <TableContainer component={Paper} variant="outlined">
          <Table size={compact ? "small" : "medium"}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedRequests.length > 0 && selectedRequests.length < basket.requests.length}
                    checked={basket.requests.length > 0 && selectedRequests.length === basket.requests.length}
                    onChange={handleSelectAll}
                    inputProps={{ 'aria-label': 'select all requests' }}
                  />
                </TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Entity Name</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {basket.requests.map((request) => (
                <TableRow
                  key={request.id}
                  hover
                  selected={selectedRequests.includes(request.id)}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedRequests.includes(request.id)}
                      onChange={() => handleSelectRequest(request.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getActionIcon(request.action)}
                      label={request.action}
                      size="small"
                      color={getActionColor(request.action) as any}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {request.entityName}
                    </Typography>
                    {request.justification && !compact && (
                      <Typography variant="caption" color="text.secondary">
                        {request.justification.substring(0, 50)}...
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography fontFamily="monospace" fontWeight="bold">
                      {request.customCode || request.suggestedCode}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={request.status}
                      size="small"
                      color={getStatusColor(request.status) as any}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={request.priority}
                      size="small"
                      color={getPriorityColor(request.priority) as any}
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
                      onClick={(e) => handleMenuOpen(e, request)}
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

        {/* Context menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => selectedRequest && handleEditRequest(selectedRequest)}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          {selectedRequest?.status === 'draft' && (
            <MenuItem onClick={() => {
              if (selectedRequest) {
                bulkUpdateStatus([selectedRequest.id], 'submitted');
              }
              handleMenuClose();
            }}>
              <SendIcon fontSize="small" sx={{ mr: 1 }} />
              Submit
            </MenuItem>
          )}
          <MenuItem onClick={handleDeleteRequest}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </Menu>

        {/* Clear basket option */}
        {basket.requests.length > 5 && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              size="small"
              color="error"
              onClick={clearBasket}
              startIcon={<ClearIcon />}
              sx={{ textTransform: 'none' }}
            >
              Clear all requests
            </Button>
          </Box>
        )}
      </CardContent>

      {/* Submission Dialog */}
      <RequestSubmission
        open={showSubmissionDialog}
        onClose={() => setShowSubmissionDialog(false)}
        onSubmissionComplete={(success, submissionId) => {
          if (success) {
            console.log('Submission completed successfully:', submissionId);
          }
          setShowSubmissionDialog(false);
        }}
      />
    </Card>
  );
};

export default RequestBasket;

// Request history component for tracking past submissions

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  Collapse,
  Alert,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  History as HistoryIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Send as SendIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  Restore as RestoreIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';

import type { RequestSubmission } from '../../types/request';

interface RequestHistoryProps {
  onRestoreSubmission?: (submission: RequestSubmission) => void;
}

const HISTORY_STORAGE_KEY = 'ceb-donor-request-history';
const HISTORY_EXPIRY_DAYS = 30; // Keep history for 30 days

interface HistoryEntry extends RequestSubmission {
  status: 'submitted' | 'confirmed' | 'failed';
  submissionResult?: any;
  expiryDate: number;
}

const RequestHistory: React.FC<RequestHistoryProps> = ({ onRestoreSubmission }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedSubmission, setSelectedSubmission] = useState<HistoryEntry | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (storedHistory) {
        const parsed: HistoryEntry[] = JSON.parse(storedHistory);
        
        // Filter out expired entries
        const now = Date.now();
        const validHistory = parsed.filter(entry => entry.expiryDate > now);
        
        // Convert date strings back to Date objects
        const processedHistory = validHistory.map(entry => ({
          ...entry,
          submittedAt: new Date(entry.submittedAt),
          requests: entry.requests.map(req => ({
            ...req,
            createdAt: new Date(req.createdAt)
          }))
        }));
        
        setHistory(processedHistory);
        
        // Clean up expired entries
        if (validHistory.length !== parsed.length) {
          saveHistory(processedHistory);
        }
      }
    } catch (error) {
      console.error('Failed to load submission history:', error);
    }
  }, []);

  // Save history to localStorage
  const saveHistory = (historyData: HistoryEntry[]) => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyData));
    } catch (error) {
      console.error('Failed to save submission history:', error);
    }
  };

  // Add new submission to history
  const addToHistory = (submission: RequestSubmission, status: HistoryEntry['status'], result?: any) => {
    const historyEntry: HistoryEntry = {
      ...submission,
      status,
      submissionResult: result,
      expiryDate: Date.now() + (HISTORY_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    };

    const updatedHistory = [historyEntry, ...history].slice(0, 50); // Keep max 50 entries
    setHistory(updatedHistory);
    saveHistory(updatedHistory);
  };

  // Expose method to add submissions (would be called from parent components)
  React.useImperativeHandle(null, () => ({
    addToHistory
  }));

  const handleToggleExpand = (submissionId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(submissionId)) {
      newExpanded.delete(submissionId);
    } else {
      newExpanded.add(submissionId);
    }
    setExpandedItems(newExpanded);
  };

  const handleViewDetails = (submission: HistoryEntry) => {
    setSelectedSubmission(submission);
    setShowDetailDialog(true);
  };

  const handleRestoreSubmission = (submission: HistoryEntry) => {
    if (onRestoreSubmission) {
      onRestoreSubmission(submission);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  };

  const getStatusIcon = (status: HistoryEntry['status']) => {
    switch (status) {
      case 'submitted': return <PendingIcon color="info" />;
      case 'confirmed': return <SuccessIcon color="success" />;
      case 'failed': return <ErrorIcon color="error" />;
      default: return <SendIcon />;
    }
  };

  const getStatusColor = (status: HistoryEntry['status']) => {
    switch (status) {
      case 'submitted': return 'info';
      case 'confirmed': return 'success';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  if (history.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Submission History
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your request submission history will appear here.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="h2">
              Submission History
            </Typography>
            <Button
              size="small"
              color="error"
              onClick={handleClearHistory}
              startIcon={<DeleteIcon />}
            >
              Clear History
            </Button>
          </Box>

          <List>
            {history.map((entry) => (
              <React.Fragment key={entry.submissionId}>
                <ListItem
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <ListItemIcon>
                    {getStatusIcon(entry.status)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="subtitle2">
                          {entry.submissionId}
                        </Typography>
                        <Chip
                          label={entry.status}
                          size="small"
                          color={getStatusColor(entry.status) as any}
                        />
                        <Chip
                          label={`${entry.requests.length} request${entry.requests.length !== 1 ? 's' : ''}`}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                    }
                    secondary={
                      <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                        <Typography variant="caption">
                          Submitted: {entry.submittedAt.toLocaleString()}
                        </Typography>
                        <Typography variant="caption">
                          By: {entry.submittedBy.name}
                        </Typography>
                      </Stack>
                    }
                  />
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(entry)}
                      title="View details"
                    >
                      <ViewIcon />
                    </IconButton>
                    {onRestoreSubmission && (
                      <IconButton
                        size="small"
                        onClick={() => handleRestoreSubmission(entry)}
                        title="Restore to basket"
                      >
                        <RestoreIcon />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleToggleExpand(entry.submissionId)}
                    >
                      {expandedItems.has(entry.submissionId) ? <CollapseIcon /> : <ExpandIcon />}
                    </IconButton>
                  </Stack>
                </ListItem>

                <Collapse in={expandedItems.has(entry.submissionId)}>
                  <Box sx={{ pl: 4, pr: 2, pb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Requests Summary:
                    </Typography>
                    <Stack spacing={1}>
                      {entry.requests.map((request, index) => (
                        <Box key={request.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={request.action}
                            size="small"
                            color={
                              request.action === 'new' ? 'success' :
                              request.action === 'update' ? 'primary' : 'error'
                            }
                          />
                          <Typography variant="body2">
                            {request.entityName}
                          </Typography>
                          <Typography variant="body2" fontFamily="monospace" fontWeight="bold">
                            ({request.customCode || request.suggestedCode})
                          </Typography>
                        </Box>
                      ))}
                    </Stack>

                    {entry.notes && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Notes:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {entry.notes}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Collapse>
              </React.Fragment>
            ))}
          </List>

          {history.length > 10 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Showing recent submissions. History is automatically cleaned after {HISTORY_EXPIRY_DAYS} days.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog 
        open={showDetailDialog} 
        onClose={() => setShowDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Submission Details: {selectedSubmission?.submissionId}
        </DialogTitle>
        <DialogContent>
          {selectedSubmission && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Status: 
                </Typography>
                <Chip
                  icon={getStatusIcon(selectedSubmission.status)}
                  label={selectedSubmission.status}
                  color={getStatusColor(selectedSubmission.status) as any}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Submitted By:
                </Typography>
                <Typography variant="body2">
                  {selectedSubmission.submittedBy.name} ({selectedSubmission.submittedBy.email})
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Submission Time:
                </Typography>
                <Typography variant="body2">
                  {selectedSubmission.submittedAt.toLocaleString()}
                </Typography>
              </Box>

              {selectedSubmission.notes && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Notes:
                  </Typography>
                  <Typography variant="body2">
                    {selectedSubmission.notes}
                  </Typography>
                </Box>
              )}

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Requests ({selectedSubmission.requests.length}):
                </Typography>
                <List dense>
                  {selectedSubmission.requests.map((request) => (
                    <ListItem key={request.id}>
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                              label={request.action}
                              size="small"
                              color={
                                request.action === 'new' ? 'success' :
                                request.action === 'update' ? 'primary' : 'error'
                              }
                            />
                            <Typography variant="body2">
                              {request.entityName}
                            </Typography>
                            <Typography variant="body2" fontFamily="monospace" fontWeight="bold">
                              ({request.customCode || request.suggestedCode})
                            </Typography>
                          </Stack>
                        }
                        secondary={request.justification}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {onRestoreSubmission && selectedSubmission && (
            <Button
              onClick={() => {
                handleRestoreSubmission(selectedSubmission);
                setShowDetailDialog(false);
              }}
              startIcon={<RestoreIcon />}
            >
              Restore to Basket
            </Button>
          )}
          <Button onClick={() => setShowDetailDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RequestHistory;

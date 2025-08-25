import React, { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Pagination,
  CircularProgress,
  Alert,
  Chip,
  Link as MuiLink,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useDataContext } from '../context/DataContext';
import type { DonorWithType } from '../types/donor';

const ITEMS_PER_PAGE = 20;

const DonorsListPage: React.FC = () => {
  const { donorsWithTypes, loading, error, reload } = useDataContext();
  const [searchText, setSearchText] = useState('');
  const [searchField, setSearchField] = useState<'NAME' | 'CEB CODE'>('NAME');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter donors based on search criteria
  const filteredDonors = React.useMemo(() => {
    if (!searchText.trim()) return donorsWithTypes;
    
    const regex = new RegExp(searchText.trim(), 'gi');
    return donorsWithTypes.filter(donor => {
      const fieldValue = searchField === 'NAME' ? donor.NAME : donor['CEB CODE'];
      return fieldValue.match(regex);
    });
  }, [donorsWithTypes, searchText, searchField]);

  // Paginate filtered results
  const paginatedDonors = React.useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDonors.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredDonors, currentPage]);

  const totalPages = Math.ceil(filteredDonors.length / ITEMS_PER_PAGE);

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const getTypeDisplayName = (donor: DonorWithType) => {
    if (donor.contributorTypeInfo) {
      return donor.contributorTypeInfo.NAME;
    }
    // Fallback for missing contributor type info
    return donor.TYPE === '1' ? 'Government' : 'Non-government';
  };

  const getTypeColor = (donor: DonorWithType) => {
    if (donor.TYPE === '1') return 'primary';
    return 'secondary';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading donor data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Box sx={{ textAlign: 'center' }}>
          <Button variant="contained" onClick={reload} color="primary">
            Retry Loading Data
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
        CEB Donor Codes
      </Typography>

      {/* Search Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Search by</InputLabel>
          <Select
            value={searchField}
            label="Search by"
            onChange={(e) => setSearchField(e.target.value as 'NAME' | 'CEB CODE')}
          >
            <MenuItem value="NAME">NAME</MenuItem>
            <MenuItem value="CEB CODE">CEB CODE</MenuItem>
          </Select>
        </FormControl>
        
        <TextField
          size="small"
          placeholder="Search..."
          value={searchText}
          onChange={handleSearchChange}
          sx={{ minWidth: 250 }}
        />
      </Box>

      {/* Results Summary */}
      <Typography variant="body2" sx={{ textAlign: 'center', mb: 2, color: 'text.secondary' }}>
        {searchText ? `${filteredDonors.length} results found` : `${donorsWithTypes.length} total donors`}
      </Typography>

      {/* Donors Table */}
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>NAME</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>CEB CODE</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>TYPE</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedDonors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  No Results
                </TableCell>
              </TableRow>
            ) : (
              paginatedDonors.map((donor, index) => (
                <TableRow key={`${donor['CEB CODE']}-${index}`} hover>
                  <TableCell>{donor.NAME}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                      {donor['CEB CODE']}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getTypeDisplayName(donor)}
                      color={getTypeColor(donor)}
                      size="small"
                      title={donor.contributorTypeInfo?.DEFINITION}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      component={Link}
                      to="/maps"
                      state={{
                        name: donor.NAME,
                        code: donor['CEB CODE'],
                        type: donor.TYPE,
                      }}
                      variant="contained"
                      size="small"
                      disabled
                      sx={{ 
                        backgroundColor: 'grey.500',
                        color: 'white',
                        '&:hover': { backgroundColor: 'grey.600' }
                      }}
                    >
                      Update
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {!searchText && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
            size="large"
          />
        </Box>
      )}

      {/* Data Source Info */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Data loaded from{' '}
          <MuiLink
            href="https://github.com/CEB-HLCM/FS-Public-Codes"
            target="_blank"
            rel="noopener noreferrer"
          >
            CEB-HLCM/FS-Public-Codes
          </MuiLink>
          {' '}repository
        </Typography>
      </Box>
    </Box>
  );
};

export default DonorsListPage;

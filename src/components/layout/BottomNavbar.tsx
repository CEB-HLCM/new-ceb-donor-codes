import React from 'react';
import {
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  Badge,
} from '@mui/material';
import {
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  People as PeopleIcon,
  ListAlt as ListAltIcon,
  Help as HelpIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

interface BottomNavbarProps {
  requestCount?: number;
}

const BottomNavbar: React.FC<BottomNavbarProps> = ({ requestCount = 0 }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Map current path to navigation value
  const getNavigationValue = (pathname: string): number => {
    switch (pathname) {
      case '/':
        return 0;
      case '/search':
        return 1;
      case '/donor-request':
        return 2;
      case '/donors':
        return 3;
      case '/requests-list':
        return 4;
      case '/help':
        return 5;
      default:
        return 0;
    }
  };

  const handleNavigationChange = (event: React.SyntheticEvent, newValue: number) => {
    const routes = ['/', '/search', '/donor-request', '/donors', '/requests-list', '/help'];
    navigate(routes[newValue]);
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        borderTop: 1,
        borderColor: 'divider',
      }}
      elevation={8}
    >
      <BottomNavigation
        value={getNavigationValue(location.pathname)}
        onChange={handleNavigationChange}
        showLabels={false}
        sx={{
          height: 64,
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: '6px 12px',
          },
        }}
      >
        <BottomNavigationAction
          icon={<HomeIcon />}
          aria-label="Home"
          title="Home"
        />
        <BottomNavigationAction
          icon={<SearchIcon />}
          aria-label="Search"
          title="Search Donors"
        />
        <BottomNavigationAction
          icon={<PersonAddIcon />}
          aria-label="Add Donor"
          title="Add New Donor"
        />
        <BottomNavigationAction
          icon={<PeopleIcon />}
          aria-label="Donors List"
          title="Donors List"
        />
        <BottomNavigationAction
          icon={
            <Badge badgeContent={requestCount} color="secondary">
              <ListAltIcon />
            </Badge>
          }
          aria-label="Requests"
          title={`Requests${requestCount > 0 ? ` (${requestCount})` : ''}`}
        />
        <BottomNavigationAction
          icon={<HelpIcon />}
          aria-label="Help"
          title="Help"
        />
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNavbar;

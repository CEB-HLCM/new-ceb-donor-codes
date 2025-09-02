import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Box,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  Search as SearchIcon,
  Add as AddIcon,
  LocationCity as LocationCityIcon,
  ListAlt as ListAltIcon,
  HelpOutline as HelpIcon,
  PersonOutline as PersonIcon,
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  isAuthenticated?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose, isAuthenticated = false }) => {
  const location = useLocation();

  const menuItems = [
    { text: 'Search', icon: <SearchIcon />, path: '/search' },
    { text: 'Add Donor', icon: <AddIcon />, path: '/donor-request' },
    { text: 'Donors List', icon: <LocationCityIcon />, path: '/donors' },
    { text: 'Requests', icon: <ListAltIcon />, path: '/requests-list' },
    { text: 'Help', icon: <HelpIcon />, path: '/help' },
  ];

  // Remove login/logout functionality since no login page exists

  return (
    <Drawer
      variant="temporary"
      anchor="left"
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile.
      }}
      sx={{
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'flex-end',
        minHeight: 64,
        px: 1 
      }}>
        <IconButton onClick={onClose}>
          <ChevronLeftIcon />
        </IconButton>
      </Box>
      
      <Divider />
      
      <List>
        {menuItems.map((item) => (
          <ListItem
            key={item.text}
            component={Link}
            to={item.path}
            onClick={onClose}
            sx={{
              color: '#111',
              textDecoration: 'none',
              backgroundColor: location.pathname === item.path ? 'rgba(0, 143, 213, 0.1)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(0, 143, 213, 0.05)',
              },
            }}
          >
            <ListItemIcon sx={{ color: '#111' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
        
        {/* Login/logout removed - no authentication in this app */}
      </List>
    </Drawer>
  );
};

export default Sidebar;

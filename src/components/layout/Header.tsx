import React from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Badge,
  Box,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ListAlt as ListAltIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo-1.svg';

interface HeaderProps {
  onMenuClick: () => void;
  requestCount?: number;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, requestCount = 0 }) => {
  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={onMenuClick}
          edge="start"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        
        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
            <img 
              src={logo} 
              alt="CEB Logo" 
              style={{ height: '3em' }} 
            />
          </Link>
        </Box>
        
        <Link 
          to="/requests-list" 
          style={{ textDecoration: 'none', color: 'inherit' }}
          title={`You have ${requestCount} pending request(s).`}
        >
          <IconButton aria-label="show requests" color="inherit">
            <Badge badgeContent={requestCount} color="secondary">
              <ListAltIcon />
            </Badge>
          </IconButton>
        </Link>
      </Toolbar>
    </AppBar>
  );
};

export default Header;

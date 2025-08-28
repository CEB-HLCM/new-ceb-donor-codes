import { createTheme } from '@mui/material/styles';

// Color palette extracted from original CEB Donor Codes app
export const cebColors = {
  primary: '#008fd5',      // AppBar background
  tableHeader: '#96C8DA',  // Table header background
  buttonHover: '#4cafff',  // Button hover state
  selected: '#2185d0',     // Selected/active state
  tableAlt: '#ababab',     // Table alternate row background
  tableBorder: '#777',     // Table borders
  white: '#ffffff',
  textPrimary: '#111',     // Main text color
  textSecondary: '#666',
} as const;

const themeOptions = {
  palette: {
    primary: {
      main: cebColors.primary,
      contrastText: cebColors.white,
    },
    secondary: {
      main: cebColors.tableHeader,
      contrastText: cebColors.white,
    },
    info: {
      main: cebColors.buttonHover,
    },
    background: {
      default: '#fafafa',
      paper: cebColors.white,
    },
    text: {
      primary: cebColors.textPrimary,
      secondary: cebColors.textSecondary,
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'Oxygen',
      'Ubuntu',
      'Cantarell',
      '"Fira Sans"',
      '"Droid Sans"',
      '"Helvetica Neue"',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    // Table typography to match original
    body2: {
      fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
    },
  },
  components: {
    // AppBar styling to match original
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: cebColors.primary,
          color: cebColors.white,
        },
      },
    },
    // Button styling to match original
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none' as const,
          borderRadius: 4,
        },
        contained: {
          '&:hover': {
            backgroundColor: cebColors.buttonHover,
          },
        },
        outlined: {
          borderColor: cebColors.buttonHover,
          color: cebColors.buttonHover,
          '&:hover': {
            backgroundColor: cebColors.buttonHover,
            color: cebColors.white,
          },
        },
      },
    },
    // Table styling to match original
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: cebColors.tableHeader,
            color: cebColors.white,
            fontWeight: 600,
            border: `1px solid ${cebColors.tableBorder}`,
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root:nth-of-type(odd)': {
            backgroundColor: cebColors.tableAlt,
          },
          '& .MuiTableCell-body': {
            border: `1px solid ${cebColors.tableBorder}`,
            fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
          },
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          border: `3px solid ${cebColors.tableBorder}`,
          borderCollapse: 'collapse' as const,
        },
      },
    },
    // Pagination styling to match original
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          fontSize: '1rem',
          '&.Mui-selected': {
            backgroundColor: `${cebColors.selected} !important`,
            color: `${cebColors.white} !important`,
          },
        },
      },
    },
    // Drawer styling
    MuiDrawer: {
      styleOverrides: {
        paper: {
          width: 240,
        },
      },
    },
  },
};

export const theme = createTheme(themeOptions);

export default theme;

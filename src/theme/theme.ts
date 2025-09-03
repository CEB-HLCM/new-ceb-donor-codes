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
  // New blue-based action colors
  updateAction: '#1976d2',    // Blue for update actions
  removeAction: '#0d47a1',    // Darker blue for remove actions
} as const;

const themeOptions = {
  defaultColorScheme: 'light',
  colorSchemes: {
    light: {
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
        // Custom action colors using blue shades
        action: {
          update: cebColors.updateAction,
          updateHover: '#1565c0',
          remove: cebColors.removeAction,
          removeHover: '#0a237d',
        },
      },
    },
    dark: {
      palette: {
        primary: {
          main: '#4cafff',
          contrastText: '#ffffff',
        },
        secondary: {
          main: '#64b5f6',
          contrastText: '#ffffff',
        },
        info: {
          main: '#81c784',
        },
        background: {
          default: '#121212',
          paper: '#1e1e1e',
        },
        text: {
          primary: '#ffffff',
          secondary: 'rgba(255, 255, 255, 0.7)',
        },
        // Custom action colors for dark mode
        action: {
          update: '#2196f3',
          updateHover: '#1976d2',
          remove: '#1565c0',
          removeHover: '#0d47a1',
        },
      },
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
    // AppBar styling with dark mode support
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          ...theme.applyStyles('light', {
            backgroundColor: cebColors.primary,
            color: cebColors.white,
          }),
          ...theme.applyStyles('dark', {
            backgroundColor: '#1976d2',
            color: '#ffffff',
          }),
        }),
      },
    },
    // Button styling with dark mode support
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none' as const,
          borderRadius: 4,
        },
        contained: ({ theme }) => ({
          ...theme.applyStyles('light', {
            '&:hover': {
              backgroundColor: cebColors.buttonHover,
            },
          }),
          ...theme.applyStyles('dark', {
            '&:hover': {
              filter: 'brightness(1.1)',
            },
          }),
        }),
        outlined: ({ theme }) => ({
          ...theme.applyStyles('light', {
            borderColor: cebColors.buttonHover,
            color: cebColors.buttonHover,
            '&:hover': {
              backgroundColor: cebColors.buttonHover,
              color: cebColors.white,
            },
          }),
          ...theme.applyStyles('dark', {
            borderColor: '#4cafff',
            color: '#4cafff',
            '&:hover': {
              backgroundColor: '#4cafff',
              color: '#000000',
            },
          }),
        }),
      },
    },
    // Table styling with dark mode support
    MuiTableHead: {
      styleOverrides: {
        root: ({ theme }) => ({
          '& .MuiTableCell-head': {
            fontWeight: 600,
            ...theme.applyStyles('light', {
              backgroundColor: cebColors.tableHeader,
              color: cebColors.white,
              border: `1px solid ${cebColors.tableBorder}`,
            }),
            ...theme.applyStyles('dark', {
              backgroundColor: '#2e2e2e',
              color: '#ffffff',
              border: '1px solid #555',
            }),
          },
        }),
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: ({ theme }) => ({
          ...theme.applyStyles('light', {
            '& .MuiTableRow-root:nth-of-type(odd)': {
              backgroundColor: cebColors.tableAlt,
            },
            '& .MuiTableCell-body': {
              border: `1px solid ${cebColors.tableBorder}`,
              fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
            },
          }),
          ...theme.applyStyles('dark', {
            '& .MuiTableRow-root:nth-of-type(odd)': {
              backgroundColor: '#2a2a2a',
            },
            '& .MuiTableCell-body': {
              border: '1px solid #555',
              fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif',
            },
          }),
        }),
      },
    },
    MuiTable: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderCollapse: 'collapse' as const,
          ...theme.applyStyles('light', {
            border: `3px solid ${cebColors.tableBorder}`,
          }),
          ...theme.applyStyles('dark', {
            border: '3px solid #555',
          }),
        }),
      },
    },
    // Pagination styling with dark mode support
    MuiPaginationItem: {
      styleOverrides: {
        root: ({ theme }) => ({
          fontSize: '1rem',
          ...theme.applyStyles('light', {
            '&.Mui-selected': {
              backgroundColor: `${cebColors.selected} !important`,
              color: `${cebColors.white} !important`,
            },
          }),
          ...theme.applyStyles('dark', {
            '&.Mui-selected': {
              backgroundColor: '#4cafff !important',
              color: '#000000 !important',
            },
          }),
        }),
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

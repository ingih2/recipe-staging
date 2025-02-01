import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import App from './App';

import { createTheme } from '@mui/material/styles';
import type { } from '@mui/x-data-grid/themeAugmentation';

const theme = createTheme({
  palette: {
    background: {
      default: '#f4f4f4',
    },
    primary: {
      main: '#2e2e2e',
      contrastText: '#fff',
    },
    secondary: {
      main: '#7b2084',
      contrastText: '#fff'
    },
    error: {
      main: '#B7183A',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'Karla',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(',')
  },
  components: {
    MuiInputBase: {
      defaultProps: {
        disableInjectingGlobalStyles: true,
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          backgroundColor: '#f4f4f4',
        },
      },
    },
  },
});

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement!);

root.render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <App />
  </ThemeProvider>,
);

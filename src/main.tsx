import * as React from 'react';
import { createRoot } from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import './license';
import theme from './theme';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* `defaultMode="system"` matches the inline bootstrap script in index.html. */}
    <ThemeProvider theme={theme} defaultMode="system">
      <CssBaseline enableColorScheme />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);

import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import { hasLicenseKey } from './license';
import DataGridTab from './tabs/DataGridTab';
import TreeViewTab from './tabs/TreeViewTab';

export default function App() {
  const [tab, setTab] = React.useState(0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar variant="dense" sx={{ gap: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            MUI X Pro testbed
          </Typography>
          <Chip
            size="small"
            label={hasLicenseKey ? 'Licence key loaded' : 'No licence key'}
            color={hasLicenseKey ? 'success' : 'warning'}
            variant="outlined"
          />
        </Toolbar>
        <Tabs value={tab} onChange={(_event, value) => setTab(value)} sx={{ px: 2 }}>
          <Tab label="1 · DataGrid Pro" />
          <Tab label="2 · Tree View Pro" />
        </Tabs>
      </AppBar>

      {!hasLicenseKey && (
        <Alert severity="warning" square>
          <code>VITE_MUI_LICENSE_KEY</code> is not set, so the Pro components render a watermark.
          Add it to <code>.env.local</code> locally, or as a Vercel environment variable, then
          restart the dev server.
        </Alert>
      )}

      {/*
        Both tabs are unmounted when inactive on purpose — it keeps the grid's and the
        tree's virtualizers from measuring a zero-height container.
      */}
      <Box sx={{ flex: 1, minHeight: 0, p: 2, overflow: 'auto' }}>
        {tab === 0 ? <DataGridTab /> : <TreeViewTab />}
      </Box>
    </Box>
  );
}

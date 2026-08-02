import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import TableChartRoundedIcon from '@mui/icons-material/TableChartRounded';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { hasLicenseKey } from './license';
import { BRAND_GRADIENT } from './theme';
import ColorModeToggle from './components/ColorModeToggle';
import DataGridTab from './tabs/DataGridTab';
import TreeViewTab from './tabs/TreeViewTab';

/** Gradient app icon. The glow behind it is a blurred copy of the same gradient. */
function BrandMark() {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: 3,
          backgroundImage: BRAND_GRADIENT,
          filter: 'blur(10px)',
          opacity: 0.55,
        }}
      />
      <Box
        sx={{
          position: 'relative',
          width: 34,
          height: 34,
          borderRadius: 3,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          backgroundImage: BRAND_GRADIENT,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)',
        }}
      >
        <AutoAwesomeRoundedIcon sx={{ fontSize: 19 }} />
      </Box>
    </Box>
  );
}

const TABS = [
  { label: 'DataGrid Pro', icon: <TableChartRoundedIcon />, hint: '10,000 rows · filters · grouping' },
  { label: 'Tree View Pro', icon: <AccountTreeRoundedIcon />, hint: '22,220 nodes · 60 Hz repaint' },
];

export default function App() {
  const [tab, setTab] = React.useState(0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar position="static" color="default" enableColorOnDark>
        <Toolbar variant="dense" sx={{ gap: 2, minHeight: 62, px: { xs: 2, md: 3 } }}>
          <BrandMark />

          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontSize: 16,
                lineHeight: 1.2,
                backgroundImage: BRAND_GRADIENT,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                width: 'fit-content',
              }}
            >
              MUI X Pro testbed
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: { xs: 'none', sm: 'block' }, lineHeight: 1.3 }}
            >
              {TABS[tab].hint}
            </Typography>
          </Box>

          <Tooltip
            title={
              hasLicenseKey
                ? 'VITE_MUI_LICENSE_KEY was found at build time'
                : 'Pro components render a watermark without a key'
            }
          >
            <Chip
              size="small"
              icon={hasLicenseKey ? <VerifiedRoundedIcon /> : <WarningAmberRoundedIcon />}
              label={hasLicenseKey ? 'Licence key loaded' : 'No licence key'}
              color={hasLicenseKey ? 'success' : 'warning'}
              variant="outlined"
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            />
          </Tooltip>

          <ColorModeToggle />
        </Toolbar>

        <Tabs
          value={tab}
          onChange={(_event, value) => setTab(value)}
          sx={{ px: { xs: 1, md: 2 } }}
        >
          {TABS.map(({ label, icon }, index) => (
            <Tab
              key={label}
              icon={icon}
              iconPosition="start"
              label={
                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box
                    component="span"
                    sx={{
                      fontSize: 11,
                      fontWeight: 700,
                      opacity: 0.6,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {index + 1}
                  </Box>
                  {label}
                </Box>
              }
              sx={{ gap: 0.75, '& .MuiSvgIcon-root': { fontSize: 18 } }}
            />
          ))}
        </Tabs>
      </AppBar>

      {!hasLicenseKey && (
        <Alert severity="warning" square sx={{ borderRadius: 0, borderInline: 0 }}>
          <code>VITE_MUI_LICENSE_KEY</code> is not set, so the Pro components render a watermark.
          Add it to <code>.env.local</code> locally, or as a Vercel environment variable, then
          restart the dev server.
        </Alert>
      )}

      {/*
        Both tabs are unmounted when inactive on purpose — it keeps the grid's and the
        tree's virtualizers from measuring a zero-height container.
      */}
      <Box
        // Keyed on the tab so the enter animation replays on every switch.
        key={tab}
        sx={{
          flex: 1,
          minHeight: 0,
          p: { xs: 1.5, md: 2.5 },
          overflow: 'auto',
          animation: 'riseIn 320ms cubic-bezier(0.22, 1, 0.36, 1) both',
        }}
      >
        {tab === 0 ? <DataGridTab /> : <TreeViewTab />}
      </Box>
    </Box>
  );
}

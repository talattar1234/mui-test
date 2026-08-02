import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

export interface StatTileProps {
  label: string;
  value: React.ReactNode;
  /** Hex used for the tile's glow and its top rule. */
  accent?: string;
  /** Render the value in the monospace stack — for ids and codes. */
  mono?: boolean;
}

/**
 * A compact number tile for the top of a controls column. The accent colour is a
 * literal hex rather than a palette token: these three sit side by side and need
 * to stay distinguishable from each other, not follow the primary colour.
 */
export default function StatTile({ label, value, accent = '#6366f1', mono }: StatTileProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        flex: 1,
        minWidth: 0,
        px: 1.5,
        py: 1.25,
        position: 'relative',
        overflow: 'hidden',
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(120px 60px at 50% 120%, ${accent}, transparent 70%)`,
          opacity: 0.16,
          pointerEvents: 'none',
        },
      }}
    >
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          color: 'text.secondary',
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
      <Box
        sx={{
          mt: 0.25,
          fontSize: mono ? 15 : 19,
          fontWeight: 700,
          lineHeight: 1.25,
          fontVariantNumeric: 'tabular-nums',
          fontFamily: mono ? 'ui-monospace, "Cascadia Code", Consolas, monospace' : undefined,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </Box>
    </Paper>
  );
}

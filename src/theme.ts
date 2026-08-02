import { createTheme, alpha } from '@mui/material/styles';
import {
  COLOR_HEX,
  COLOR_HEX_DARK,
  STATUS_HEX,
  STATUS_HEX_DARK,
} from './data/colors';

/*
  ────────────────────────────────────────────────────────────────────────────
  "Aurora" — the design language for this testbed.

  Two full colour schemes built on MUI's CSS-variable theming, so flipping the
  mode swaps custom properties on <html> instead of re-rendering. That matters
  here: both tabs hold tens of thousands of virtualized rows, and a theme switch
  that forced a full re-render would stutter.

  Because the theme is variable-driven, `theme.palette.x` inside an override is
  the *default scheme's* frozen value and would not follow the mode. Anything
  colour-related below therefore goes through `V` (a var reference) or through
  `theme.applyStyles('dark', …)`.
  ────────────────────────────────────────────────────────────────────────────
*/

const FONT_STACK = [
  'Inter',
  '"Segoe UI Variable Text"',
  '"Segoe UI"',
  'system-ui',
  '-apple-system',
  'Roboto',
  '"Helvetica Neue"',
  'Arial',
  'sans-serif',
].join(', ');

const MONO_STACK = [
  '"Cascadia Code"',
  '"JetBrains Mono"',
  'ui-monospace',
  'SFMono-Regular',
  'Menlo',
  'Consolas',
  'monospace',
].join(', ');

/** Live theme values, as CSS variables — these track the active colour scheme. */
export const V = {
  divider: 'var(--mui-palette-divider)',
  primary: 'var(--mui-palette-primary-main)',
  paper: 'var(--mui-palette-background-paper)',
  textPrimary: 'var(--mui-palette-text-primary)',
  textSecondary: 'var(--mui-palette-text-secondary)',
  /** `primary.main` at an arbitrary alpha, via the channel token MUI emits. */
  primaryA: (a: number) => `rgba(var(--mui-palette-primary-mainChannel) / ${a})`,
  paperA: (a: number) => `rgba(var(--mui-palette-background-paperChannel) / ${a})`,
  defaultA: (a: number) => `rgba(var(--mui-palette-background-defaultChannel) / ${a})`,
  textA: (a: number) => `rgba(var(--mui-palette-text-primaryChannel) / ${a})`,
};

/** The brand ramp — indigo into violet into cyan. Used for the logo, tabs and accents. */
export const BRAND_GRADIENT = 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #06b6d4 100%)';

/** Turns a token record into the `--fav-red` / `--status-ok` custom properties. */
function toCssVars(prefix: string, record: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(record).map(([token, hex]) => [`--${prefix}-${token.toLowerCase()}`, hex]),
  );
}

const theme = createTheme({
  // `data` puts the scheme on <html data-mui-color-scheme="…">, which is what the
  // anti-flash script in index.html sets before React boots.
  cssVariables: { colorSchemeSelector: 'data' },
  defaultColorScheme: 'dark',
  colorSchemes: {
    light: {
      palette: {
        primary: { light: '#6366f1', main: '#4f46e5', dark: '#4338ca', contrastText: '#ffffff' },
        secondary: { light: '#22d3ee', main: '#0891b2', dark: '#0e7490', contrastText: '#ffffff' },
        success: { main: '#16a34a' },
        warning: { main: '#ea580c' },
        error: { main: '#dc2626' },
        info: { main: '#0284c7' },
        background: { default: '#f4f5fb', paper: '#ffffff' },
        text: { primary: '#0f172a', secondary: '#5b6478' },
        divider: 'rgba(15, 23, 42, 0.10)',
      },
    },
    dark: {
      palette: {
        primary: { light: '#a5b4fc', main: '#818cf8', dark: '#6366f1', contrastText: '#0b1020' },
        secondary: { light: '#67e8f9', main: '#22d3ee', dark: '#0891b2', contrastText: '#04202a' },
        success: { main: '#4ade80' },
        warning: { main: '#fb923c' },
        error: { main: '#f87171' },
        info: { main: '#38bdf8' },
        background: { default: '#080a12', paper: '#111524' },
        text: { primary: '#e6e9f2', secondary: '#98a2b8' },
        divider: 'rgba(148, 163, 184, 0.16)',
      },
    },
  },

  shape: { borderRadius: 12 },

  typography: {
    fontFamily: FONT_STACK,
    fontSize: 13,
    h6: { fontWeight: 700, letterSpacing: '-0.015em' },
    subtitle1: { fontWeight: 600, letterSpacing: '-0.01em' },
    subtitle2: { fontWeight: 700, letterSpacing: '-0.005em' },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: 0 },
    caption: { lineHeight: 1.55 },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          ...toCssVars('fav', COLOR_HEX),
          ...toCssVars('status', STATUS_HEX),
          '--aurora-1': 'rgba(99, 102, 241, 0.20)',
          '--aurora-2': 'rgba(6, 182, 212, 0.16)',
          '--aurora-3': 'rgba(168, 85, 247, 0.14)',
          '--scrollbar-thumb': 'rgba(15, 23, 42, 0.22)',
          '--dot-ring': 'rgba(15, 23, 42, 0.12)',
        },
        '[data-mui-color-scheme="dark"]': {
          ...toCssVars('fav', COLOR_HEX_DARK),
          ...toCssVars('status', STATUS_HEX_DARK),
          '--aurora-1': 'rgba(99, 102, 241, 0.26)',
          '--aurora-2': 'rgba(6, 182, 212, 0.18)',
          '--aurora-3': 'rgba(168, 85, 247, 0.20)',
          '--scrollbar-thumb': 'rgba(148, 163, 184, 0.28)',
          '--dot-ring': 'rgba(255, 255, 255, 0.14)',
        },

        'code, kbd, pre': { fontFamily: MONO_STACK, fontSize: '0.92em' },

        body: {
          // Three soft light sources, painted once and never animated — this app
          // is a performance testbed, so the backdrop must not cost frames.
          backgroundImage: `
            radial-gradient(1100px 600px at 12% -8%, var(--aurora-1), transparent 60%),
            radial-gradient(900px 520px at 92% 4%, var(--aurora-2), transparent 62%),
            radial-gradient(1000px 700px at 60% 108%, var(--aurora-3), transparent 60%)`,
          backgroundAttachment: 'fixed',
          scrollbarColor: 'var(--scrollbar-thumb) transparent',
        },

        '*::-webkit-scrollbar': { width: 10, height: 10 },
        '*::-webkit-scrollbar-track': { background: 'transparent' },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: 'var(--scrollbar-thumb)',
          borderRadius: 8,
          border: '2px solid transparent',
          backgroundClip: 'padding-box',
        },
        '*::-webkit-scrollbar-thumb:hover': { backgroundColor: V.primaryA(0.5) },

        '@keyframes riseIn': {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'none' },
        },
      },
    },

    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: ({ theme: t }) => ({
          backgroundImage: 'none',
          ...t.applyStyles('dark', {
            // Lift panels off the near-black page without washing them grey.
            backgroundImage: `linear-gradient(180deg, ${alpha('#ffffff', 0.035)}, ${alpha('#ffffff', 0.012)})`,
          }),
        }),
      },
      variants: [
        {
          props: { variant: 'outlined' },
          style: ({ theme: t }) => ({
            borderRadius: 16,
            boxShadow: `0 1px 2px ${alpha('#0f172a', 0.04)}, 0 8px 24px -18px ${alpha('#0f172a', 0.4)}`,
            ...t.applyStyles('dark', {
              boxShadow: `inset 0 1px 0 ${alpha('#ffffff', 0.04)}, 0 12px 32px -22px #000`,
            }),
          }),
        },
      ],
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(16px) saturate(180%)',
          backgroundColor: V.defaultA(0.72),
          borderBottom: `1px solid ${V.divider}`,
          boxShadow: 'none',
          backgroundImage: 'none',
        },
      },
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 10, paddingInline: 14 } },
      variants: [
        {
          props: { variant: 'contained', color: 'primary' },
          style: {
            backgroundImage: 'linear-gradient(135deg, #6366f1, #7c3aed)',
            color: '#fff',
            boxShadow: '0 6px 18px -8px rgba(99, 102, 241, 0.9)',
            '&:hover': { backgroundImage: 'linear-gradient(135deg, #4f46e5, #6d28d9)' },
          },
        },
        {
          props: { variant: 'outlined' },
          style: {
            borderColor: V.divider,
            '&:hover': { borderColor: V.primaryA(0.6), backgroundColor: V.primaryA(0.06) },
          },
        },
      ],
    },

    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 600,
          borderColor: V.divider,
          '&.Mui-selected': {
            backgroundColor: V.primaryA(0.16),
            borderColor: V.primaryA(0.5),
            '&:hover': { backgroundColor: V.primaryA(0.24) },
          },
        },
      },
    },

    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 46 },
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
          backgroundImage: BRAND_GRADIENT,
        },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 46,
          fontWeight: 600,
          fontSize: 13.5,
          letterSpacing: '-0.005em',
          '&:hover': { color: V.textPrimary },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 8 },
        outlined: { borderColor: V.divider },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: V.paperA(0.55),
          '& .MuiOutlinedInput-notchedOutline': { borderColor: V.divider },
        },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 12, border: `1px solid ${V.divider}`, alignItems: 'center' },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: ({ theme: t }) => ({
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 500,
          padding: '6px 10px',
          backgroundColor: '#1e293b',
          boxShadow: '0 8px 24px -12px rgba(0,0,0,0.6)',
          ...t.applyStyles('dark', { backgroundColor: '#2a3145' }),
        }),
      },
    },

    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: `1px solid ${V.divider}`,
          boxShadow: '0 20px 48px -24px rgba(0,0,0,0.55)',
        },
        list: { padding: 6 },
      },
    },

    MuiMenuItem: {
      styleOverrides: { root: { borderRadius: 8, fontSize: 13 } },
    },

    MuiSwitch: {
      styleOverrides: {
        root: { '& .MuiSwitch-thumb': { boxShadow: '0 1px 3px rgba(0,0,0,0.3)' } },
      },
    },

    MuiFormControlLabel: {
      styleOverrides: { label: { fontSize: 13 } },
    },
  },
});

export default theme;

export const FAVORITE_COLORS = [
  'Red',
  'Blue',
  'Green',
  'Yellow',
  'Purple',
  'Orange',
  'Teal',
  'Pink',
] as const;

export type FavoriteColor = (typeof FAVORITE_COLORS)[number];

export const COLOR_HEX: Record<FavoriteColor, string> = {
  Red: '#e53935',
  Blue: '#1e88e5',
  Green: '#43a047',
  Yellow: '#f9a825',
  Purple: '#8e24aa',
  Orange: '#fb8c00',
  Teal: '#00897b',
  Pink: '#d81b60',
};

/**
 * The same hues lifted for dark surfaces. The light values are tuned for contrast
 * against white and go muddy on a near-black background, so every swatch has a
 * brighter, less saturated twin.
 */
export const COLOR_HEX_DARK: Record<FavoriteColor, string> = {
  Red: '#ff6b6b',
  Blue: '#5eaaff',
  Green: '#5ed17f',
  Yellow: '#ffd34d',
  Purple: '#c98bff',
  Orange: '#ffab48',
  Teal: '#3fd6c0',
  Pink: '#ff77ab',
};

/** Status shown as a coloured dot on the right of every tree item. */
export const STATUSES = ['ok', 'warning', 'error', 'idle', 'running'] as const;

export type Status = (typeof STATUSES)[number];

export const STATUS_HEX: Record<Status, string> = {
  ok: '#16a34a',
  warning: '#ea580c',
  error: '#dc2626',
  idle: '#94a3b8',
  running: '#0284c7',
};

export const STATUS_HEX_DARK: Record<Status, string> = {
  ok: '#4ade80',
  warning: '#fb923c',
  error: '#f87171',
  idle: '#94a3b8',
  running: '#38bdf8',
};

/*
  Both palettes are published as CSS custom properties by the theme (see
  `theme.ts`), keyed by the lower-cased token name. Reading them through a
  variable instead of a JS lookup means a swatch re-colours itself when the
  colour scheme flips, with no React re-render and no `useTheme()` in the hot
  path — which matters for the 60 Hz status-flipping test.
*/

/** CSS variable holding the current scheme's colour for a favourite colour. */
export const colorVar = (value: FavoriteColor) => `var(--fav-${value.toLowerCase()})`;

/** CSS variable holding the current scheme's colour for a status. */
export const statusVar = (value: Status) => `var(--status-${value})`;

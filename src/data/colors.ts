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
  Yellow: '#fdd835',
  Purple: '#8e24aa',
  Orange: '#fb8c00',
  Teal: '#00897b',
  Pink: '#d81b60',
};

/** Status shown as a coloured dot on the right of every tree item. */
export const STATUSES = ['ok', 'warning', 'error', 'idle', 'running'] as const;

export type Status = (typeof STATUSES)[number];

export const STATUS_HEX: Record<Status, string> = {
  ok: '#2e7d32',
  warning: '#ed6c02',
  error: '#d32f2f',
  idle: '#9e9e9e',
  running: '#0288d1',
};

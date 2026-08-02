import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import { useColorScheme } from '@mui/material/styles';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import SettingsBrightnessRoundedIcon from '@mui/icons-material/SettingsBrightnessRounded';
import { V } from '../theme';

const MODES = [
  { value: 'light', label: 'Light', Icon: LightModeRoundedIcon },
  { value: 'system', label: 'Follow the system', Icon: SettingsBrightnessRoundedIcon },
  { value: 'dark', label: 'Dark', Icon: DarkModeRoundedIcon },
] as const;

/**
 * Segmented light / system / dark control.
 *
 * The selected pill is a single absolutely-positioned element that slides, so
 * switching modes animates instead of blinking. `useColorScheme` writes the
 * choice to `localStorage` and flips `data-mui-color-scheme` on <html>; the
 * inline script in `index.html` replays it before first paint.
 */
export default function ColorModeToggle() {
  const { mode, setMode } = useColorScheme();

  // `mode` is undefined until the provider has read localStorage on the client.
  if (!mode) {
    return <Skeleton variant="rounded" width={106} height={34} sx={{ borderRadius: 999 }} />;
  }

  const activeIndex = MODES.findIndex((entry) => entry.value === mode);

  return (
    <Box
      role="radiogroup"
      aria-label="Colour mode"
      sx={{
        position: 'relative',
        display: 'flex',
        p: '3px',
        borderRadius: 999,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'action.hover',
      }}
    >
      {/* The sliding highlight behind the icons. */}
      <Box
        aria-hidden
        sx={(theme) => ({
          position: 'absolute',
          top: 3,
          left: 3,
          width: 32,
          height: 28,
          borderRadius: 999,
          backgroundImage: 'linear-gradient(135deg, #6366f1, #a855f7)',
          boxShadow: '0 4px 12px -6px rgba(99,102,241,0.9)',
          transform: `translateX(${activeIndex * 32}px)`,
          transition: theme.transitions.create('transform', {
            duration: 220,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          }),
        })}
      />
      {MODES.map(({ value, label, Icon }) => {
        const selected = mode === value;
        return (
          <Tooltip key={value} title={label} disableInteractive>
            <Box
              component="button"
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={label}
              onClick={() => setMode(value)}
              sx={(theme) => ({
                position: 'relative',
                width: 32,
                height: 28,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 0,
                p: 0,
                background: 'none',
                cursor: 'pointer',
                borderRadius: 999,
                color: selected ? '#fff' : 'text.secondary',
                transition: theme.transitions.create('color', { duration: 160 }),
                '&:hover': { color: selected ? '#fff' : 'text.primary' },
                '&:focus-visible': { outline: `2px solid ${V.primary}`, outlineOffset: 2 },
              })}
            >
              <Icon sx={{ fontSize: 17 }} />
            </Box>
          </Tooltip>
        );
      })}
    </Box>
  );
}

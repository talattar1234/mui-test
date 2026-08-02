import * as React from 'react';
import Box from '@mui/material/Box';
import Paper, { type PaperProps } from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { V } from '../theme';

export interface SectionCardProps extends Omit<PaperProps, 'title'> {
  /** Short number shown in the corner badge, e.g. `1` for "Test 1". */
  step?: React.ReactNode;
  icon?: React.ReactNode;
  title: React.ReactNode;
  /** One line under the title, before the controls. */
  subtitle?: React.ReactNode;
  /** Rendered on the right of the header row — a status chip, usually. */
  action?: React.ReactNode;
  /** Small print rendered under the children in the muted caption style. */
  footnote?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * The panel every test control group lives in: gradient-ringed icon, a numbered
 * step badge, and a hairline that separates the header from the controls. One
 * component so the two tabs stay visually identical without copy-pasting the
 * header markup five times.
 */
export default function SectionCard({
  step,
  icon,
  title,
  subtitle,
  action,
  footnote,
  children,
  sx,
  ...other
}: SectionCardProps) {
  return (
    <Paper
      variant="outlined"
      sx={[
        {
          p: 2,
          position: 'relative',
          overflow: 'hidden',
          transition: (theme) =>
            theme.transitions.create(['border-color', 'box-shadow'], { duration: 200 }),
          // A thin gradient rule along the top edge, brightened on hover.
          '&::before': {
            content: '""',
            position: 'absolute',
            insetInline: 0,
            top: 0,
            height: 2,
            backgroundImage: 'linear-gradient(90deg, #6366f1, #a855f7, #06b6d4)',
            opacity: 0.5,
            transition: 'opacity 200ms',
          },
          '&:hover::before': { opacity: 1 },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: subtitle ? 0.5 : 1.5 }}>
        {icon && (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 30,
              height: 30,
              flexShrink: 0,
              borderRadius: 2,
              color: 'primary.main',
              // Tinted through the live CSS variable, so it follows the scheme.
              backgroundColor: V.primaryA(0.14),
              border: `1px solid ${V.primaryA(0.26)}`,
              '& .MuiSvgIcon-root': { fontSize: 18 },
            }}
          >
            {icon}
          </Box>
        )}

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle2" sx={{ lineHeight: 1.35 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        {step != null && (
          <Box
            sx={{
              flexShrink: 0,
              px: 0.9,
              py: 0.15,
              borderRadius: 1,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: 'text.secondary',
              bgcolor: 'action.hover',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {step}
          </Box>
        )}
        {action}
      </Stack>

      {subtitle && <Box sx={{ height: 12 }} />}

      {children}

      {footnote && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 1.5, pt: 1.5, borderTop: '1px dashed', borderColor: 'divider' }}
        >
          {footnote}
        </Typography>
      )}
    </Paper>
  );
}

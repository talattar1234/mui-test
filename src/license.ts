import { LicenseInfo } from '@mui/x-license';

/**
 * The Pro license key is read from the build-time env var `VITE_MUI_LICENSE_KEY`.
 * Locally put it in `.env.local`; on Vercel add it as an Environment Variable.
 *
 * Without a key the components still work but render a watermark and log a
 * console error, which is why we surface the state on screen instead of failing.
 */
const key = import.meta.env.VITE_MUI_LICENSE_KEY;

export const hasLicenseKey = typeof key === 'string' && key.length > 0;

if (hasLicenseKey) {
  LicenseInfo.setLicenseKey(key);
}

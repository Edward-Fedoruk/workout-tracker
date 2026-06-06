/**
 * muiTheme.ts — Workout Log MUI theme, driven by the design system.
 * Replaces the inline `createTheme(...)` formerly in src/App.tsx.
 *
 *   // App.tsx
 *   import { muiTheme } from '@/muiTheme';
 *   <ThemeProvider theme={muiTheme}>…</ThemeProvider>
 *
 * This is the single source of truth for the app's look. Every MUI component is
 * restyled here via `styleOverrides`/`defaultProps` so the whole app inherits
 * the dark emerald-on-near-black language without per-component `sx`. Values
 * mirror the design-system tokens (tokens/colors.css, spacing.css) and
 * src/ds-tokens.css — keep them in sync.
 */
import { createTheme } from '@mui/material';

// ---- Design tokens (from the Workout Log design system) ----
const token = {
  accentSoft: 'rgba(16, 185, 129, 0.12)',
  accentSoftHover: 'rgba(16, 185, 129, 0.20)',
  border: 'rgba(16, 185, 129, 0.22)',
  borderStrong: 'rgba(16, 185, 129, 0.40)',
  bright: '#E2E8F0',
  danger: '#EF4444',
  // lines + status
  divider: 'rgba(16, 185, 129, 0.16)',
  // brand emerald
  emerald300: '#6EE7B7',
  emerald400: '#34D399',
  emerald500: '#10B981',
  emerald600: '#059669',
  // effects — the brand is shadowless; only overlays cast a real shadow
  focusRing: '0 0 0 3px rgba(16, 185, 129, 0.25)',
  info: '#38BDF8',
  overlayShadow: '0 16px 48px -12px rgba(0, 0, 0, 0.7)',
  scrim: 'rgba(0, 0, 0, 0.6)',
  // surfaces
  surfaceBase: '#121814',
  surfaceCard: '#1A231E',
  surfaceElevated: '#202C25',
  surfaceHover: '#2A3830',
  textMuted: '#64748B',
  // neutral / text
  textPrimary: '#F0FDF4',
  textSecondary: '#94A3B8',
  warning: '#FBBF24',
} as const;

export const muiTheme = createTheme({
  components: {
    // ---- Feedback ----
    MuiAlert: {
      styleOverrides: {
        root: {
          '&.MuiAlert-standardError': {
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${token.danger}`,
          },
          '&.MuiAlert-standardInfo': {
            backgroundColor: 'rgba(56, 189, 248, 0.12)',
            border: `1px solid ${token.info}`,
          },
          '&.MuiAlert-standardSuccess': {
            backgroundColor: token.accentSoft,
            border: `1px solid ${token.emerald400}`,
          },
          '&.MuiAlert-standardWarning': {
            backgroundColor: 'rgba(251, 191, 36, 0.12)',
            border: `1px solid ${token.warning}`,
          },
          borderRadius: 8,
          color: token.textPrimary,
        },
      },
    },

    MuiBackdrop: {
      styleOverrides: {
        root: { backgroundColor: token.scrim },
      },
    },
    // ---- Bottom navigation (primary app menu) ----
    MuiBottomNavigation: {
      styleOverrides: {
        root: { backgroundColor: token.surfaceCard },
      },
    },

    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          '&.Mui-selected': { color: token.emerald400 },
          color: token.textSecondary,
        },
      },
    },
    // ---- Actions ----
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        outlined: {
          '&:hover': {
            backgroundColor: token.accentSoft,
            borderColor: token.emerald400,
          },
          borderColor: token.borderStrong,
        },
        root: {
          '&.Mui-focusVisible': { boxShadow: token.focusRing },
          '&.MuiButton-containedPrimary:hover': { backgroundColor: '#fff' },
          '&.MuiButton-containedSecondary:hover': {
            backgroundColor: token.emerald300,
          },
          '&:hover': { boxShadow: 'none' },
          borderRadius: 8, // --radius-md: buttons/inputs are tighter than cards
          boxShadow: 'none',
          fontWeight: 600,
          letterSpacing: '0.01em',
          minHeight: 44, // --tap-min
          textTransform: 'none',
        },
        text: {
          '&:hover': { backgroundColor: token.accentSoft },
        },
      },
    },
    MuiCheckbox: { defaultProps: { color: 'secondary' } },
    // ---- Data ----
    MuiChip: {
      styleOverrides: {
        // Neutral "count" chip — colored muscle-group chips override via sx.
        filled: {
          backgroundColor: token.surfaceElevated,
          color: token.textSecondary,
        },
        outlined: { borderColor: token.divider },
        root: { fontWeight: 600 },
      },
    },

    // ---- Global element defaults (scrollbars, text selection) ----
    MuiCssBaseline: {
      styleOverrides: {
        '*::-webkit-scrollbar': { height: 10, width: 10 },
        '*::-webkit-scrollbar-thumb': {
          background: token.surfaceHover,
          borderRadius: 8,
        },
        '*::-webkit-scrollbar-track': { background: 'transparent' },
        '::selection': {
          background: token.accentSoftHover,
          color: token.textPrimary,
        },
        body: {
          scrollbarColor: `${token.surfaceHover} transparent`,
        },
      },
    },
    // … except overlays (dialogs/menus/popovers), which lift off the canvas.
    MuiDialog: {
      styleOverrides: {
        paper: {
          border: `1px solid ${token.border}`,
          borderRadius: 12,
          boxShadow: token.overlayShadow,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.125rem',
          fontWeight: 600,
          letterSpacing: '-0.01em',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&.Mui-focusVisible': { boxShadow: token.focusRing },
          '&:hover': {
            backgroundColor: token.surfaceHover,
            color: token.textPrimary,
          },
          borderRadius: 8,
          minHeight: 44,
          minWidth: 44,
          transition:
            'background-color 120ms cubic-bezier(0.4, 0, 0.2, 1), color 120ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { '&.Mui-focused': { color: token.emerald400 } },
      },
    },
    MuiLink: {
      defaultProps: { color: 'secondary' },
      styleOverrides: { root: { textDecorationColor: 'inherit' } },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&.Mui-selected': { backgroundColor: token.accentSoft },
          '&.Mui-selected:hover': { backgroundColor: token.accentSoftHover },
        },
      },
    },
    // ---- Forms ----
    MuiOutlinedInput: {
      styleOverrides: {
        input: {
          '&::placeholder': { color: token.textMuted, opacity: 1 },
        },
        root: {
          '&.Mui-focused': { boxShadow: token.focusRing },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: token.emerald500,
            borderWidth: 1,
          },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: token.border },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: token.borderStrong,
          },
          backgroundColor: token.surfaceBase,
          borderRadius: 8,
        },
      },
    },
    // ---- Surfaces ----
    // Shadowless system: everything flat with a hairline emerald border …
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${token.border}`,
          boxShadow: 'none',
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: { boxShadow: token.overlayShadow },
      },
    },
    MuiRadio: { defaultProps: { color: 'secondary' } },
    MuiSwitch: { defaultProps: { color: 'secondary' } },

    MuiTab: {
      styleOverrides: {
        root: {
          '&.Mui-selected': { color: token.textPrimary, fontWeight: 600 },
          color: token.textSecondary,
          fontWeight: 500,
          letterSpacing: '0.02em',
          minHeight: 44,
          textTransform: 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        // Weights / reps / eRM line up in columns.
        body: { fontVariantNumeric: 'tabular-nums' },
        head: {
          color: token.textSecondary,
          fontSize: '0.78rem',
          fontWeight: 600,
          letterSpacing: '0.02em',
        },
        root: { borderColor: token.divider },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&.MuiTableRow-hover:hover': { backgroundColor: token.accentSoft },
        },
      },
    },

    // ---- Navigation ----
    MuiTabs: {
      defaultProps: { indicatorColor: 'secondary', textColor: 'inherit' },
      styleOverrides: {
        indicator: {
          backgroundColor: token.emerald400,
          borderRadius: '2px 2px 0 0',
          height: 2,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        arrow: { color: token.surfaceElevated },
        tooltip: {
          backgroundColor: token.surfaceElevated,
          border: `1px solid ${token.border}`,
          borderRadius: 8,
          boxShadow: token.overlayShadow,
          color: token.textPrimary,
          fontSize: 12,
          fontWeight: 500,
        },
      },
    },
  },

  palette: {
    background: {
      default: token.surfaceBase,
      paper: token.surfaceCard,
    },
    divider: token.divider,
    error: { main: token.danger },
    info: { main: token.info },
    mode: 'dark',
    // "bright" light action button = primary (matches current app)
    primary: {
      contrastText: '#0C110E',
      dark: token.emerald600,
      light: token.emerald400,
      main: token.bright,
    },
    // emerald brand = secondary
    secondary: {
      contrastText: '#06281C',
      dark: token.emerald600,
      light: token.emerald300,
      main: token.emerald400,
    },
    text: {
      disabled: token.textMuted,
      primary: token.textPrimary,
      secondary: token.textSecondary,
    },
    warning: { main: token.warning },
  },

  shape: { borderRadius: 12 }, // --radius-lg

  typography: {
    button: { fontWeight: 600, letterSpacing: '0.01em', textTransform: 'none' },
    fontFamily:
      "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    h4: { fontWeight: 600, letterSpacing: '-0.02em' },
    h5: { fontWeight: 600, letterSpacing: '-0.02em' },
    h6: { fontWeight: 600, letterSpacing: '-0.02em' },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 500 },
  },
});

export default muiTheme;

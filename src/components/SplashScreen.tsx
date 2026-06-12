import { Box, Fade } from '@mui/material';

export const Logo = ({
  height = 96,
  width = 96,
}: {
  readonly height?: number;
  readonly width?: number;
}) => (
  <svg
    height={height}
    viewBox="0 0 512 512"
    width={width}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="512" height="512" rx="96" fill="#1a202c" />
    <g
      fill="#90cdf4"
      stroke="#90cdf4"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="20"
    >
      <rect x="80" y="216" width="48" height="80" rx="12" />
      <rect x="40" y="232" width="32" height="48" rx="10" />
      <rect x="384" y="216" width="48" height="80" rx="12" />
      <rect x="440" y="232" width="32" height="48" rx="10" />
      <rect x="128" y="240" width="256" height="32" rx="8" />
    </g>
  </svg>
);

interface SplashScreenProps {
  visible: boolean;
}

export const SplashScreen = ({ visible }: SplashScreenProps) => (
  <Fade in={visible} timeout={{ enter: 0, exit: 600 }} unmountOnExit>
    <Box
      sx={{
        alignItems: 'center',
        bgcolor: 'background.default',
        bottom: 0,
        display: 'flex',
        justifyContent: 'center',
        left: 0,
        position: 'fixed',
        right: 0,
        top: 0,
        zIndex: 9999,
      }}
    >
      <Box
        sx={{
          '@keyframes pulse': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.4 },
          },
          animation: 'pulse 1.6s ease-in-out infinite',
        }}
      >
        <Logo />
      </Box>
    </Box>
  </Fade>
);

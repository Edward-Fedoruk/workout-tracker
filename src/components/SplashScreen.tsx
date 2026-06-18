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
    <rect
      fill="#1a202c"
      height="512"
      rx="96"
      width="512"
    />
    <g
      fill="#90cdf4"
      stroke="#90cdf4"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="20"
    >
      <rect
        height="80"
        rx="12"
        width="48"
        x="80"
        y="216"
      />
      <rect
        height="48"
        rx="10"
        width="32"
        x="40"
        y="232"
      />
      <rect
        height="80"
        rx="12"
        width="48"
        x="384"
        y="216"
      />
      <rect
        height="48"
        rx="10"
        width="32"
        x="440"
        y="232"
      />
      <rect
        height="32"
        rx="8"
        width="256"
        x="128"
        y="240"
      />
    </g>
  </svg>
);

type SplashScreenProps = {
  readonly visible: boolean;
};

export const SplashScreen = ({ visible }: SplashScreenProps) => (
  <Fade
    in={visible}
    timeout={{ enter: 0, exit: 600 }}
    unmountOnExit
  >
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
        zIndex: 9_999,
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

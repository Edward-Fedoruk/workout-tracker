import { router } from './router';
import { muiTheme } from '@/muiTheme';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { RouterProvider } from 'react-router-dom';

export const App = () => (
  <ThemeProvider theme={muiTheme}>
    <CssBaseline />
    <RouterProvider router={router} />
  </ThemeProvider>
);

export default App;

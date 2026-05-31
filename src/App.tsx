import { router } from './router';
import { createTheme, ThemeProvider } from '@mui/material';
import { RouterProvider } from 'react-router-dom';

const muiTheme = createTheme();

export const App = () => (
  <ThemeProvider theme={muiTheme}>
    <RouterProvider router={router} />
  </ThemeProvider>
);

export default App;

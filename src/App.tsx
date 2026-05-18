import { WorkoutTable } from './components/WorkoutTable';
import { initDatabase } from './database';
import { Box, ChakraProvider } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

export const App = () => {
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);
  const [error, setError] = useState<null | string>(null);

  useEffect(() => {
    const run = async () => {
      try {
        await initDatabase();
        setIsDatabaseReady(true);
      } catch {
        setError('Failed to initialize the database. See console for details.');
      }
    };

    // eslint-disable-next-line promise/prefer-await-to-then -- fire-and-forget from sync useEffect callback
    run().catch(() => undefined);
  }, []);

  if (error !== null) {
    return (
      <ChakraProvider>
        <Box
          color="red.500"
          p={4}
        >
          {error}
        </Box>
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider>
      {isDatabaseReady ? <WorkoutTable /> : <Box p={4}>Loading...</Box>}
    </ChakraProvider>
  );
};

export default App;

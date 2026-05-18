import { getKV, initDatabase, type KVRow, listKV, setKV } from './database';
import {
  Box,
  Button,
  ChakraProvider,
  Code,
  Heading,
  HStack,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';

const NOTE_KEY = 'note';

export const App = () => {
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const [note, setNote] = useState('');
  const [rows, setRows] = useState<KVRow[]>([]);

  const refresh = useCallback(async () => {
    setRows(await listKV());
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        await initDatabase();
        const existing = await getKV(NOTE_KEY);
        if (existing !== null) {
          setNote(existing);
        }

        await refresh();
        setIsDatabaseReady(true);
      } catch {
        setError('Failed to initialize the database. See console for details.');
      }
    };

    // eslint-disable-next-line promise/prefer-await-to-then -- fire-and-forget from sync useEffect callback
    run().catch(() => undefined);
  }, [refresh]);

  const handleSave = useCallback(async () => {
    await setKV(NOTE_KEY, note);
    await refresh();
  }, [note, refresh]);

  if (error) {
    return (
      <Box
        color="red.500"
        p={4}
      >
        {error}
      </Box>
    );
  }

  if (!isDatabaseReady) {
    return <Box p={4}>Loading...</Box>;
  }

  return (
    <ChakraProvider>
      <Box
        margin="auto"
        maxWidth="800px"
        mt={8}
        p={4}
      >
        <VStack
          align="stretch"
          spacing={6}
        >
          <Heading>Workout Log</Heading>
          <Text>
            Local-first workout tracking. Data is stored in your browser via
            OPFS + SQLite — no account, no server.
          </Text>
          <HStack>
            <Input
              onChange={(event) => {
                setNote(event.target.value);
              }}
              placeholder="Type something..."
              value={note}
            />
            <Button
              colorScheme="blue"
              onClick={() => {
                // eslint-disable-next-line promise/prefer-await-to-then -- fire-and-forget from sync handler
                handleSave().catch(() => undefined);
              }}
            >
              Save
            </Button>
          </HStack>
          <Box>
            <Heading
              mb={2}
              size="sm"
            >
              kv table
            </Heading>
            {rows.length === 0 ? (
              <Text color="gray.500">(empty)</Text>
            ) : (
              <VStack
                align="stretch"
                spacing={1}
              >
                {rows.map((row) => (
                  <Code key={row.key}>
                    {row.key} = {row.value}
                  </Code>
                ))}
              </VStack>
            )}
          </Box>
        </VStack>
      </Box>
    </ChakraProvider>
  );
};

export default App;

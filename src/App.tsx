import { useEffect, useState, useCallback } from 'react';
import {
  ChakraProvider,
  Box,
  VStack,
  HStack,
  Heading,
  Input,
  Button,
  Text,
  Code,
} from '@chakra-ui/react';
import { initDb, setKV, getKV, listKV, type KVRow } from './db';

const NOTE_KEY = 'note';

export function App() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [rows, setRows] = useState<KVRow[]>([]);

  const refresh = useCallback(async () => {
    setRows(await listKV());
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        await initDb();
        const existing = await getKV(NOTE_KEY);
        if (existing !== null) setNote(existing);
        await refresh();
        setIsDbReady(true);
      } catch (err) {
        console.error('Database initialization failed:', err);
        setError('Failed to initialize the database. See console for details.');
      }
    };
    void run();
  }, [refresh]);

  const handleSave = useCallback(async () => {
    await setKV(NOTE_KEY, note);
    await refresh();
  }, [note, refresh]);

  if (error) {
    return <Box color="red.500" p={4}>{error}</Box>;
  }

  if (!isDbReady) {
    return <Box p={4}>Loading...</Box>;
  }

  return (
    <ChakraProvider>
      <Box maxWidth="800px" margin="auto" mt={8} p={4}>
        <VStack spacing={6} align="stretch">
          <Heading>Workout Log</Heading>
          <Text>
            Local-first workout tracking. Data is stored in your browser via
            OPFS + SQLite — no account, no server.
          </Text>
          <HStack>
            <Input
              value={note}
              onChange={(e) => { setNote(e.target.value); }}
              placeholder="Type something..."
            />
            <Button onClick={() => void handleSave()} colorScheme="blue">
              Save
            </Button>
          </HStack>
          <Box>
            <Heading size="sm" mb={2}>kv table</Heading>
            {rows.length === 0 ? (
              <Text color="gray.500">(empty)</Text>
            ) : (
              <VStack align="stretch" spacing={1}>
                {rows.map((r) => (
                  <Code key={r.key}>{r.key} = {r.value}</Code>
                ))}
              </VStack>
            )}
          </Box>
        </VStack>
      </Box>
    </ChakraProvider>
  );
}

export default App;

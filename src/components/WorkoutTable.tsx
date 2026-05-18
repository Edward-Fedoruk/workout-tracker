import {
  deleteWorkout,
  getWorkoutById,
  listWorkouts,
  type WorkoutTableRow,
  type WorkoutWithSets,
} from '../database';
import { WorkoutForm } from './WorkoutForm';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useRef, useState } from 'react';

const SET_DISPLAY_COLS: Array<{
  hideBelow?: string;
  key: keyof WorkoutTableRow;
  label: string;
}> = [
  { key: 'Set1_weight', label: 'S1 kg' },
  { key: 'Set1_reps', label: 'S1 reps' },
  { hideBelow: 'md', key: 'Set2_weight', label: 'S2 kg' },
  { hideBelow: 'md', key: 'Set2_reps', label: 'S2 reps' },
  { hideBelow: 'md', key: 'Set3_weight', label: 'S3 kg' },
  { hideBelow: 'md', key: 'Set3_reps', label: 'S3 reps' },
  { hideBelow: 'md', key: 'Set4_weight', label: 'S4 kg' },
  { hideBelow: 'md', key: 'Set4_reps', label: 'S4 reps' },
  { hideBelow: 'md', key: 'Set5_weight', label: 'S5 kg' },
  { hideBelow: 'md', key: 'Set5_reps', label: 'S5 reps' },
];

export const WorkoutTable = () => {
  const [workouts, setWorkouts] = useState<WorkoutTableRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingWorkout, setEditingWorkout] = useState<null | WorkoutWithSets>(
    null,
  );
  const [showForm, setShowForm] = useState(false);
  const [loadError, setLoadError] = useState<null | string>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<null | number>(null);
  const cancelDeleteRef = useRef<HTMLButtonElement>(null);

  const loadWorkouts = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const rows = await listWorkouts();
      setWorkouts(rows);
    } catch {
      setLoadError('Failed to load workouts. Please reload the page.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const rows = await listWorkouts();
        setWorkouts(rows);
      } catch {
        setLoadError('Failed to load workouts. Please reload the page.');
      } finally {
        setIsLoading(false);
      }
    };

    // eslint-disable-next-line promise/prefer-await-to-then -- fire-and-forget from sync useEffect callback
    run().catch(() => undefined);
  }, []);

  const openNewForm = useCallback(() => {
    setEditingWorkout(null);
    setShowForm(true);
  }, []);

  const openEditForm = useCallback(async (id: number) => {
    const workout = await getWorkoutById(id);
    setEditingWorkout(workout);
    setShowForm(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (confirmDeleteId === null) {
      return;
    }

    const idToDelete = confirmDeleteId;
    setConfirmDeleteId(null);

    try {
      await deleteWorkout(idToDelete);
      await loadWorkouts();
    } catch {
      setLoadError('Failed to delete workout. Please try again.');
    }
  }, [confirmDeleteId, loadWorkouts]);

  const handleFormSave = useCallback(() => {
    setShowForm(false);
    setEditingWorkout(null);
    // eslint-disable-next-line promise/prefer-await-to-then -- fire-and-forget from sync callback
    loadWorkouts().catch(() => undefined);
  }, [loadWorkouts]);

  const handleFormCancel = useCallback(() => {
    setShowForm(false);
    setEditingWorkout(null);
  }, []);

  return (
    <Box
      margin="auto"
      maxWidth="1200px"
      p={4}
    >
      <VStack
        align="stretch"
        spacing={4}
      >
        <HStack justify="space-between">
          <Text
            as="h1"
            fontSize="2xl"
            fontWeight="bold"
          >
            Workout Log
          </Text>
          <Button
            colorScheme="blue"
            minHeight="44px"
            minWidth="44px"
            onClick={openNewForm}
          >
            Add Workout
          </Button>
        </HStack>

        {loadError !== null && <Text color="red.500">{loadError}</Text>}

        {isLoading ? (
          <Box
            py={8}
            textAlign="center"
          >
            <Spinner />
          </Box>
        ) : workouts.length === 0 ? (
          <Box
            color="gray.500"
            py={8}
            textAlign="center"
          >
            No workouts yet. Add your first one!
          </Box>
        ) : (
          <TableContainer>
            <Table
              size="sm"
              variant="simple"
            >
              <Thead>
                <Tr>
                  <Th>Date</Th>
                  <Th>Exercise</Th>
                  {SET_DISPLAY_COLS.map((col) => (
                    <Th
                      key={col.key}
                      {...(col.hideBelow
                        ? { display: { base: 'none', md: 'table-cell' } }
                        : {})}
                    >
                      {col.label}
                    </Th>
                  ))}
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {workouts.map((workout) => (
                  <Tr key={workout.id}>
                    <Td whiteSpace="nowrap">{workout.workout_date}</Td>
                    <Td>{workout.exercise_name}</Td>
                    {SET_DISPLAY_COLS.map((col) => (
                      <Td
                        isNumeric
                        key={col.key}
                        {...(col.hideBelow
                          ? { display: { base: 'none', md: 'table-cell' } }
                          : {})}
                      >
                        {workout[col.key] ?? '—'}
                      </Td>
                    ))}
                    <Td>
                      <HStack spacing={1}>
                        <Button
                          minHeight="44px"
                          minWidth="44px"
                          onClick={() => {
                            // eslint-disable-next-line promise/prefer-await-to-then -- fire-and-forget from sync handler
                            openEditForm(workout.id).catch(() => undefined);
                          }}
                          size="sm"
                          variant="outline"
                        >
                          Edit
                        </Button>
                        <Button
                          colorScheme="red"
                          minHeight="44px"
                          minWidth="44px"
                          onClick={() => {
                            setConfirmDeleteId(workout.id);
                          }}
                          size="sm"
                          variant="outline"
                        >
                          Delete
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </VStack>

      <Modal
        isOpen={showForm}
        onClose={handleFormCancel}
        size="lg"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingWorkout ? 'Edit Workout' : 'Add Workout'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <WorkoutForm
              onCancel={handleFormCancel}
              onSave={handleFormSave}
              {...(editingWorkout ? { initialData: editingWorkout } : {})}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={confirmDeleteId !== null}
        leastDestructiveRef={cancelDeleteRef}
        onClose={() => {
          setConfirmDeleteId(null);
        }}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Delete Workout</AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete this workout? This cannot be
              undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button
                onClick={() => {
                  setConfirmDeleteId(null);
                }}
                ref={cancelDeleteRef}
              >
                Cancel
              </Button>
              <Button
                colorScheme="red"
                ml={3}
                onClick={() => {
                  // eslint-disable-next-line promise/prefer-await-to-then -- fire-and-forget from sync handler
                  handleDeleteConfirm().catch(() => undefined);
                }}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

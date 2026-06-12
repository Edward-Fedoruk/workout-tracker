import { WorkoutRowActions } from '@/routes/workouts/WorkoutRowActions';
import { formatSetCell } from '@/routes/workouts/WorkoutSetRow';
import { type WorkoutDateGroup } from '@/utils/dateGroup';
import {
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Fragment } from 'react';

type Props = {
  readonly groups: WorkoutDateGroup[];
  readonly onDelete: (id: number) => void;
  readonly onEdit: (id: number) => void;
};

const SET_NUMBERS = [1, 2, 3, 4, 5] as const;
const TOTAL_COLUMNS = 1 + SET_NUMBERS.length + 1;

export const GroupedWorkoutTable = ({ groups, onDelete, onEdit }: Props) => (
  <TableContainer>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Exercise</TableCell>
          {SET_NUMBERS.map((setNumber) => (
            <TableCell key={setNumber}>Set {setNumber}</TableCell>
          ))}
          <TableCell />
        </TableRow>
      </TableHead>
      <TableBody>
        {groups.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={TOTAL_COLUMNS}
              sx={{ py: 4, textAlign: 'center' }}
            >
              <Typography color="text.secondary">No workouts yet</Typography>
            </TableCell>
          </TableRow>
        ) : (
          groups.map((group) => (
            <Fragment key={group.isoDate}>
              <TableRow>
                <TableCell
                  colSpan={TOTAL_COLUMNS}
                  sx={{ py: 0.5 }}
                >
                  <Divider>
                    <Typography
                      color="secondary"
                      variant="overline"
                    >
                      {group.label}
                    </Typography>
                  </Divider>
                </TableCell>
              </TableRow>
              {group.rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.exercise_name}</TableCell>
                  {SET_NUMBERS.map((setNumber) => (
                    <TableCell key={setNumber}>
                      {formatSetCell(
                        row[`Set${setNumber}_weight`],
                        row[`Set${setNumber}_reps`],
                      )}
                    </TableCell>
                  ))}
                  <TableCell>
                    <WorkoutRowActions
                      onDelete={() => onDelete(row.id)}
                      onEdit={() => onEdit(row.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </Fragment>
          ))
        )}
      </TableBody>
    </Table>
  </TableContainer>
);

import { formatSetCell } from '@/routes/workouts/WorkoutSetRow';
import { type WorkoutDateGroup } from '@/utils/dateGroup';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import Looks3Icon from '@mui/icons-material/Looks3';
import Looks4Icon from '@mui/icons-material/Looks4';
import Looks5Icon from '@mui/icons-material/Looks5';
import LooksOneIcon from '@mui/icons-material/LooksOne';
import LooksTwoIcon from '@mui/icons-material/LooksTwo';
import {
  Avatar,
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

type FirstColumn = 'avatar' | 'name' | 'none';

type Props = {
  readonly firstColumn: FirstColumn;
  readonly groups: WorkoutDateGroup[];
  readonly onEdit?: (id: number) => void;
};

const SET_NUMBERS = [1, 2, 3, 4, 5] as const;

type SetNumber = 1 | 2 | 3 | 4 | 5;

const SET_ICON_MAP: Record<SetNumber, typeof LooksOneIcon> = {
  '1': LooksOneIcon,
  '2': LooksTwoIcon,
  '3': Looks3Icon,
  '4': Looks4Icon,
  '5': Looks5Icon,
};

export const GroupedWorkoutTable = ({ firstColumn, groups, onEdit }: Props) => {
  const totalColumns = (firstColumn === 'none' ? 0 : 1) + SET_NUMBERS.length;

  return (
    <TableContainer sx={{ height: '100%' }}>
      <Table
        size="small"
        stickyHeader
      >
        <TableHead>
          <TableRow>
            {firstColumn === 'avatar' && <TableCell sx={{ width: 64 }} />}
            {firstColumn === 'name' && <TableCell sx={{ width: 120 }} />}
            {SET_NUMBERS.map((setNumber) => {
              const SetIcon = SET_ICON_MAP[setNumber];
              return (
                <TableCell key={setNumber}>
                  <SetIcon
                    color="secondary"
                    fontSize="small"
                  />
                </TableCell>
              );
            })}
          </TableRow>
        </TableHead>
        <TableBody>
          {groups.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={totalColumns}
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
                    colSpan={totalColumns}
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
                  <TableRow
                    hover={onEdit !== undefined}
                    key={row.id}
                    {...(onEdit && {
                      onClick: () => onEdit(row.id),
                      sx: { cursor: 'pointer' },
                    })}
                  >
                    {firstColumn === 'avatar' && (
                      <TableCell sx={{ px: '4px', width: 64 }}>
                        <Avatar
                          alt={row.exercise_name}
                          src={
                            row.exercise_image_filename
                              ? `${import.meta.env.BASE_URL}exercises/${row.exercise_image_filename}`
                              : undefined
                          }
                          sx={{ height: 56, width: 56 }}
                        >
                          <FitnessCenterIcon fontSize="large" />
                        </Avatar>
                      </TableCell>
                    )}
                    {firstColumn === 'name' && (
                      <TableCell sx={{ px: '4px', width: 120 }}>
                        <Typography
                          sx={{
                            fontSize: '12px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {row.exercise_name}
                        </Typography>
                      </TableCell>
                    )}
                    {SET_NUMBERS.map((setNumber) => (
                      <TableCell
                        key={setNumber}
                        sx={{ fontSize: '12px', px: '10px' }}
                      >
                        {formatSetCell(
                          row[`Set${setNumber}_weight`],
                          row[`Set${setNumber}_reps`],
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </Fragment>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

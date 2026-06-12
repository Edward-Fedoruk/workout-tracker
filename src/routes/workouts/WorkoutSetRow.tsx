import { type WorkoutTableRow } from '@/database';
import Looks3Icon from '@mui/icons-material/Looks3';
import Looks4Icon from '@mui/icons-material/Looks4';
import Looks5Icon from '@mui/icons-material/Looks5';
import LooksOneIcon from '@mui/icons-material/LooksOne';
import LooksTwoIcon from '@mui/icons-material/LooksTwo';
import { Box } from '@mui/material';
import { type MRT_ColumnDef } from 'material-react-table';
import { useMemo } from 'react';

type SetNumber = 1 | 2 | 3 | 4 | 5;

const SET_NUMBERS = [1, 2, 3, 4, 5] as const;

const SET_ICONS = [
  null,
  LooksOneIcon,
  LooksTwoIcon,
  Looks3Icon,
  Looks4Icon,
  Looks5Icon,
] as const;

const formatERM = (value: null | number): string => {
  if (value === null) {
    return '—';
  }

  return value.toFixed(1);
};

export const formatSetCell = (
  weight: null | number,
  reps: null | number,
): string => {
  if (weight !== null && reps !== null) {
    return `${weight}×${reps}`;
  }

  if (weight !== null) {
    return `${weight}`;
  }

  if (reps !== null) {
    return `×${reps}`;
  }

  return '—';
};

const buildSetColumns = (
  setNumber: SetNumber,
): Array<MRT_ColumnDef<WorkoutTableRow>> => {
  const weightKey = `Set${setNumber}_weight` as const;
  const repsKey = `Set${setNumber}_reps` as const;
  const ermKey = `Set${setNumber}_erm` as const;
  const SetIcon = SET_ICONS[setNumber];
  return [
    {
      accessorFn: (row) => formatSetCell(row[weightKey], row[repsKey]),
      Header: (
        <SetIcon
          color="secondary"
          fontSize="medium"
        />
      ),
      header: `Set ${setNumber}`,
      id: `Set${setNumber}`,
      size: 110,
    },
    {
      accessorKey: ermKey,
      Cell: ({ cell }) => formatERM(cell.getValue<null | number>()),
      Header: (
        <Box sx={{ alignItems: 'center', display: 'flex', gap: 0.5 }}>
          <SetIcon
            color="secondary"
            fontSize="small"
          />
          eRM
        </Box>
      ),
      header: `Set ${setNumber} eRM`,
      id: `Set${setNumber}_erm`,
      size: 90,
    },
  ];
};

export const useSetColumns = (): Array<MRT_ColumnDef<WorkoutTableRow>> =>
  useMemo(
    () => SET_NUMBERS.flatMap((setNumber) => buildSetColumns(setNumber)),
    [],
  );

export const HIDDEN_SET_COLUMNS: Record<string, boolean> = {
  Set1_erm: false,
  Set2_erm: false,
  Set3_erm: false,
  Set4_erm: false,
  Set5_erm: false,
};

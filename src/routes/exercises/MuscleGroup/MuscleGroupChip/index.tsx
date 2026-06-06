import { contrastText } from '@/routes/exercises/MuscleGroup/muscleGroupColors';
import { Chip, type ChipProps } from '@mui/material';

export type MuscleGroupChipProps = {
  readonly color: string;
  readonly label: string;
  readonly size?: ChipProps['size'];
};

/**
 * MuscleGroupChip — a Chip painted with a muscle group's categorical color.
 * The palette colors don't map to the MUI theme palette, so this wrapper carries
 * the one custom-styled rule the theme can't express: a hex fill with
 * auto-contrast (black/white) text for readability at any color.
 */
export const MuscleGroupChip = ({
  color,
  label,
  size = 'small',
}: MuscleGroupChipProps) => (
  <Chip
    label={label}
    size={size}
    sx={{
      backgroundColor: color,
      border: 'none',
      color: contrastText(color),
    }}
  />
);

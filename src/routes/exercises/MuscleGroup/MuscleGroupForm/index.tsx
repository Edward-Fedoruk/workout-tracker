import { type FormValues, resolver } from './schema';
import { DialogActionButtons, FormDialog } from '@/components';
import {
  DEFAULT_MUSCLE_GROUP_COLOR,
  MUSCLE_GROUP_PALETTE,
} from '@/routes/exercises/MuscleGroup/muscleGroupColors';
import CheckIcon from '@mui/icons-material/Check';
import { Box, TextField, Tooltip, Typography } from '@mui/material';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

export type MuscleGroupFormProps = {
  readonly initialValues?: FormValues | undefined;
  readonly mode: 'create' | 'edit';
  readonly onCancel: () => void;
  readonly onSave: (values: FormValues) => Promise<null | string>;
  readonly open: boolean;
};

const EMPTY_VALUES: FormValues = {
  color: DEFAULT_MUSCLE_GROUP_COLOR,
  name: '',
};

export const MuscleGroupForm = ({
  initialValues,
  mode,
  onCancel,
  onSave,
  open,
}: MuscleGroupFormProps) => {
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<FormValues>({
    defaultValues: EMPTY_VALUES,
    resolver,
  });

  useEffect(() => {
    if (open) {
      reset(initialValues ?? EMPTY_VALUES);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset form only when the dialog opens
  }, [open]);

  const submit = handleSubmit(async (values) => {
    const duplicateMessage = await onSave(values);
    if (duplicateMessage) {
      setError('name', { message: duplicateMessage });
    }
  });

  return (
    <FormDialog
      actions={
        <DialogActionButtons
          confirmLabel={mode === 'create' ? 'Add' : 'Save'}
          onCancel={onCancel}
          onConfirm={() => {
            submit().catch(() => undefined);
          }}
        />
      }
      onClose={onCancel}
      open={open}
      title={mode === 'create' ? 'Add Muscle Group' : 'Rename Muscle Group'}
    >
      <TextField
        autoFocus
        error={Boolean(errors.name)}
        fullWidth
        helperText={errors.name?.message ?? ''}
        label="Muscle group name"
        sx={{ mb: 3, mt: '4px' }}
        {...register('name')}
      />
      <Typography
        gutterBottom
        variant="body2"
      >
        Colour
      </Typography>
      <Controller
        control={control}
        name="color"
        render={({ field }) => (
          <Box
            sx={{
              display: 'grid',
              gap: 1,
              gridTemplateColumns: 'repeat(7, 1fr)',
            }}
          >
            {MUSCLE_GROUP_PALETTE.map((swatch) => (
              <Tooltip
                key={swatch}
                title={swatch}
              >
                <Box
                  aria-label={`Select colour ${swatch}`}
                  component="button"
                  onClick={() => field.onChange(swatch)}
                  sx={{
                    alignItems: 'center',
                    aspectRatio: '1',
                    backgroundColor: swatch,
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    outline:
                      field.value === swatch
                        ? '3px solid'
                        : '2px solid transparent',
                    outlineColor:
                      field.value === swatch ? 'text.primary' : 'transparent',
                    outlineOffset: '2px',
                    padding: 0,
                    transition: 'outline 0.1s',
                    width: '100%',
                  }}
                >
                  {field.value === swatch && (
                    <CheckIcon
                      sx={{
                        color: '#fff',
                        filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.6))',
                        fontSize: 16,
                      }}
                    />
                  )}
                </Box>
              </Tooltip>
            ))}
          </Box>
        )}
      />
    </FormDialog>
  );
};

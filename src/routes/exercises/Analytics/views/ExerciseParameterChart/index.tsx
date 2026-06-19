import { type Exercise } from '@/database';
import {
  type ParameterKey,
  type ParameterUnit,
  type TimeRange,
  useExerciseParameterChart,
} from '@/routes/exercises/Analytics/hooks/useExerciseParameterChart';
import {
  Box,
  Checkbox,
  Chip,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';

export type ExerciseParameterChartProps = {
  readonly exercises: Exercise[];
};

const UNIT_AXIS_LABEL: Record<ParameterUnit, string> = {
  erm: 'eRM (kg)',
  reps: 'reps',
  weight: 'weight (kg)',
};

export const ExerciseParameterChart = ({
  exercises,
}: ExerciseParameterChartProps) => {
  const {
    availableParameters,
    charts,
    selectedExerciseId,
    selectedParameters,
    setSelectedExerciseId,
    setTimeRange,
    timeRange,
    toggleParameter,
  } = useExerciseParameterChart(exercises);

  const labelByKey = new Map(
    availableParameters.map((item) => [item.key, item.label]),
  );

  return (
    <Box sx={{ px: 2, py: 1 }}>
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'space-between',
          mb: 1,
        }}
      >
        <Typography
          color="text.secondary"
          variant="overline"
        >
          Exercise Parameters
        </Typography>
        <ToggleButtonGroup
          exclusive
          onChange={(_, value: null | TimeRange) => {
            if (value !== null) {
              setTimeRange(value);
            }
          }}
          size="small"
          value={timeRange}
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="year">Year</ToggleButton>
          <ToggleButton value="month">Month</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 1 }}>
        <FormControl
          fullWidth
          size="small"
        >
          <InputLabel id="analytics-exercise-label">Exercise</InputLabel>
          <Select
            label="Exercise"
            labelId="analytics-exercise-label"
            onChange={(event) =>
              setSelectedExerciseId(Number(event.target.value))
            }
            value={
              selectedExerciseId === null ? '' : String(selectedExerciseId)
            }
          >
            {exercises.map((exercise) => (
              <MenuItem
                key={exercise.id}
                value={String(exercise.id)}
              >
                {exercise.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedExerciseId !== null && (
          <FormControl
            fullWidth
            size="small"
          >
            <InputLabel id="analytics-parameters-label">Parameters</InputLabel>
            <Select
              input={<OutlinedInput label="Parameters" />}
              labelId="analytics-parameters-label"
              multiple
              onChange={() => undefined}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as ParameterKey[]).map((key) => (
                    <Chip
                      key={key}
                      label={labelByKey.get(key) ?? key}
                      size="small"
                    />
                  ))}
                </Box>
              )}
              value={selectedParameters}
            >
              {availableParameters.length === 0 ? (
                <MenuItem disabled>No data for this exercise</MenuItem>
              ) : (
                availableParameters.map((item) => (
                  <MenuItem
                    key={item.key}
                    onClick={() => toggleParameter(item.key)}
                    value={item.key}
                  >
                    <Checkbox checked={selectedParameters.includes(item.key)} />
                    <ListItemText primary={item.label} />
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        )}
      </Box>

      {charts.length === 0 ? (
        <Typography
          color="text.secondary"
          sx={{ py: 3, textAlign: 'center' }}
          variant="body2"
        >
          {selectedExerciseId === null
            ? 'Select an exercise to chart its parameters.'
            : selectedParameters.length === 0
              ? 'Select one or more parameters to plot.'
              : 'No data for the selected period.'}
        </Typography>
      ) : (
        charts.map((chart) => (
          <LineChart
            height={240}
            key={chart.unit}
            series={chart.series.map((series) => ({
              ...series,
              connectNulls: false,
              showMark: true,
            }))}
            sx={{ width: '100%' }}
            xAxis={[
              {
                data: chart.xDates,
                scaleType: 'band',
                tickLabelStyle: { fontSize: 10 },
              },
            ]}
            yAxis={[{ label: UNIT_AXIS_LABEL[chart.unit] }]}
          />
        ))
      )}
    </Box>
  );
};

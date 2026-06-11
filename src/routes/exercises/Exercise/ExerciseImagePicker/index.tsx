import catalogData from '@/assets/exercise-catalog.json';
import CloseIcon from '@mui/icons-material/Close';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SearchIcon from '@mui/icons-material/Search';
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

type CatalogEntry = {
  readonly category: string;
  readonly filename: string;
  readonly name: string;
  readonly target: string;
};

const catalog = catalogData as CatalogEntry[];

export type ExerciseImagePickerProps = {
  readonly currentFilename: null | string;
  readonly onClose: () => void;
  readonly onSelect: (filename: null | string) => void;
  readonly open: boolean;
};

export const ExerciseImagePicker = ({
  currentFilename,
  onClose,
  onSelect,
  open,
}: ExerciseImagePickerProps) => {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<null | string>(currentFilename);

  // Reset transient picker state every time the dialog opens.
  useEffect(() => {
    if (open) {
      /* eslint-disable react-hooks/set-state-in-effect -- intentional: reset picker state when the dialog opens */
      setSelected(currentFilename);
      setSearch('');
      setQuery('');
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [currentFilename, open]);

  // Debounce the search input by 200ms so typing stays responsive.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim().toLowerCase());
    }, 200);
    return () => {
      clearTimeout(timer);
    };
  }, [search]);

  const filtered = useMemo(() => {
    if (!query) {
      return catalog;
    }

    return catalog.filter(
      (entry) =>
        entry.name.toLowerCase().includes(query) ||
        entry.target.toLowerCase().includes(query) ||
        entry.category.toLowerCase().includes(query),
    );
  }, [query]);

  const base = import.meta.env.BASE_URL;

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      onClose={onClose}
      open={open}
    >
      <DialogTitle
        sx={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'space-between',
          pr: 1,
        }}
      >
        Select exercise image
        <IconButton
          aria-label="Close"
          onClick={onClose}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        dividers
        sx={{ maxHeight: '80vh' }}
      >
        <TextField
          autoFocus
          fullWidth
          onChange={(event) => {
            setSearch(event.target.value);
          }}
          placeholder="Search by name, muscle group…"
          size="small"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          value={search}
        />
        <Typography
          color="text.secondary"
          sx={{ display: 'block', mt: 1 }}
          variant="caption"
        >
          Showing {filtered.length} of {catalog.length}
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gap: 1,
            gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
            mt: 1,
          }}
        >
          {filtered.map((entry) => {
            const isSelected = entry.filename === selected;
            return (
              <Box
                component="button"
                key={entry.filename}
                onClick={() => {
                  setSelected(entry.filename);
                }}
                sx={{
                  alignItems: 'center',
                  background: 'none',
                  border: '2px solid',
                  borderColor: isSelected ? 'primary.main' : 'transparent',
                  borderRadius: 2,
                  color: 'text.primary',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                  padding: 0.5,
                }}
                type="button"
              >
                <Avatar
                  alt={entry.name}
                  slotProps={{ img: { loading: 'lazy' } }}
                  src={`${base}exercises/${entry.filename}`}
                  sx={{ height: 72, width: 72 }}
                >
                  <FitnessCenterIcon />
                </Avatar>
                <Typography
                  sx={{
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textAlign: 'center',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  variant="caption"
                >
                  {entry.name}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </DialogContent>
      <DialogActions>
        {currentFilename ? (
          <Button
            color="error"
            onClick={() => {
              onSelect(null);
            }}
            sx={{ mr: 'auto' }}
          >
            Clear
          </Button>
        ) : null}
        <Button onClick={onClose}>Cancel</Button>
        <Button
          disabled={!selected}
          onClick={() => {
            if (selected) {
              onSelect(selected);
            }
          }}
          variant="contained"
        >
          Select
        </Button>
      </DialogActions>
    </Dialog>
  );
};

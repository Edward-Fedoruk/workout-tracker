import { exportDatabaseBytes, replaceDatabaseAndReload } from '../database';
import { ConfirmImportDialog } from './ConfirmImportDialog';
import {
  Download as DownloadIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { Alert, Button, Snackbar, Stack } from '@mui/material';
import { useRef, useState } from 'react';

export const WorkoutDataActions = () => {
  const [errorMessage, setErrorMessage] = useState<null | string>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fatalError, setFatalError] = useState<null | string>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCloseError = () => {
    setErrorMessage(null);
  };

  const handleCloseFatalError = () => {
    setFatalError(null);
    setSelectedFile(null);
    resetFileInput();
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const bytes = await exportDatabaseBytes();
      const blob = new Blob([bytes], { type: 'application/vnd.sqlite3' });
      const url = URL.createObjectURL(blob);
      const today = new Date().toISOString().slice(0, 10);
      const filename = `workout-log-${today}.sqlite3`;

      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 0);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Export failed. Please try again.',
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) {
      return;
    }

    setSelectedFile(file);
    setShowConfirmDialog(true);
  };

  const handleConfirmImport = async () => {
    if (!selectedFile) {
      return;
    }

    try {
      setIsImporting(true);
      setShowConfirmDialog(false);
      const fileBuffer = await selectedFile.arrayBuffer();
      const bytes = new Uint8Array(fileBuffer);
      await replaceDatabaseAndReload(bytes);
    } catch {
      setFatalError(
        'The previous database may have been removed but the new one failed to load. ' +
          'Please try importing a different backup file.',
      );
    } finally {
      setIsImporting(false);
      resetFileInput();
    }
  };

  const handleRetryImport = () => {
    setFatalError(null);
    setSelectedFile(null);
    handleImportClick();
  };

  return (
    <>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: 'center',
          minHeight: '44px',
          minWidth: '44px',
        }}
      >
        {fatalError && (
          <Alert
            onClose={handleCloseFatalError}
            severity="error"
            sx={{ flex: 1 }}
          >
            {fatalError}
            <Button
              onClick={handleRetryImport}
              size="small"
              sx={{ ml: 1 }}
            >
              Retry Import
            </Button>
          </Alert>
        )}
        {!fatalError && (
          <>
            <Button
              disabled={isExporting || isImporting}
              onClick={handleExport}
              size="small"
              startIcon={<DownloadIcon />}
              variant="outlined"
            >
              Export
            </Button>
            <Button
              disabled={isExporting || isImporting}
              onClick={handleImportClick}
              size="small"
              startIcon={<UploadIcon />}
              variant="outlined"
            >
              Import
            </Button>
            <input
              accept=".sqlite3,application/vnd.sqlite3,application/octet-stream"
              onChange={handleFileChange}
              ref={fileInputRef}
              style={{ display: 'none' }}
              type="file"
            />
          </>
        )}
      </Stack>

      <ConfirmImportDialog
        filename={selectedFile?.name || ''}
        onCancel={() => {
          setShowConfirmDialog(false);
          resetFileInput();
          setSelectedFile(null);
        }}
        onConfirm={handleConfirmImport}
        open={showConfirmDialog}
      />

      <Snackbar
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
        autoHideDuration={6_000}
        onClose={handleCloseError}
        open={Boolean(errorMessage)}
      >
        <Alert
          onClose={handleCloseError}
          severity="error"
          sx={{ width: '100%' }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

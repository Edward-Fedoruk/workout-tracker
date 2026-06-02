import { ConfirmImportDialog } from './ConfirmImportDialog';
import { type UseDatabaseActionsReturn } from './hooks/useDatabaseActions';
import {
  Download as DownloadIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { Alert, Button, Snackbar, Stack } from '@mui/material';

export type DatabaseActionsProps = UseDatabaseActionsReturn;

export const DatabaseActions = ({
  confirmDialog,
  errorMessage,
  fatalError,
  fileInputRef,
  handleCancelImport,
  handleCloseError,
  handleCloseFatalError,
  handleConfirmImport,
  handleExport,
  handleFileChange,
  handleImportClick,
  handleRetryImport,
  isExporting,
  isImporting,
  selectedFile,
}: DatabaseActionsProps) => (
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
            onClick={() => {
              handleExport().catch(() => undefined);
            }}
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
      onCancel={handleCancelImport}
      onConfirm={() => {
        handleConfirmImport().catch(() => undefined);
      }}
      open={confirmDialog.isOpen}
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

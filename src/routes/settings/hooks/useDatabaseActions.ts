import { exportDatabaseBytes, replaceDatabaseAndReload } from '@/database';
import { useToggle } from '@/hooks/useToggle';
import { type ChangeEvent, useRef, useState } from 'react';

export type UseDatabaseActionsReturn = ReturnType<typeof useDatabaseActions>;

export const useDatabaseActions = () => {
  const [errorMessage, setErrorMessage] = useState<null | string>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fatalError, setFatalError] = useState<null | string>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const confirmDialog = useToggle();

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

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) {
      return;
    }

    setSelectedFile(file);
    confirmDialog.onOpen();
  };

  const handleConfirmImport = async () => {
    if (!selectedFile) {
      return;
    }

    try {
      setIsImporting(true);
      confirmDialog.onClose();
      const fileBuffer = await selectedFile.arrayBuffer();
      const bytes = new Uint8Array(fileBuffer);
      await replaceDatabaseAndReload(bytes);
    } catch (e){
      document.writeln(e as any);
      setFatalError(
        'The previous database may have been removed but the new one failed to load. ' +
          'Please try importing a different backup file.',
      );
    } finally {
      setIsImporting(false);
      resetFileInput();
    }
  };

  const handleCancelImport = () => {
    confirmDialog.onClose();
    resetFileInput();
    setSelectedFile(null);
  };

  const handleRetryImport = () => {
    setFatalError(null);
    setSelectedFile(null);
    handleImportClick();
  };

  return {
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
  };
};

import { getBodyWeight, setBodyWeight } from '../../../database';
import { type FormValues } from '../BodyWeightForm.schema';
import { useState } from 'react';

export type Feedback = {
  message: string;
  severity: 'error' | 'success';
};

export type UseBodyWeightReturn = ReturnType<typeof useBodyWeight>;

export const useBodyWeight = () => {
  const [value, setValue] = useState<null | number>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const refresh = async () => {
    try {
      const stored = await getBodyWeight();
      setValue(stored);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFeedback = () => {
    setFeedback(null);
  };

  const handleSave = async (values: FormValues) => {
    setFeedback(null);
    setIsSaving(true);
    try {
      await setBodyWeight(values.bodyWeight);
      setValue(values.bodyWeight);
      setFeedback({ message: 'Body weight saved', severity: 'success' });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save body weight';
      setFeedback({ message, severity: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    clearFeedback,
    feedback,
    handleSave,
    isLoading,
    isSaving,
    refresh,
    value,
  };
};

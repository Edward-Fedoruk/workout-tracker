import { type FormValues } from '@/routes/settings/BodyWeightForm.schema';
import {
  useGetBodyWeightQuery,
  useSetBodyWeightMutation,
} from '@/store/entities/settings';
import { useState } from 'react';

export type Feedback = {
  message: string;
  severity: 'error' | 'success';
};

export type UseBodyWeightReturn = ReturnType<typeof useBodyWeight>;

export const useBodyWeight = () => {
  const { data, isLoading } = useGetBodyWeightQuery();
  const [setBodyWeight, { isLoading: isSaving }] = useSetBodyWeightMutation();
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const value = data ?? null;

  // Cache invalidation keeps the value fresh; kept as a resolved no-op so the
  // view's mount-time call stays valid (HR-2).
  const refresh = async (): Promise<void> => undefined;

  const clearFeedback = () => {
    setFeedback(null);
  };

  const handleSave = async (values: FormValues) => {
    setFeedback(null);
    try {
      await setBodyWeight(values.bodyWeight).unwrap();
      setFeedback({ message: 'Body weight saved', severity: 'success' });
    } catch (error) {
      const message =
        typeof error === 'string'
          ? error
          : error instanceof Error
            ? error.message
            : 'Failed to save body weight';
      setFeedback({ message, severity: 'error' });
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

import { ConfirmDialog } from '../../components';

type Props = {
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
  readonly open: boolean;
};

export const DeleteWorkoutDialog = ({ onCancel, onConfirm, open }: Props) => (
  <ConfirmDialog
    confirmColor="error"
    confirmLabel="Delete"
    onCancel={onCancel}
    onConfirm={onConfirm}
    open={open}
    title="Delete Workout"
  >
    Are you sure you want to delete this workout? This cannot be undone.
  </ConfirmDialog>
);

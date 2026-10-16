import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>Annuler</Button>
          <Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      <div className="flex gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-risk-soft text-risk"><AlertTriangle size={18} aria-hidden /></span>
        <p className="text-sm leading-relaxed text-ink-2">{message}</p>
      </div>
    </Modal>
  );
}

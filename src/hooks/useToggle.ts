import { useState } from 'react';

export const useToggle = (initial = false) => {
  const [isOpen, setIsOpen] = useState(initial);
  return {
    isOpen,
    onClose: () => setIsOpen(false),
    onOpen: () => setIsOpen(true),
    onToggle: () => setIsOpen((previous) => !previous),
  };
};

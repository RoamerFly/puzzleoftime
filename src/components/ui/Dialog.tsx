import type { ReactNode } from 'react';
import styles from './Dialog.module.css';

interface DialogProps {
  children: ReactNode;
  onClose?: () => void;
  visible?: boolean;
  className?: string;
}

export function Dialog({ children, onClose, visible = true, className = '' }: DialogProps) {
  if (!visible) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.dialog} ${className}`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

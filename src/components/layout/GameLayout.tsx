import type { ReactNode } from 'react';
import { ProgressBar } from '../ui/ProgressBar';
import styles from './GameLayout.module.css';

interface GameLayoutProps {
  children: ReactNode;
  chapterOrder: number;
  totalChapters?: number;
  showProgress?: boolean;
}

export function GameLayout({
  children,
  chapterOrder,
  totalChapters = 3,
  showProgress = true,
}: GameLayoutProps) {
  return (
    <div className={styles.container}>
      {showProgress && (
        <header className={styles.header}>
          <ProgressBar
            current={chapterOrder}
            total={totalChapters}
            label="体验进度"
          />
        </header>
      )}
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}

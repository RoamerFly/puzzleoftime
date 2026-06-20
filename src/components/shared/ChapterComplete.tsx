import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import styles from './ChapterComplete.module.css';

interface ChapterCompleteProps {
  chapterOrder: number;
  title: string;
  message?: string;
  nextLabel?: string;
  onNext: () => void;
  onBackToMenu?: () => void;
  onEpilogue?: () => void;
}

export function ChapterComplete({
  chapterOrder,
  title,
  message,
  nextLabel,
  onNext,
  onBackToMenu,
  onEpilogue,
}: ChapterCompleteProps) {
  return (
    <Dialog visible>
      <div className={styles.content}>
        <span className={styles.icon}>✨</span>
        <h3 className={styles.title}>角色{chapterOrder} · 完成</h3>
        <p className={styles.chapterName}>{title}</p>
        {message && <p className={styles.message}>{message}</p>}
        <div className={styles.actions}>
          <Button variant="primary" size="large" onClick={onNext}>
            {nextLabel ?? '继续前行'}
          </Button>
          {onEpilogue && (
            <Button variant="secondary" size="large" onClick={onEpilogue}>
              📊 进入终章
            </Button>
          )}
          {onBackToMenu && (
            <Button variant="ghost" onClick={onBackToMenu}>
              返回主菜单
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}

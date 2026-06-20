import { useEffect } from 'react';
import { useTypewriter } from '../../hooks/useTypewriter';
import styles from './NarrativeText.module.css';

interface NarrativeTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  onClick?: () => void;
  className?: string;
  /** 禁用点击跳过和点击进退 */
  disableClick?: boolean;
}

export function NarrativeText({
  text,
  speed = 50,
  onComplete,
  onClick,
  className = '',
  disableClick = false,
}: NarrativeTextProps) {
  const { displayText, isComplete, skip } = useTypewriter(text, speed);

  const handleClick = () => {
    if (disableClick) return;
    if (!isComplete) {
      skip();
    } else {
      onClick?.();
    }
  };

  // 打字完成时通知（useEffect 确保状态更新被 React 正确处理）
  useEffect(() => {
    if (isComplete && onComplete) {
      onComplete();
    }
  }, [isComplete, onComplete]);

  return (
    <div
      className={`${styles.container} ${className}`}
      onClick={handleClick}
      role={disableClick ? undefined : 'button'}
      tabIndex={disableClick ? -1 : 0}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !disableClick) handleClick(); }}
      style={disableClick ? { cursor: 'default' } : undefined}
    >
      <p className={styles.text}>
        {displayText}
        {!isComplete && <span className={styles.cursor}>|</span>}
      </p>
      {!isComplete && !disableClick && (
        <span className={styles.hint}>点击跳过</span>
      )}
    </div>
  );
}

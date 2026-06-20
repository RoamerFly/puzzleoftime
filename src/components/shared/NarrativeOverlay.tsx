import { useState, useCallback, useEffect } from 'react';
import { NarrativeText } from '../ui/NarrativeText';
import styles from './NarrativeOverlay.module.css';

interface NarrativeOverlayProps {
  texts: string[];
  onComplete: () => void;
  speed?: number;
  /** 合并为单段文字，打字完成后才显示确认按钮 */
  singlePage?: boolean;
}

/**
 * 旁白遮罩层：依次展示多段旁白文字，全部展示完毕后回调
 * singlePage 模式：合并所有文字为一段，打字完成后显示"开始"按钮
 */
export function NarrativeOverlay({ texts, onComplete, speed = 50, singlePage = false }: NarrativeOverlayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typingDone, setTypingDone] = useState(false);

  // 稳定 onComplete 引用（避免 useEffect 无限重触发）
  const handleTypingComplete = useCallback(() => setTypingDone(true), []);

  // singlePage 模式：合并所有文字（单换行，紧凑）
  const fullText = singlePage ? texts.join('\n') : '';
  const textToShow = singlePage ? fullText : texts[currentIndex];

  // 用户点击切换旁白/完成
  const handleClick = useCallback(() => {
    if (singlePage) {
      onComplete();
      return;
    }
    if (currentIndex < texts.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  }, [singlePage, currentIndex, texts.length, onComplete]);

  // 键盘确认（Enter / Space）
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (singlePage && !typingDone) return; // 打字未完成不响应
        handleClick();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleClick, singlePage, typingDone]);

  if (!singlePage && currentIndex >= texts.length) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <NarrativeText
          key={singlePage ? 'single' : currentIndex}
          text={textToShow}
          speed={singlePage ? 20 : speed}
          onClick={singlePage ? undefined : handleClick}
          onComplete={singlePage ? handleTypingComplete : undefined}
        />
        {/* singlePage: 打字完成后才显示按钮 */}
        {(!singlePage || typingDone) && (
          <div className={styles.confirmRow}>
            <button
              className={styles.confirmBtn}
              onClick={handleClick}
              autoFocus
            >
              {singlePage ? '开始' : currentIndex < texts.length - 1 ? '继续' : '开始'}
            </button>
            <span className={styles.confirmHint}>Enter / Space</span>
          </div>
        )}
        {!singlePage && (
          <div className={styles.indicator}>
            {texts.map((_, i) => (
              <span
                key={i}
                className={`${styles.dot} ${i === currentIndex ? styles.active : ''} ${i < currentIndex ? styles.done : ''}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

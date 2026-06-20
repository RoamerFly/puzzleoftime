/**
 * === P2-C: 老人回响结局 ===
 *
 * 从老人视角呈现——你的选择在他们身上留下了什么痕迹。
 * 每条回响是老人的内心独白，不是护工的记录。
 *
 * 流程：
 *   label + subtitle → 逐条回响浮现 → "结束早班"按钮
 *
 * 规则：
 *   - 事件结果 < 3 → mixed/default
 *   - 可点击跳过文字动画
 *   - 不能重复触发 onComplete
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { EventResult } from '../data/caregiverState';
import { buildEndingScene } from '../data/caregiverEndingData';
import type { ElderEcho } from '../data/caregiverEndingData';
import styles from '../styles/caregiver.module.css';

interface CaregiverEndingProps {
  eventResults: EventResult[];
  onComplete: () => void;
  /** 重新体验此章节——重置所有状态，从 intro 开始 */
  onRestart?: () => void;
}

export function CaregiverEnding({ eventResults, onComplete, onRestart }: CaregiverEndingProps) {
  const scene = buildEndingScene(eventResults);
  const [revealedCount, setRevealedCount] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const submittedRef = useRef(false);

  // 逐条回响浮现
  useEffect(() => {
    if (skipped || scene.echoes.length === 0) {
      const t = setTimeout(() => {
        setRevealedCount(scene.echoes.length);
        setShowButton(true);
      }, 300);
      return () => clearTimeout(t);
    }
    if (revealedCount >= scene.echoes.length) {
      const t = setTimeout(() => setShowButton(true), 500);
      return () => clearTimeout(t);
    }
    const timer = setTimeout(() => {
      setRevealedCount((n) => n + 1);
    }, 1500);
    return () => clearTimeout(timer);
  }, [revealedCount, skipped, scene.echoes.length]);

  const handleSkip = useCallback(() => {
    if (skipped) return;
    setSkipped(true);
  }, [skipped]);

  const handleDone = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    window.dispatchEvent(new CustomEvent('caregiver:click'));
    onComplete();
  }, [onComplete]);

  const handleRestart = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    window.dispatchEvent(new CustomEvent('caregiver:click'));
    onRestart?.();
  }, [onRestart]);

  const visibleEchoes: ElderEcho[] = skipped
    ? scene.echoes
    : scene.echoes.slice(0, revealedCount);

  return (
    <div className={styles.endingRoot} onClick={!showButton ? handleSkip : undefined}>
      {/* 背景 */}
      <div className={styles.endingBg} />

      <div className={styles.endingContent}>
        {/* 结局标题 */}
        <div className={styles.endingLabel}>{scene.label}</div>
        <p className={styles.endingSubtitle}>{scene.subtitle}</p>

        {/* 老人回响 —— 三段式：看到 → 处理 → 感受 */}
        <div className={styles.endingEchoes}>
          {visibleEchoes.map((item, i) => (
            <div
              key={item.elderId}
              className={styles.endingEchoCard}
              style={{ animationDelay: `${i * 0.12}s` }}
            >
              <div className={styles.endingEchoName}>{item.elderName}</div>
              {item.saw && (
                <p className={styles.endingEchoSegment}>
                  <span className={styles.endingEchoLabel}>我看到</span>
                  {item.saw}
                </p>
              )}
              {item.did && (
                <p className={styles.endingEchoSegment}>
                  <span className={styles.endingEchoLabel}>我做了</span>
                  {item.did}
                </p>
              )}
              {item.felt && (
                <p className={styles.endingEchoSegment} style={{ color: 'rgba(200,180,160,0.75)', fontStyle: 'italic' }}>
                  {item.felt}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* 章节主题反思 */}
        {scene.reflection && showButton && (
          <div className={styles.endingReflection}>
            <p className={styles.endingReflectionText}>{scene.reflection}</p>
          </div>
        )}

        {/* 完成 / 重新体验 */}
        {showButton && (
          <div className={styles.endingActions}>
            <button className={styles.endingBtnSecondary} onClick={handleRestart}>
              重新体验此章节
            </button>
            <button className={styles.endingBtn} onClick={handleDone}>
              结束早班
            </button>
          </div>
        )}

        {!showButton && (
          <p className={styles.endingSkipHint}>点击任意位置跳过动画</p>
        )}
      </div>
    </div>
  );
}

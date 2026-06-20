/**
 * === OutcomeImagePanel · 结果 CG 展示（Batch 5 改造） ===
 *
 * - 三张 CG 按 consequence 映射
 * - 底部旁白按 insightLevel 选择三级 outcmoeFeedback
 * - 不显示"成功/部分成功/失败"等级标签
 * - 不自动跳转
 * - 加入淡入动画 + 误触保护
 * - 流程：场景淡出 → CG淡入 → 底部旁白 → 300ms保护 → 玩家确认
 */

import { useEffect, useRef, useState } from 'react';
import { caregiverAssets } from '../../assets/assets';
import type { CaregiverAssetEntry } from '../../assets/assets';
import styles from './UnifiedCareScene.module.css';

interface OutcomeImagePanelProps {
  outcomeImages: {
    success: string;
    partial: string;
    failure: string;
  };
  consequence: 'success' | 'partial' | 'failure';
  /** Batch 5: 三级结果旁白（由 insightLevel 选择） */
  outcomeFeedback: string;
  onContinue: () => void;
}

export function OutcomeImagePanel({
  outcomeImages,
  consequence,
  outcomeFeedback,
  onContinue,
}: OutcomeImagePanelProps) {
  const assetKey = outcomeImages[consequence];
  const entry = (caregiverAssets as Record<string, CaregiverAssetEntry>)[assetKey];
  const imgSrc = entry?.src ?? '';

  // 阶段：cgFadeIn → feedbackEnter → ready
  const [phase, setPhase] = useState<'cgFadeIn' | 'feedbackEnter' | 'ready'>('cgFadeIn');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // CG 淡入 600-900ms
    const cgTimer = setTimeout(() => setPhase('feedbackEnter'), 750);
    return () => clearTimeout(cgTimer);
  }, []);

  useEffect(() => {
    if (phase !== 'feedbackEnter') return;
    // 旁白进入后 350ms 误触保护
    const protectTimer = setTimeout(() => setPhase('ready'), 350);
    return () => clearTimeout(protectTimer);
  }, [phase]);

  const handleConfirm = () => {
    if (phase !== 'ready') return;
    onContinue();
  };

  return (
    <div ref={containerRef} className={styles.outcomeRoot}>
      {/* 场景图淡出暗示：全屏暗色遮罩 */}
      <div className={styles.outcomeDimOverlay} />

      {/* 结果 CG */}
      <div className={`${styles.outcomeCgWrapper} ${phase !== 'cgFadeIn' ? styles.outcomeCgVisible : ''}`}>
        {imgSrc && (
          <img
            src={imgSrc}
            alt=""
            className={styles.outcomeImg}
          />
        )}
      </div>

      {/* 底部旁白区 */}
      <div className={`${styles.outcomeNarration} ${phase !== 'cgFadeIn' ? styles.outcomeNarrationVisible : ''}`}>
        {outcomeFeedback && (
          <div className={styles.outcomeFeedbackBubble}>
            <p className={styles.outcomeFeedbackText}>{outcomeFeedback}</p>
          </div>
        )}
      </div>

      {/* 确认按钮 */}
      <button
        className={`${styles.outcomeContinueBtn} ${phase === 'ready' ? styles.outcomeContinueBtnActive : ''}`}
        onClick={handleConfirm}
        disabled={phase !== 'ready'}
        aria-disabled={phase !== 'ready'}
      >
        确认
      </button>
    </div>
  );
}

/**
 * === ActionPoint · 行动点小圆点 ===
 *
 * Batch 2: 三个行动点从进入 observe 起始终显示为小圆点。
 * - 视觉直径 14-18px
 * - 命中圆 28-36px（桌面）/ 40-44px（触屏）
 * - 无常驻标签、徽章或大边框
 * - 悬停：圆点增亮 + 轻微 scale 反馈（不锁定场景）
 * - 点击：触发 onOpen（父组件负责开卡）
 * - 理解等级变化时：播放一次克制动画
 */

import { useEffect, useRef, useState } from 'react';
import type { InterventionHotspot } from '../../data/unifiedSceneData';
import styles from './UnifiedCareScene.module.css';

export interface ActionPointProps {
  hotspot: InterventionHotspot;
  /** 当前理解等级（0/1/2），用于动画触发 */
  insightLevel: number;
  disabled?: boolean;
  onOpen: (hotspot: InterventionHotspot) => void;
  onHoverChange?: (hotspot: InterventionHotspot | null) => void;
}

export function ActionPoint({
  hotspot,
  insightLevel,
  disabled = false,
  onOpen,
  onHoverChange,
}: ActionPointProps) {
  const anchor = hotspot.anchor ?? hotspot.focusPoint;
  const hitRadius = hotspot.hitRadius ?? { desktop: 32, touch: 42 };
  // 命中区直径：触摸 >= 44px (WCAG 2.1)，桌面取配置值
  const touchHit = Math.max(44, hitRadius.touch);
  // 简单触屏检测：文档建议用 min(44px, touch*1.6) 但这里直接取 touch 配置或 44 下限
  const isTouchDevice =
    typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  const hitSize = isTouchDevice ? touchHit : hitRadius.desktop;
  const prevLevelRef = useRef(insightLevel);
  const [animKey, setAnimKey] = useState(0);

  // 理解等级变化时触发一次动画
  useEffect(() => {
    if (prevLevelRef.current !== insightLevel) {
      prevLevelRef.current = insightLevel;
      setAnimKey((k) => k + 1);
    }
  }, [insightLevel]);

  const handleActivate = () => {
    if (!disabled) onOpen(hotspot);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleActivate();
    }
  };

  const handlePointerEnter = () => {
    if (!disabled) onHoverChange?.(hotspot);
  };

  const handlePointerLeave = () => {
    onHoverChange?.(null);
  };

  // Batch 6-fix: 不根据 result 着色，防止泄露正确答案
  return (
    <div
      className={`${styles.actionPoint} ${disabled ? styles.actionPointDisabled : ''} ${animKey > 0 ? styles.actionPointInsightShift : ''}`}
      style={{
        top: `calc(${anchor.top} - 18px)`,
        left: `calc(${anchor.left} - 18px)`,
        width: '36px',
        height: '36px',
      }}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      role="button"
      tabIndex={0}
      aria-label={`行动：${hotspot.copy?.insight0.label ?? hotspot.labelLowInsight}`}
    >
      {/* 视觉圆点（14px） */}
      <span className={styles.actionPointDot} />
      {/* 命中圆（透明，desktop 值即为直径像素） */}
      <span
        className={styles.actionPointHitArea}
        style={{
          width: `${hitSize}px`,
          height: `${hitSize}px`,
        }}
      />
    </div>
  );
}

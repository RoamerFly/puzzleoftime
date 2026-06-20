/**
 * === ActionPreviewCard · 行动预览小卡 ===
 *
 * Batch 2: 点击行动点后打开的小卡片。
 * - 锚定在圆点附近的 cardAnchor
 * - 显示当前 insightLevel 的 label + thought
 * - 只有"执行行动"和"关闭"两个按钮
 * - 支持边缘翻转（卡片不越出场景容器）
 * - 关闭：回到 idle；执行：触发 onSubmit
 */

import { useEffect, useRef } from 'react';
import type { InterventionHotspot, InsightCopy } from '../../data/unifiedSceneData';
import type { InsightLevel } from '../../logic/insightRules';
import styles from './UnifiedCareScene.module.css';

export interface ActionPreviewCardProps {
  hotspot: InterventionHotspot;
  insightLevel: InsightLevel;
  /** 小卡锚点（cardAnchor），相对场景容器 */
  anchorTop: string;
  anchorLeft: string;
  onConfirm: (hotspot: InterventionHotspot) => void;
  onCancel: () => void;
}

function getCopy(hotspot: InterventionHotspot, level: InsightLevel): InsightCopy {
  const copy = hotspot.copy;
  if (copy) {
    const key = `insight${level}` as keyof typeof copy;
    return copy[key];
  }
  // 降级到旧二元字段
  if (level >= 1) {
    return { label: hotspot.labelHighInsight, thought: hotspot.thoughtHighInsight };
  }
  return { label: hotspot.labelLowInsight, thought: hotspot.thoughtLowInsight };
}

export function ActionPreviewCard({
  hotspot,
  insightLevel,
  anchorTop,
  anchorLeft,
  onConfirm,
  onCancel,
}: ActionPreviewCardProps) {
  const copy = getCopy(hotspot, insightLevel);
  const cardRef = useRef<HTMLDivElement>(null);

  // 边缘翻转检测：防止卡片越出场景容器
  useEffect(() => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const parent = card.parentElement;
    if (!parent) return;

    const cardRect = card.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();

    // 右边缘越界 → 向左翻转
    if (cardRect.right > parentRect.right - 8) {
      card.style.left = 'auto';
      card.style.right = '8px';
    }
    // 下边缘越界 → 向上翻转
    if (cardRect.bottom > parentRect.bottom - 8) {
      card.style.top = 'auto';
      card.style.bottom = '8px';
    }
  }, [anchorTop, anchorLeft]);

  return (
    <div
      ref={cardRef}
      className={styles.actionPreviewCard}
      style={{
        top: anchorTop,
        left: anchorLeft,
      }}
      role="dialog"
      aria-label={copy.label}
    >
      <div className={styles.cardHeader}>
        <span className={styles.cardLabel}>{copy.label}</span>
      </div>
      <p className={styles.cardThought}>「{copy.thought}」</p>
      <div className={styles.cardActions}>
        <button
          className={styles.cardConfirmBtn}
          onClick={() => onConfirm(hotspot)}
        >
          执行行动
        </button>
        <button
          className={styles.cardCancelBtn}
          onClick={onCancel}
        >
          关闭
        </button>
      </div>
    </div>
  );
}

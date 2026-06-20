/**
 * === ActionTargetGuide · 行动目标引导线 + 高亮 ===
 *
 * Batch 2: 悬停行动点时显示细引导线 + 目标组轻微高亮。
 * - 从圆点中心到 targetGroup 最近的 rect 拉一条细线
 * - targetGroup 各 rect 以半透明边框/底色高亮
 * - 不改变状态、不锁定场景
 */

import type { InterventionHotspot } from '../../data/unifiedSceneData';
import styles from './UnifiedCareScene.module.css';

export interface ActionTargetGuideProps {
  hotspot: InterventionHotspot;
}

export function ActionTargetGuide({ hotspot }: ActionTargetGuideProps) {
  const targets = hotspot.targetGroup ?? [];

  if (targets.length === 0) return null;

  return (
    <div className={styles.actionTargetGuide}>
      {targets.map((rect, i) => (
        <div
          key={`tg_${i}`}
          className={styles.actionTargetHighlight}
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }}
        />
      ))}
    </div>
  );
}

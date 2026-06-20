/**
 * === SceneHotspotLayer · 场景热点层（Batch 2 改写） ===
 *
 * v5: 行动点始终显示为小圆点，不再依赖 isHighInsight 门槛。
 * - 观察热点始终显示（二态：unseen/recorded）
 * - 三个行动点始终渲染为小圆点
 * - 移除旧 InterventionCircle / interveneGhost / interveneActive / 理解徽章
 */

import type {
  ObserveHotspot,
  InterventionHotspot,
} from '../../data/unifiedSceneData';
import { ActionPoint } from './ActionPoint';
import { getClueState } from './clueState';
import styles from './UnifiedCareScene.module.css';

// ============================================================
// Props
// ============================================================

interface SceneHotspotLayerProps {
  observeHotspots: ObserveHotspot[];
  interventionHotspots: InterventionHotspot[];
  recordedClueIds: string[];
  /** 当前理解等级（0/1/2） */
  insightLevel: number;
  /** 当前悬停的行动点 */
  hoveredInterventionId: string | null;
  /** 全局交互锁 */
  disabled?: boolean;
  onObserveClick: (hotspot: ObserveHotspot) => void;
  onInterventionOpen: (hotspot: InterventionHotspot) => void;
  onInterventionHover: (hotspot: InterventionHotspot | null) => void;
}

// ============================================================
// 组件
// ============================================================

export function SceneHotspotLayer({
  observeHotspots,
  interventionHotspots,
  recordedClueIds,
  insightLevel,
  disabled = false,
  onObserveClick,
  onInterventionOpen,
  onInterventionHover,
}: SceneHotspotLayerProps) {
  const observeElements = observeHotspots.map((h) => {
    const clueState = getClueState(h.clueId, recordedClueIds);
    const stateClass =
      clueState === 'recorded'
        ? styles.hotspotRecorded
        : styles.hotspotUnseen;

    return (
      <div
        key={h.id}
        className={`${styles.hotspot} ${styles.hotspotObserve} ${stateClass}`}
        style={{
          top: h.rect.top,
          left: h.rect.left,
          width: h.rect.width,
          height: h.rect.height,
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) onObserveClick(h);
        }}
        title={disabled ? undefined : (h.label ?? undefined)}
      >
        {clueState === 'unseen' && <span className={styles.hotspotPulse} />}
        {clueState === 'recorded' && (
          <span className={styles.hotspotRecordedMark}>✓</span>
        )}
        <span className={styles.hotspotLabel}>{h.label}</span>
      </div>
    );
  });

  const actionElements = interventionHotspots.map((h) => (
    <ActionPoint
      key={h.id}
      hotspot={h}
      insightLevel={insightLevel}
      disabled={disabled}
      onOpen={onInterventionOpen}
      onHoverChange={onInterventionHover}
    />
  ));

  return (
    <div className={styles.hotspotLayer}>
      {observeElements}
      {actionElements}
    </div>
  );
}

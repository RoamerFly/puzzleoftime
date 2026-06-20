/**
 * === 理解等级与选择器 · insightRules.ts ===
 *
 * 纯函数集合，不依赖 React 或组件状态。
 * 组件只做选择、显示和回调，不得自行判断关键线索数量。
 */

import type { UnifiedCareEventScene } from '../data/unifiedSceneData';
import type { CareEvent } from '../data/eventData';

// ============================================================
// 理解等级
// ============================================================

/** 三级理解：0=表面 1=部分 2=完整 */
export type InsightLevel = 0 | 1 | 2;

/**
 * 根据场景配置和已记录线索计算当前理解等级。
 *
 * 硬规则：
 * - 只有"已记录"的关键线索提升理解等级。
 * - 只查看但关闭，不改变任何持久化状态。
 * - 非关键线索不提升等级。
 */
export function resolveInsightLevel(
  scene: UnifiedCareEventScene,
  recordedClueIds: string[],
): InsightLevel {
  const keyCount = scene.observeHotspots.filter(
    (hotspot) =>
      hotspot.isKey &&
      recordedClueIds.includes(hotspot.clueId),
  ).length;

  if (keyCount <= 0) return 0;
  if (keyCount < scene.keyClueThreshold) return 1;
  return 2;
}

// ============================================================
// 三级文案选择器
// ============================================================

export interface ThreeLevelCopy {
  label: string;
  thought: string;
}

export interface InterventionHotspotWithCopy {
  copy: {
    insight0: ThreeLevelCopy;
    insight1: ThreeLevelCopy;
    insight2: ThreeLevelCopy;
  };
}

/**
 * 从统一场景数据中获取指定行动点+理解等级的 label + thought。
 * 新接口（InterventionHotspot v2）使用 copy.insight0/1/2 结构。
 */
export function getInsightCopy(
  hotspot: InterventionHotspotWithCopy,
  level: InsightLevel,
): ThreeLevelCopy {
  const key = `insight${level}` as const;
  return hotspot.copy[key];
}

// ============================================================
// 结果旁白选择器
// ============================================================

export interface OutcomeFeedbackMap {
  outcomeFeedback: {
    insight0: string;
    insight1: string;
    insight2: string;
  };
}

/**
 * 从干预选项中获取指定理解等级的结果旁白。
 */
export function getOutcomeFeedback(
  option: OutcomeFeedbackMap,
  level: InsightLevel,
): string {
  const key = `insight${level}` as const;
  return option.outcomeFeedback[key];
}

// ============================================================
// 记录模板选择器
// ============================================================

export interface RecordTemplateMap {
  recordTemplates: {
    insight0: string;
    insight1: string;
    insight2: string;
  };
}

/**
 * 从干预选项中获取指定理解等级的交接记录模板。
 */
export function getRecordTemplate(
  option: RecordTemplateMap,
  level: InsightLevel,
): string {
  const key = `insight${level}` as const;
  return option.recordTemplates[key];
}

// ============================================================
// 辅助：从 eventData 中计算关键线索数（兼容旧接口）
// ============================================================

/**
 * 统计事件中已记下的关键线索数。
 * 用于从旧 eventData.clues 计算（Batch 1 兼容保留）。
 */
export function countKeyCluesFromEvent(
  event: CareEvent,
  clueIds: string[],
): number {
  const keyClueIds = event.clues.filter((c) => c.isKey).map((c) => c.id);
  return clueIds.filter((id) => keyClueIds.includes(id)).length;
}

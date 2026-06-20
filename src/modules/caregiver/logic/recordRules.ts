/**
 * === 自动记录规则 · recordRules.ts（Batch 4 改写） ===
 *
 * 从二元 surface/understanding 切换到三级 insightLevel 记录。
 * 记录文本直接读取干预选项的三级 recordTemplates。
 * 本文件是记录文本的唯一来源。EventRecordPanel 只展示，不自行计算。
 */

import type { CareEvent } from '../data/eventData';
import type { InsightLevel } from './insightRules';
import { getRecordPhrases } from './recordFactPhrases';

// ============================================================
// 保留旧接口兼容（Batch 4 后逐步移除）
// ============================================================

/** @deprecated Batch 4 后用 InsightLevel */
export type AutoRecordType = 'surface' | 'understanding';

/** @deprecated Batch 4 后用 AutoRecordV2 */
export interface AutoRecord {
  type: AutoRecordType;
  text: string;
  keyClueCount: number;
  observeDepth: number;
}

// ============================================================
// 新版记录结构
// ============================================================

export interface AutoRecordV2 {
  text: string;
  insightLevel: InsightLevel;
  keyClueCount: number;
}

/**
 * 构建自动记录对象（P0-2 改写：基于实际记录证据）。
 *
 * 记录格式：时间 → 观察到的事实 → 执行的处理 → 交接事项
 * 只写入 recordedClueIds 中对应的事实短语。
 * insightLevel 来自执行行动时的快照。
 */
export function buildAutoRecordV2(
  event: CareEvent,
  interventionId: string | null,
  recordedClueIds: string[],
  insightLevelSnapshot: InsightLevel,
): AutoRecordV2 {
  const keyClueIds = event.clues.filter((c) => c.isKey).map((c) => c.id);
  const keyClueCount = recordedClueIds.filter((id) => keyClueIds.includes(id)).length;

  const intervention = interventionId
    ? event.interventionOptions.find((o) => o.id === interventionId) ?? null
    : null;

  // P0-2: 只写入玩家实际记录过的事实短语
  const factPhrases = getRecordPhrases(recordedClueIds);
  const factsBlock = factPhrases.length > 0
    ? factPhrases.slice(0, 5).join('；') + '。'
    : '已进入场景观察。';

  // 处理描述：从 intervention 提取简短行动摘要
  const actionLabel = intervention?.label ?? '已完成护理操作';
  const consequenceText = intervention?.consequence === 'success'
    ? '处理效果良好'
    : intervention?.consequence === 'partial'
      ? '处理部分完成'
      : '已按流程处理';

  // 交接提示按 insightLevel 分级
  const handoverNote = insightLevelSnapshot >= 2
    ? '下班交接时提醒关注上述观察项目及老人后续状态。'
    : insightLevelSnapshot >= 1
      ? '交接时建议补充观察上述项目。'
      : '交接时可补充更多场景观察。';

  const recordText = `${event.time}，${event.location}。观察到：${factsBlock} 执行处理：${actionLabel}，${consequenceText}。${handoverNote}`;

  return { text: recordText, insightLevel: insightLevelSnapshot, keyClueCount };
}

// ============================================================
// 旧版兼容函数（仅用于旧记录面板兼容）
// ============================================================

/**
 * @deprecated Batch 4: 请使用 buildAutoRecordV2
 */
export function countKeyClues(
  event: CareEvent,
  clueIds: string[],
): number {
  const keyClueIds = event.clues.filter((c) => c.isKey).map((c) => c.id);
  return clueIds.filter((id) => keyClueIds.includes(id)).length;
}

/**
 * @deprecated Batch 4: 旧二元判定，请使用 buildAutoRecordV2
 */
export function getAutoRecordType(
  consequence: 'success' | 'partial' | 'failure',
  keyClueCount: number,
  requiredKeyClues: number,
): AutoRecordType {
  if (consequence === 'failure') return 'surface';
  return keyClueCount >= requiredKeyClues ? 'understanding' : 'surface';
}

/**
 * @deprecated Batch 4: 旧二元构建，请使用 buildAutoRecordV2
 */
export function buildAutoRecord(
  event: CareEvent,
  interventionId: string | null,
  recordedClueIds: string[],
): AutoRecord {
  const keyClueCount = countKeyClues(event, recordedClueIds);
  const intervention = interventionId
    ? event.interventionOptions.find((o) => o.id === interventionId) ?? null
    : null;

  const consequence = intervention?.consequence ?? 'failure';
  const recordType = getAutoRecordType(consequence, keyClueCount, event.requiredKeyCluesToUnderstand);

  const recordText =
    recordType === 'understanding'
      ? (intervention?.recordTemplate?.understanding ?? `你帮助了${event.elderName}。`)
      : (intervention?.recordTemplate?.surface ?? `${event.title}已完成。`);

  return {
    type: recordType,
    text: recordText,
    keyClueCount,
    observeDepth: 0,
  };
}

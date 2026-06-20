/**
 * === 第二章结算纯函数（线性时间线版） ===
 * 适配新 eventResults 结构。
 *
 * @deprecated 已被 CorridorBreath + CaregiverEnding 替代。
 *             保留文件仅供参考，勿接入渲染流程。
 */

import type { HandoverRecord, EventResult } from '../data/caregiverState';
import { CHAPTER2_ENDINGS } from '../data/chapter2Data';
import type { EndingConfig } from '../data/chapter2Data';
import { CHAPTER2_EVENTS, CHAPTER2_EVENT_COUNT } from '../data/eventData';

// ============================================================
// 风险洞察数据
// ============================================================

export interface RiskTagItem {
  tag: string;
  source: string;
  managerHint: string;
}

// ============================================================
// 结算摘要
// ============================================================

export interface Chapter2Summary {
  completedEventCount: number;
  totalEventCount: number;
  /** 理解事件数（关键线索足够的记录数） */
  understoodEventCount: number;
  successInterventionCount: number;
  partialInterventionCount: number;
  failureInterventionCount: number;
  /** 理解比例（理解事件数 / 总事件数） */
  understandingRatio: number;
  ending: EndingConfig;
  observedClueCount: number;
  totalClueCount: number;
  riskTags: RiskTagItem[];
  understoodElders: string[];
}

// ============================================================
// 纯函数
// ============================================================

/** 计算理解事件比例（D2: 不再依赖 discoveredClueIds，基于干预结果 + insightLevel） */
export function getUnderstandingRatio(eventResults: EventResult[]): number {
  if (eventResults.length === 0) return 0;
  const understood = eventResults.filter(
    (r) => r.insightLevel >= 1 || r.consequence === 'success',
  ).length;
  return understood / eventResults.length;
}

/** 根据理解比例匹配结局 */
export function getEndingNarrative(ratio: number): EndingConfig {
  const sorted = [...CHAPTER2_ENDINGS].sort(
    (a, b) => b.minUnderstandingRatio - a.minUnderstandingRatio,
  );
  for (const ending of sorted) {
    if (ratio >= ending.minUnderstandingRatio) return ending;
  }
  return CHAPTER2_ENDINGS[CHAPTER2_ENDINGS.length - 1];
}

/** 构建完整结算摘要（D2: 不再依赖顶层 discoveredClueIds） */
export function buildChapter2Summary(
  eventResults: EventResult[],
  handoverRecords: HandoverRecord[],
): Chapter2Summary {
  const completedEventCount = eventResults.length;
  const totalEventCount = CHAPTER2_EVENT_COUNT;
  const successInterventionCount = eventResults.filter(
    (r) => r.consequence === 'success',
  ).length;
  const partialInterventionCount = eventResults.filter(
    (r) => r.consequence === 'partial',
  ).length;
  const failureInterventionCount = eventResults.filter(
    (r) => r.consequence === 'failure',
  ).length;
  const understoodEventCount = successInterventionCount + partialInterventionCount;
  const understandingRatio = getUnderstandingRatio(eventResults);
  const ending = getEndingNarrative(understandingRatio);

  const totalClueCount = CHAPTER2_EVENTS.reduce(
    (sum, event) => sum + event.clues.length,
    0,
  );
  // D2: 从各事件的 recordedClueIds 聚合观察总数，替换旧的 discoveredClueIds
  const observedClueCount = new Set(
    eventResults.flatMap((r) => r.recordedClueIds),
  ).size;

  const understoodElders = getUnderstoodElders(handoverRecords);
  const riskTags = extractRiskTags(eventResults);

  return {
    completedEventCount,
    totalEventCount,
    understoodEventCount,
    successInterventionCount,
    partialInterventionCount,
    failureInterventionCount,
    understandingRatio,
    ending,
    observedClueCount,
    totalClueCount,
    riskTags,
    understoodElders,
  };
}

/** 从事件结果中提取风险标签 */
export function extractRiskTags(eventResults: EventResult[]): RiskTagItem[] {
  const items: RiskTagItem[] = [];
  const seen = new Set<string>();

  for (const result of eventResults) {
    if (result.consequence === 'failure') continue;

    const event = CHAPTER2_EVENTS.find((e) => e.id === result.eventId);
    if (!event) continue;

    const intervention = event.interventionOptions.find(
      (o) => o.id === result.interventionId,
    );

    const tagBase = `${event.elderName}`;
    if (!seen.has(tagBase)) {
      seen.add(tagBase);
      items.push({
        tag: result.consequence === 'success' ? '深层理解' : '部分理解',
        source: `${event.time} ${event.title}`,
        managerHint: intervention?.feedback?.slice(0, 50) ?? '',
      });
    }
  }

  return items;
}

/** 获取被理解的老人名字 */
export function getUnderstoodElders(records: HandoverRecord[]): string[] {
  const elders = new Set<string>();
  for (const r of records) {
    if (r.elderName && r.elderName !== '老人') {
      elders.add(r.elderName);
    }
  }
  return [...elders];
}

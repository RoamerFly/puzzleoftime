/* === 护工视角模块：历史报告快照数据模型 === */

import type { EventResult, HandoverRecord } from './caregiverState';
import { buildEndingScene } from './caregiverEndingData';
import type { ElderEcho } from './caregiverEndingData';

/* ======== 报告版本 ======== */
export const CAREGIVER_HISTORY_REPORT_VERSION = '1.0.0';

/* ======== 老人回响快照（纯文本，不含 React 节点） ======== */
export interface EchoSnapshot {
  elderName: string;
  consequence: string;
  insightLevel: number;
  saw: string;
  did: string;
  felt: string;
}

/* ======== 统计摘要 ======== */
export interface CaregiverStats {
  totalEvents: number;
  completedEvents: number;
  successInterventions: number;
  partialInterventions: number;
  failureInterventions: number;
  understandingCount: number;
  deepUnderstandingCount: number;
  understandingRatio: number;
}

/* ======== 交接记录快照 ======== */
export interface HandoverSnapshot {
  elderName: string;
  text: string;
}

/* ======== 完整护工历史报告 ======== */
export interface CaregiverHistoryReport {
  version: string;
  completedAt: string;

  /** 结局标签 */
  label: string;
  /** 结局副标题 */
  subtitle: string;
  /** 章节反思 */
  reflection: string;

  /** 老人回响列表 */
  echoes: EchoSnapshot[];
  /** 统计摘要 */
  stats: CaregiverStats;
  /** 交接记录 */
  handoverRecords: HandoverSnapshot[];
}

/* ======== 纯函数：构建报告 ======== */

/**
 * 构建护工视角历史报告快照。
 * 所有数据均为纯 JSON 可序列化，不含 React 节点/函数/Audio 等。
 */
export function buildCaregiverHistoryReport(
  eventResults: EventResult[],
  handoverRecords: HandoverRecord[],
): CaregiverHistoryReport {
  // 使用已有的 ending 构建逻辑
  const scene = buildEndingScene(eventResults);

  const completedEvents = eventResults.length;
  const totalEvents = 3; // 固定三个事件

  const successCount = eventResults.filter((r) => r.consequence === 'success').length;
  const partialCount = eventResults.filter((r) => r.consequence === 'partial').length;
  const failureCount = eventResults.filter((r) => r.consequence === 'failure').length;

  const understandingCount = eventResults.filter((r) => r.insightLevel >= 1).length;
  const deepUnderstandingCount = eventResults.filter((r) => r.insightLevel >= 2).length;
  const understandingRatio = completedEvents > 0
    ? Math.round((understandingCount / completedEvents) * 100)
    : 0;

  // 老人回响快照
  const echoes: EchoSnapshot[] = scene.echoes.map((e: ElderEcho) => ({
    elderName: e.elderName,
    consequence: e.consequence,
    insightLevel: e.insightLevel,
    saw: e.saw,
    did: e.did,
    felt: e.felt,
  }));

  // 交接记录快照
  const records: HandoverSnapshot[] = handoverRecords.map((r) => ({
    elderName: r.elderName,
    text: r.text,
  }));

  return {
    version: CAREGIVER_HISTORY_REPORT_VERSION,
    completedAt: new Date().toISOString(),
    label: scene.label,
    subtitle: scene.subtitle,
    reflection: scene.reflection,
    echoes,
    stats: {
      totalEvents,
      completedEvents,
      successInterventions: successCount,
      partialInterventions: partialCount,
      failureInterventions: failureCount,
      understandingCount,
      deepUnderstandingCount,
      understandingRatio,
    },
    handoverRecords: records,
  };
}

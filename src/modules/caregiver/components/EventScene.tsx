/**
 * === 事件主场景（v4: 统一场景图交互） ===
 * 流程：intro → observe → intervene → outcome → record
 *
 * observe / intervene / outcome 三步全部交给 UnifiedCareScene。
 * 三位老人统一使用场景图 + 热点配置，不再区分沉浸式/旧流程。
 */

import { useCallback } from 'react';
import type { CareEvent, InterventionOption } from '../data/eventData';
import type { EventStep } from '../data/caregiverState';
import { EventRecordPanel } from './EventRecordPanel';
import { UnifiedCareScene } from './unified/UnifiedCareScene';
import type { InterventionHotspot } from '../data/unifiedSceneData';
import { getUnifiedScene } from '../data/unifiedSceneData';
import { buildAutoRecordV2 } from '../logic/recordRules';
import type { InsightLevel } from '../logic/insightRules';
import { caregiverAssets } from '../assets/assets';
import type { CaregiverAssetEntry } from '../assets/assets';
import styles from '../styles/caregiver.module.css';

interface EventSceneProps {
  event: CareEvent;
  step: EventStep;
  selectedInterventionId: string | null;
  interventionConsequence: 'success' | 'partial' | 'failure' | null;
  /** Batch 5: 三级结果旁白文本（由父组件按 insightLevel 预选） */
  outcomeFeedbackText: string;
  /** Batch 4: 执行行动时固化的理解等级快照 */
  insightLevelSnapshot?: number | null;
  /** 已 recorded 的线索 ID */
  recordedClueIds?: string[];
  /** 线索 peek 回调 */
  onCluePeek?: (clueId: string) => void;
  /** 线索 record 回调 */
  onClueRecord?: (clueId: string) => void;
  onInterventionSelect: (option: InterventionOption) => void;
  onOutcomeContinue: () => void;
  onRecordContinue: () => void;
  onSkipToObserve: () => void;
}

export function EventScene({
  event,
  step,
  selectedInterventionId,
  interventionConsequence,
  outcomeFeedbackText,
  insightLevelSnapshot = null,
  recordedClueIds = [],
  onCluePeek,
  onClueRecord,
  onInterventionSelect,
  onOutcomeContinue,
  onRecordContinue,
  onSkipToObserve,
}: EventSceneProps) {
  const scene = getUnifiedScene(event.id);

  // ── 线索 peek（降级到 onClueDiscover 兼容） ──
  const handleCluePeek = useCallback(
    (clueId: string) => {
      if (onCluePeek) { onCluePeek(clueId); }
    },
    [onCluePeek],
  );

  // ── 线索 record（原子操作：CaregiverScene 内一次 updateState 完成记录+发现+递进） ──
  const handleClueRecord = useCallback(
    (clueId: string) => {
      if (onClueRecord) { onClueRecord(clueId); }
    },
    [onClueRecord],
  );

  // ── 干预热点 → InterventionOption 映射 ──
  const handleInterventionHotspot = useCallback(
    (hotspot: InterventionHotspot) => {
      const option = event.interventionOptions.find(
        (o) => o.id === hotspot.interventionId,
      );
      if (option) {
        onInterventionSelect(option);
      }
    },
    [event.interventionOptions, onInterventionSelect],
  );

  // ============================================================
  // intro：场景图全屏背景 + 浮层卡片
  // ============================================================
  if (step === 'intro') {
    const introScene = getUnifiedScene(event.id);
    const introBgEntry = introScene ? (caregiverAssets as Record<string, CaregiverAssetEntry>)[introScene.sceneImage] : null;
    const introBgSrc = introBgEntry?.src ?? '';

    return (
      <div className={`caregiver-scene-root ${styles.eventRoot}`}>
        {/* 场景图背景 */}
        <div
          className={styles.eventBg}
          style={introBgSrc ? {
            backgroundImage: `url(${introBgSrc})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          } : undefined}
        />
        {/* 暗色遮罩增强文字可读性 */}
        {introBgSrc && <div className={styles.eventBgOverlay} />}
        <div className={styles.eventIntroLayout}>
          <div className={styles.eventIntroVisual}>
            <span className={styles.eventIntroBadge}>三楼早班 · 护理员视角</span>
            <h2 className={styles.eventIntroChapter}>{event.title}</h2>
          </div>
          <div className={styles.eventIntroCard}>
            <div className={styles.eventIntroHeader}>
              <span className={styles.eventIntroTime}>{event.time}</span>
              <span className={styles.eventIntroLocation}>{event.location}</span>
            </div>
            <p className={styles.eventIntroText}>{event.introText}</p>
            <button className={styles.eventIntroBtn} onClick={onSkipToObserve}>
              走过去看看
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // observe / outcome：统一交给 UnifiedCareScene
  // （intervene 已合并到 observe，不再有独立 intervene 模式）
  // ============================================================

  if (scene && (step === 'observe' || step === 'outcome')) {
    const unifiedMode = step === 'outcome' ? 'outcome' : 'observe';
    return (
      <div className={`caregiver-scene-root ${styles.eventRoot}`}>
        <UnifiedCareScene
          scene={scene}
          mode={unifiedMode}
          recordedClueIds={recordedClueIds}
          consequence={step === 'outcome' ? (interventionConsequence ?? 'partial') : undefined}
          outcomeFeedback={step === 'outcome' ? outcomeFeedbackText : undefined}
          onCluePeek={handleCluePeek}
          onClueRecord={handleClueRecord}
          onInterventionSelect={handleInterventionHotspot}
          onOutcomeContinue={onOutcomeContinue}
        />
      </div>
    );
  }

  // ============================================================
  // record：保留现有自动记录面板
  // ============================================================
  if (step === 'record') {
    const snapshot = (insightLevelSnapshot === 0 || insightLevelSnapshot === 1 || insightLevelSnapshot === 2)
      ? insightLevelSnapshot as InsightLevel
      : 0;
    const autoRecordV2 = buildAutoRecordV2(event, selectedInterventionId, recordedClueIds, snapshot);
    return (
      <div className={`caregiver-scene-root ${styles.eventRoot}`} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <EventRecordPanel
          autoRecordV2={autoRecordV2}
          elderName={event.elderName}
          eventTitle={event.title}
          onContinue={onRecordContinue}
        />
      </div>
    );
  }

  // ============================================================
  // 兜底：无场景配置的事件（不应出现，仅安全网）
  // ============================================================
  return (
    <div className={`caregiver-scene-root ${styles.eventRoot}`}>
      <div className={styles.eventStage}>
        <div className={styles.eventBg} />
        <div className={styles.observeHint}>
          <span className={styles.observeHintText}>
            场景数据缺失，请刷新重试。
          </span>
        </div>
        <div className={styles.eventBottomBar}>
          <button className={styles.eventBottomBtn} onClick={onOutcomeContinue}>
            跳过
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * === 第二章主控文件 —— 线性时间线版（v3: 无 guess 流程） ===
 *
 * 流程：
 *   intro → event-scene(intro→observe→intervene→outcome→auto-record) → shift-timeline → ... → summary
 *
 * 关键规则：
 * - observe 完成后直接进入 intervene（无 guess 步骤）
 * - record 自动生成，不二选一
 * - 全新进入且未完成过 → 从头开始（与 elder 章节行为一致）
 * - resume / 已完成 → 保留历史进度（保证历史面板数据准确）
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import type { ChapterSceneProps } from '../../core/chapterRegistry';
import { useChapterState } from '../../core/hooks/useChapterState';
import type { CaregiverState, EventResult } from './data/caregiverState';
import {
  CAREGIVER_INITIAL_STATE,
  normalizeCaregiverState,
  isCaregiverStateValid,
  CHAPTER2_FLOW_VERSION,
} from './data/caregiverState';
import { CHAPTER2_EVENTS } from './data/eventData';
import type { InterventionOption } from './data/eventData';
import { getUnifiedScene } from './data/unifiedSceneData';
import { resolveInsightLevel } from './logic/insightRules';
import { ShiftTimelineScene } from './components/ShiftTimelineScene';
import { EventScene } from './components/EventScene';
// P2-B: 走廊呼吸时刻
import { CorridorBreath } from './components/CorridorBreath';
// P2-C: 老人回响结局
import { CaregiverEnding } from './components/CaregiverEnding';
import { TimeBar } from './components/TimeBar';
// P0-A: buildAutoRecord 作为记录生成的唯一来源
import { buildAutoRecordV2 } from './logic/recordRules';
import type { InsightLevel } from './logic/insightRules';
import { buildCaregiverHistoryReport } from './data/caregiverHistoryReport';
import styles from './styles/caregiver.module.css';
import './styles/tokens.css';
import './styles/keyframes.css';
// P3: BGM 音频系统
import { useCaregiverBgm } from './hooks/useCaregiverBgm';
import type { CaregiverSceneId } from './data/caregiverBgmConfig';

export function CaregiverScene({ onComplete }: ChapterSceneProps) {
  // ============================================================
  // 持久化状态 —— resume 时从 localStorage 恢复，新开游戏则重置
  // ============================================================
  const { state: rawState, updateState } = useChapterState<CaregiverState>(
    'caregiver',
    CAREGIVER_INITIAL_STATE,
  );

  const location = useLocation();
  const isResume = (location.state as { resume?: boolean } | null)?.resume ?? false;

  // 新开游戏时重置为初始状态（仅执行一次）
  const resetDoneRef = useRef(false);
  useEffect(() => {
    if (resetDoneRef.current) return;
    resetDoneRef.current = true;
    if (!isResume) {
      updateState(CAREGIVER_INITIAL_STATE);
    }
  }, [isResume, updateState]);

  const state = useMemo(
    () => normalizeCaregiverState(rawState),
    [rawState],
  );

  // 非法状态修复（含版本不匹配、字段缺失等）
  useEffect(() => {
    const valid = isCaregiverStateValid(rawState as CaregiverState);
    const indexOverflow =
      state.currentEventIndex >= CHAPTER2_EVENTS.length &&
      state.phase !== 'summary';

    if (!valid || indexOverflow) {
      // 版本不匹配的旧存档立刻写入完整初始状态，避免每次 render 被 normalize 回滚
      if (!valid && rawState.flowVersion !== CHAPTER2_FLOW_VERSION) {
        updateState(CAREGIVER_INITIAL_STATE);
        return;
      }
      const repaired: CaregiverState = indexOverflow
        ? { ...state, phase: 'summary' as const }
        : state;
      updateState(repaired);
    }
  }, [rawState, state, updateState]);

  const {
    phase,
    currentEventIndex,
    eventStep,
    selectedInterventionId,
    eventResults,
    handoverRecords,
    eventInteractionStates,
  } = state;

  const safeEventIndex = Math.min(currentEventIndex, CHAPTER2_EVENTS.length - 1);
  const currentEvent = CHAPTER2_EVENTS[safeEventIndex] ?? null;

  // 当前事件的交互状态（peeked / recorded）
  const currentInteraction = useMemo(
    () => eventInteractionStates.find((s) => s.eventId === currentEvent?.id) ?? null,
    [eventInteractionStates, currentEvent?.id],
  );
  const recordedClueIds: string[] = currentInteraction?.recordedClueIds ?? [];

  const completedIndices = useMemo(
    () =>
      eventResults
        .map((r) => CHAPTER2_EVENTS.findIndex((e) => e.id === r.eventId))
        .filter((i) => i >= 0),
    [eventResults],
  );

  // 干预选项反查
  const selectedIntervention =
    currentEvent && selectedInterventionId
      ? currentEvent.interventionOptions.find(
          (o) => o.id === selectedInterventionId,
        ) ?? null
      : null;
  const interventionConsequence = selectedIntervention?.consequence ?? null;

  // ══════════════════════════════════════════════
  // 音频 v2.2: 4 BGM + 1 统一80ms点击SFX
  // ══════════════════════════════════════════════
  useCaregiverBgm({
    phase,
    sceneId: (currentEvent?.elderId as CaregiverSceneId) ?? null,
    enabled: true,
  });

  // Batch 5: 三级结果旁白（根据 insightLevelSnapshot 选择）
  const outcomeFeedbackText = useMemo(() => {
    if (!selectedIntervention || currentInteraction?.insightLevelSnapshot === null || currentInteraction?.insightLevelSnapshot === undefined) {
      return selectedIntervention?.feedback ?? '';
    }
    const level = currentInteraction.insightLevelSnapshot;
    const key = `insight${level}` as const;
    return selectedIntervention?.outcomeFeedback?.[key] ?? selectedIntervention?.feedback ?? '';
  }, [selectedIntervention, currentInteraction?.insightLevelSnapshot]);

  // ============================================================
  // 阶段切换回调
  // ============================================================

  /** 开场 → 第一个事件 */
  const handleIntroContinue = useCallback(() => {
    updateState({ phase: 'event-scene', eventStep: 'intro' });
  }, [updateState]);

  /** shift-timeline 过场 → 下一个事件 */
  const handleTimelineContinue = useCallback(() => {
    updateState({
      phase: 'event-scene',
      eventStep: 'intro',
      selectedInterventionId: null,
    });
  }, [updateState]);

  /** intro → observe */
  const handleSkipToObserve = useCallback(() => {
    updateState({ eventStep: 'observe' });
  }, [updateState]);

  /** Batch 7: 线索 peek（关闭未记录线索时不写状态） */
  const handleCluePeek = useCallback(
    () => {
      // 不再写入 peekedClueIds 或 discoveredClueIds
      // 仅由 UnifiedCareScene 清理本地 UI 状态
    },
    [],
  );

  /** Batch 7: 线索 record（记下）—— 只写 recordedClueIds */
  const handleClueRecord = useCallback(
    (clueId: string) => {
      if (!currentEvent) return;

      // 更新 eventInteractionStates（手册数据源）
      const existing = eventInteractionStates.find((s) => s.eventId === currentEvent.id);
      const recorded = existing
        ? [...existing.recordedClueIds, clueId].filter((id, i, arr) => arr.indexOf(id) === i)
        : [clueId];
      const updated = {
        eventId: currentEvent.id,
        peekedClueIds: existing?.peekedClueIds ?? [],
        recordedClueIds: recorded,
        selectedInterventionId: existing?.selectedInterventionId ?? null,
        insightLevelSnapshot: existing?.insightLevelSnapshot ?? null,
      };
      const others = eventInteractionStates.filter((s) => s.eventId !== currentEvent.id);

      updateState({ eventInteractionStates: [...others, updated] });
      window.dispatchEvent(new CustomEvent('caregiver:click'));
    },
    [currentEvent, eventInteractionStates, updateState],
  );

  /** 干预选择 —— 固化 insightLevel 快照 + 同步写入 eventInteractionStates */
  const handleInterventionSelect = useCallback(
    (option: InterventionOption) => {
      if (!currentEvent) return;
      // Batch 3: 执行行动时计算并固化 insightLevel
      const scene = getUnifiedScene(currentEvent.id);
      const snapshot = scene ? resolveInsightLevel(scene, recordedClueIds) : 0;
      const existing = eventInteractionStates.find((s) => s.eventId === currentEvent.id);
      const updated = {
        eventId: currentEvent.id,
        peekedClueIds: existing?.peekedClueIds ?? [],
        recordedClueIds: existing?.recordedClueIds ?? [],
        selectedInterventionId: option.id,
        insightLevelSnapshot: snapshot,
      };
      const others = eventInteractionStates.filter((s) => s.eventId !== currentEvent.id);
      updateState({
        selectedInterventionId: option.id,
        eventStep: 'outcome',
        eventInteractionStates: [...others, updated],
      });
      window.dispatchEvent(new CustomEvent('caregiver:click'));
    },
    [currentEvent, eventInteractionStates, recordedClueIds, updateState],
  );

  /** outcome → 自动记录 */
  const handleOutcomeContinue = useCallback(() => {
    updateState({ eventStep: 'record' });
  }, [updateState]);

  /** Batch 4: 自动记录 → 下一个事件或结算（使用 buildAutoRecordV2） */
  const handleRecordContinue = useCallback(() => {
    if (!currentEvent) return;

    // 防重复提交——当前事件已有记录则跳过并前进
    const alreadyRecorded = eventResults.some((r) => r.eventId === currentEvent.id);
    if (alreadyRecorded) {
      const nextIndex = currentEventIndex + 1;
      const isLastEvent = nextIndex >= CHAPTER2_EVENTS.length;
      updateState({
        phase: isLastEvent ? 'summary' : 'shift-timeline',
        currentEventIndex: isLastEvent ? currentEventIndex : nextIndex,
        eventStep: 'record',
      });
      return;
    }

    // Batch 4: 使用执行时固化的 insightLevelSnapshot
    const snapshot = currentInteraction?.insightLevelSnapshot ?? 0;
    const autoRecord = buildAutoRecordV2(
      currentEvent,
      selectedInterventionId,
      recordedClueIds,
      snapshot as InsightLevel,
    );

    const intervention = selectedInterventionId
      ? currentEvent.interventionOptions.find((o) => o.id === selectedInterventionId)
      : null;

    // Batch 4: EventResult 写入新字段
    const result: EventResult = {
      eventId: currentEvent.id,
      elderId: currentEvent.elderId,
      elderName: currentEvent.elderName,
      interventionId: selectedInterventionId ?? '',
      consequence: intervention?.consequence ?? 'failure',
      recordType: autoRecord.insightLevel >= 1 ? 'understanding' : 'surface',
      discoveredClueIds: [...recordedClueIds],
      observeDepth: 0,
      recordText: autoRecord.text,
      insightLevel: autoRecord.insightLevel,
      recordedClueIds: [...recordedClueIds],
    };

    const newResults = [...eventResults, result];
    const newRecord = {
      taskId: currentEvent.id,
      elderId: currentEvent.elderId,
      elderName: currentEvent.elderName,
      text: autoRecord.text, // P0-A: 使用 buildAutoRecord 生成的文本
    };

    const nextIndex = currentEventIndex + 1;
    const isLastEvent = nextIndex >= CHAPTER2_EVENTS.length;

    updateState({
      eventResults: newResults,
      completedTasks: newResults.map((r) => r.eventId),
      handoverRecords: [...handoverRecords, newRecord],
      phase: isLastEvent ? 'summary' : 'shift-timeline',
      currentEventIndex: isLastEvent ? currentEventIndex : nextIndex,
      eventStep: 'record',
    });
  }, [
    currentEvent,
    currentEventIndex,
    selectedInterventionId,
    recordedClueIds,
    eventResults,
    handoverRecords,
    eventInteractionStates,
    currentInteraction,
    updateState,
  ]);

  /** 重新体验：重置当前章节所有状态到初始值 */
  const handleRestartChapter = useCallback(() => {
    updateState(CAREGIVER_INITIAL_STATE);
  }, [updateState]);

  // ============================================================
  // 阶段渲染
  // ============================================================

  // ============================================================
  // 结局阶段：保存历史报告快照（用于 MainMenu 查看报告）
  // 必须在所有 return 之前声明 hooks，否则违反 React Hook 规则
  // ============================================================
  const reportSavedRef = useRef(false);
  useEffect(() => {
    if (phase === 'ending' && !reportSavedRef.current) {
      reportSavedRef.current = true;
      const report = buildCaregiverHistoryReport(eventResults, handoverRecords);
      updateState({ historyReport: report });
    }
  }, [phase, eventResults, handoverRecords, updateState]);

  // 开场 / 时间线过场
  if (phase === 'intro' || phase === 'shift-timeline') {
    return (
      <ShiftTimelineScene
        events={CHAPTER2_EVENTS}
        currentIndex={safeEventIndex}
        completedIndices={completedIndices}
        onContinue={
          phase === 'intro' ? handleIntroContinue : handleTimelineContinue
        }
      />
    );
  }

  // 事件场景
  if (phase === 'event-scene' && currentEvent) {
    // ═══════════════════════════════════════════════════════════
    // 时钟驱动进度：班次 08:00(0%) → 11:30(100%) = 210分钟
    //   08:10 王奶奶 ≈ 5%    09:20 李爷爷 ≈ 38%    10:40 陈阿姨 ≈ 76%
    //   事件内步骤：intro +0% / observe +3% / outcome +5% / record +7%
    // ═══════════════════════════════════════════════════════════
    const SHIFT_TOTAL_MINUTES = 210; // 08:00 → 11:30
    const EVENT_CLOCK_MINUTES = [10, 80, 160]; // 对应 eventIndex 0/1/2
    const STEP_OFFSET: Record<string, number> = {
      intro: 0, observe: 3, outcome: 5, record: 7,
    };

    const baseMinutes = EVENT_CLOCK_MINUTES[currentEventIndex] ?? 160;
    const offset = STEP_OFFSET[eventStep] ?? 0;
    const eventPercent = Math.min(100, ((baseMinutes + offset) / SHIFT_TOTAL_MINUTES) * 100);

    // 阈值：0-60% 正常 / 60-85% 注意 / 85%+ 紧迫（≈ 10:00 / 11:00 节点）
    const timeState = eventPercent > 85 ? 'urgent' : eventPercent > 60 ? 'warning' : 'normal';

    return (
      <>
        <TimeBar percent={eventPercent} state={timeState} currentTime={currentEvent.time} />
        <EventScene
          event={currentEvent}
          step={eventStep}
          selectedInterventionId={selectedInterventionId}
          interventionConsequence={interventionConsequence}
          outcomeFeedbackText={outcomeFeedbackText}
          insightLevelSnapshot={currentInteraction?.insightLevelSnapshot}
          recordedClueIds={recordedClueIds}
          onCluePeek={handleCluePeek}
          onClueRecord={handleClueRecord}
          onInterventionSelect={handleInterventionSelect}
          onOutcomeContinue={handleOutcomeContinue}
          onRecordContinue={handleRecordContinue}
          onSkipToObserve={handleSkipToObserve}
        />
      </>
    );
  }

  // P2-B: 结算 → 走廊呼吸 → ending
  if (phase === 'summary') {
    return (
      <CorridorBreath
        eventResults={eventResults}
        onContinue={() => updateState({ phase: 'ending' })}
      />
    );
  }

  // P2-C: ending —— 老人回响
  if (phase === 'ending') {
    return (
      <CaregiverEnding
        eventResults={eventResults}
        onComplete={onComplete}
        onRestart={handleRestartChapter}
      />
    );
  }

  // 兜底
  return (
    <div className="caregiver-scene-root">
      <div className={styles.phasePanel}>
        <h2 className={styles.phaseTitle}>班次记录需要重新整理</h2>
        <p className={styles.phaseIntro}>
          当前进度状态不完整，可能由旧存档或异常中断导致。
        </p>
        <button
          className={styles.confirmBtn}
          onClick={() => updateState(CAREGIVER_INITIAL_STATE)}
        >
          重新开始第二章
        </button>
      </div>
    </div>
  );
}

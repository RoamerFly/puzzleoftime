/* === 院长视角模块：工作突发事件处理面板 === */

import { useCallback, useMemo } from 'react';
import type { WorkEvent, WorkEventResult } from '../data/eventData';
import {
  generateEventNotification,
  generateEventBulletinNote,
  generateWorkEventDialogue,
} from '../data/eventData';
import { PhoneDialogPanel, optionToChoiceItem } from './PhoneDialogPanel';
import styles from '../styles/manager.module.css';

interface EventCallPanelProps {
  /** 当前处理的事件 */
  event: WorkEvent;
  /** 事件序号（1-based） */
  eventNumber: number;
  totalEvents: number;
  remainingBudget: number;
  indicators: Record<string, number>;
  /** 处理完本事件后的回调（更新预算/指标/通知） */
  onResolve: (result: WorkEventResult) => void;
  /** 继续到下一事件或家庭来电 */
  onContinue: () => void;
  /** 音频：获取对白配音资源 */
  getVoiceSrc?: (
    dialogueLineIndex: number,
    dialogueKind: string,
    eventType?: string | null,
    familyCaller?: 'child' | 'spouse' | null,
  ) => string | null;
  /** 音频：播放语音 */
  playVoice?: (src: string) => HTMLAudioElement | null;
  /** 音频：停止语音 */
  stopVoice?: () => void;
}

export function EventCallPanel({
  event,
  eventNumber,
  totalEvents,
  remainingBudget,
  indicators,
  onResolve,
  onContinue,
  getVoiceSrc,
  playVoice,
  stopVoice,
}: EventCallPanelProps) {
  /* 电话对话内容 */
  const dialogueLines = useMemo(() => generateWorkEventDialogue(event), [event]);
  const choiceItems = useMemo(() => event.options.map(optionToChoiceItem), [event.options]);

  /* 选择处理方案 → 更新状态并展示反馈 */
  const handleChoose = useCallback(
    (choiceId: string) => {
      const chosenOption = event.options.find(o => o.id === choiceId);
      if (!chosenOption) return;
      if (remainingBudget < chosenOption.budgetCost) return;

      const result: WorkEventResult = {
        event,
        chosenOptionId: choiceId,
        systemNotification: generateEventNotification(event, choiceId),
        bulletinNote: generateEventBulletinNote(event, choiceId),
      };
      onResolve(result);
    },
    [event, remainingBudget, onResolve],
  );

  return (
    <PhoneDialogPanel
      callerName={getCallerName(event)}
      callerRole={getCallerRole(event)}
      riskLevel={event.severity}
      remainingBudget={remainingBudget}
      indicators={indicators}
      dialogueLines={dialogueLines}
      choices={choiceItems}
      resultTitle={`${event.title} — 已处理`}
      resultDetail={getResultDetail(event)}
      resultButtonText="记录并挂断"
      eventNumber={eventNumber}
      totalEvents={totalEvents}
      onChoose={handleChoose}
      onContinue={onContinue}
      getVoiceSrc={getVoiceSrc}
      playVoice={playVoice}
      stopVoice={stopVoice}
      eventType={event.type}
    />
  );
}

/** 根据事件类型获取来电人名称 */
function getCallerName(event: WorkEvent): string {
  switch (event.type) {
    case 'caregiver_leave':
      return '护理员小刘';
    case 'fall_risk':
      return '护理长';
    case 'family_complaint':
      return '家属代表周女士';
    case 'inspection_notice':
      return '区民政局工作人员';
    default:
      return '来电';
  }
}

/** 根据事件类型获取来电人角色 */
function getCallerRole(event: WorkEvent): string {
  switch (event.type) {
    case 'caregiver_leave':
      return '夜班护理员';
    case 'fall_risk':
      return '日间护理负责';
    case 'family_complaint':
      return '三位联名家属之一';
    case 'inspection_notice':
      return '安全检查组';
    default:
      return '';
  }
}

/** 获取结果简述（用于反馈展示） */
function getResultDetail(event: WorkEvent): string {
  switch (event.type) {
    case 'caregiver_leave':
      return '处理方案已记录。排班调整将影响护理人员配置，请注意后续运营数据变化。';
    case 'fall_risk':
      return '处理方案已记录。安全风险缓解程度将直接影响老年人和家属信心。';
    case 'family_complaint':
      return '处理方案已记录。家属关系维护是机构长效运营的重要基础。';
    case 'inspection_notice':
      return '处理方案已记录。安全检查结果将直接影响机构评级与财政支持。';
    default:
      return '已记录处理方案。请继续。';
  }
}

/* ======== EventResolvedToast 保留用于兼容，但新流程不再使用 ======== */
interface EventResolvedToastProps {
  result: WorkEventResult;
  onDismiss: () => void;
}

export function EventResolvedToast({ result, onDismiss }: EventResolvedToastProps) {
  return (
    <div className={styles.eventResolvedOverlay} onClick={onDismiss}>
      <div className={styles.eventResolvedToast} onClick={e => e.stopPropagation()}>
        <div className={styles.eventResolvedIcon}>📋</div>
        <h3 className={styles.eventResolvedTitle}>
          {result.event.title} — 已处理
        </h3>
        <p className={styles.eventResolvedNote}>{result.bulletinNote}</p>
        <button className={styles.eventResolvedBtn} onClick={onDismiss}>
          继续
        </button>
      </div>
    </div>
  );
}

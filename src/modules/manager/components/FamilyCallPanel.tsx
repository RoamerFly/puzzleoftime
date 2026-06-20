/* === 院长视角模块：家庭来电面板 === */

import { useMemo, useCallback } from 'react';
import type { FamilyCallData, FamilyCallChoice } from '../data/eventData';
import { generateFamilyDialogue, type FamilyCaller } from '../data/eventData';
import { PhoneDialogPanel } from './PhoneDialogPanel';

interface FamilyCallPanelProps {
  familyData: FamilyCallData;
  onChoose: (choiceId: FamilyCallChoice['id']) => void;
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

export function FamilyCallPanel({
  familyData,
  onChoose,
  onContinue,
  getVoiceSrc,
  playVoice,
  stopVoice,
}: FamilyCallPanelProps) {
  const callerName = familyData.caller === 'child' ? '孩子' : '爱人';
  const callerRole = '家人';
  const callerIcon = familyData.caller === 'child' ? '👶' : '❤️';

  /* 对话内容 */
  const dialogueLines = useMemo(
    () => generateFamilyDialogue(familyData.caller as FamilyCaller),
    [familyData.caller],
  );

  /* 不再传递 choices —— 家庭电话接听后直接播放对话，对话结束即进入结果 */
  // 保留 onChoose 用于触发 familyCallChoice 状态更新（final report 需要）
  const handleChoose = useCallback(
    (choiceId: string) => {
      onChoose(choiceId as FamilyCallChoice['id']);
    },
    [onChoose],
  );

  /* 结果反馈 */
  const resultTitle = useMemo(() => {
    switch (familyData.caller) {
      case 'child':
        return `${callerIcon} 家庭来电 — 已接听`;
      case 'spouse':
        return `${callerIcon} 家庭来电 — 已接听`;
      default:
        return '家庭来电 — 已接听';
    }
  }, [familyData.caller, callerIcon]);

  const resultDetail = useMemo(() => {
    if (familyData.caller === 'child') {
      return '这通电话不会影响机构指标，但会在院长自己的心里留下些什么。';
    }
    return '这通电话不会影响机构指标。他望了一眼窗外，夜色又沉了一层。';
  }, [familyData.caller]);

  return (
    <PhoneDialogPanel
      callerName={`${callerIcon} ${callerName}`}
      callerRole={callerRole}
      dialogueLines={dialogueLines}
      choices={[]}
      resultTitle={resultTitle}
      resultDetail={resultDetail}
      resultButtonText="记录并挂断"
      onChoose={handleChoose}
      onContinue={onContinue}
      getVoiceSrc={getVoiceSrc}
      playVoice={playVoice}
      stopVoice={stopVoice}
      familyCaller={familyData.caller as 'child' | 'spouse'}
    />
  );
}

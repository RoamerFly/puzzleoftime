/* === 院长视角模块：电话对话面板 === */
import { useState, useCallback, useEffect, useRef } from 'react';
import type { PhoneDialogueLine } from '../data/eventData';
import {
  type WorkEventOption,
  type EventSeverity,
} from '../data/eventData';
import { INDICATORS } from '../data/balanceData';
import styles from '../styles/manager.module.css';

export type { PhoneDialogueLine } from '../data/eventData';

/* ======== 选择项（适配工作事件和家庭来电） ======== */
export interface PhoneChoiceItem {
  id: string;
  label: string;
  description: string;
  budgetCost?: number; // 工作事件有预算消耗
  shortTermEffect?: string;
  longTermCost?: string;
  effects?: Record<string, number>;
}

/* ======== Props ======== */
export interface PhoneDialogPanelProps {
  /** 来电人名称 */
  callerName: string;
  /** 来电人角色/身份 */
  callerRole?: string;
  /** 风险等级 (工作事件) — 保留字段参与逻辑但不展示 */
  riskLevel?: EventSeverity;
  /** 当前剩余预算 (工作事件) */
  remainingBudget?: number;
  /** 当前指标 (工作事件) */
  indicators?: Record<string, number>;
  /** 对话内容行 */
  dialogueLines: PhoneDialogueLine[];
  /** 可选的处理方案 (仅有选项时显示) */
  choices?: PhoneChoiceItem[];
  /** 选择后的反馈文案 */
  resultTitle?: string;
  resultDetail?: string;
  /** 结果阶段按钮文案，默认"记录并挂断" */
  resultButtonText?: string;
  /** 工作事件序号 */
  eventNumber?: number;
  totalEvents?: number;
  /** 回调 */
  onChoose: (choiceId: string) => void;
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
  /** 工作事件类型（用于配音映射） */
  eventType?: string | null;
  /** 家庭来电对象（用于配音映射） */
  familyCaller?: 'child' | 'spouse' | null;
}

/* ======== 内部阶段 ======== */
type DialogPhase = 'dialogue' | 'choices' | 'result';

/* ======== 打字机速度 (ms/字符) ======== */
const TYPEWRITER_SPEED_MS = 30;

/* ======== 默认回复文案 ======== */
function defaultReplyText(kind?: string): string {
  switch (kind) {
    case 'narration':
      return '我明白了';
    case 'manager':
      return '好的';
    default:
      return '你继续说';
  }
}

/* ======== 工具：检测是否关闭动效 ======== */
function usePrefersReducedMotion(): boolean {
  const [prefers, setPrefers] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setPrefers(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return prefers;
}

/* ======== 组件 ======== */
export function PhoneDialogPanel({
  callerName,
  callerRole,
  riskLevel: _riskLevel,
  remainingBudget,
  indicators: _indicators,
  dialogueLines,
  choices,
  resultTitle,
  resultDetail,
  resultButtonText,
  eventNumber: _eventNumber,
  totalEvents: _totalEvents,
  onChoose,
  onContinue,
  getVoiceSrc,
  playVoice,
  stopVoice,
  eventType,
  familyCaller,
}: PhoneDialogPanelProps) {
  const [lineIndex, setLineIndex] = useState(0);
  const [phase, setPhase] = useState<DialogPhase>('dialogue');
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);

  /* ======== 打字机状态 ======== */
  const [displayedText, setDisplayedText] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  /* ======== 语音播放状态 ======== */
  const currentVoiceAudioRef = useRef<HTMLAudioElement | null>(null);

  const currentLine = dialogueLines[lineIndex] ?? null;
  const hasMoreLines = lineIndex < dialogueLines.length - 1;
  const isLastLine = lineIndex === dialogueLines.length - 1;
  const hasChoices = choices && choices.length > 0;

  /* 清理 timer */
  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /* 停止当前语音 */
  const stopCurrentVoice = useCallback(() => {
    if (currentVoiceAudioRef.current) {
      currentVoiceAudioRef.current.pause();
      currentVoiceAudioRef.current.currentTime = 0;
      currentVoiceAudioRef.current = null;
    }
    stopVoice?.();
  }, [stopVoice]);

  /* 启动打字机 */
  const startTypewriter = useCallback(
    (text: string) => {
      clearTimer();
      setDisplayedText('');

      // 关闭动效时直接显示完整文本
      if (prefersReducedMotion) {
        setDisplayedText(text);
        return;
      }

      let pos = 0;
      const fullLen = text.length;
      timerRef.current = setInterval(() => {
        pos += 1;
        if (pos >= fullLen) {
          setDisplayedText(fullLen === 0 ? '' : text);
          clearTimer();
        } else {
          setDisplayedText(text.slice(0, pos));
        }
      }, TYPEWRITER_SPEED_MS);
    },
    [clearTimer, prefersReducedMotion],
  );

  /* 当前行变化时启动打字机 + 播放配音 */
  useEffect(() => {
    if (phase === 'dialogue' && currentLine) {
      startTypewriter(currentLine.text);

      // 停止上一句语音
      stopCurrentVoice();

      // 播放当前句配音
      if (getVoiceSrc && playVoice && currentLine.kind) {
        const voiceSrc = getVoiceSrc(
          lineIndex,
          currentLine.kind,
          eventType ?? null,
          familyCaller ?? null,
        );
        if (voiceSrc) {
          try {
            const audio = playVoice(voiceSrc);
            if (audio) {
              currentVoiceAudioRef.current = audio;
            }
          } catch {
            // 配音播放失败，静默处理
            console.warn('[ManagerAudio] Failed to play voice for line', lineIndex);
          }
        }
      }
    }
    return () => {
      clearTimer();
    };
  }, [lineIndex, phase, currentLine, startTypewriter, clearTimer, stopCurrentVoice, getVoiceSrc, playVoice, eventType, familyCaller]);

  /* 是否正在打字 */
  const isTyping =
    !prefersReducedMotion &&
    displayedText !== (currentLine?.text ?? '');

  /* ======== 点击对话区域：跳过打字 ======== */
  const handleDialogueAreaClick = useCallback(() => {
    if (isTyping && currentLine) {
      clearTimer();
      setDisplayedText(currentLine.text);
    }
  }, [isTyping, clearTimer, currentLine]);

  /* ======== 点击院长回应按钮 ======== */
  const handleReplyClick = useCallback(() => {
    // 如果还在打字，先跳过
    if (isTyping && currentLine) {
      clearTimer();
      setDisplayedText(currentLine.text);
      return;
    }

    if (hasMoreLines) {
      setLineIndex(prev => prev + 1);
    } else if (isLastLine) {
      // 对话结束 → 停止语音 → 进入选择阶段
      stopCurrentVoice();
      if (hasChoices) {
        setPhase('choices');
      } else {
        setPhase('result');
      }
    }
  }, [isTyping, clearTimer, currentLine, hasMoreLines, isLastLine, hasChoices, stopCurrentVoice]);

  /* 辅助 */
  const indicatorMap = useCallback((key: string): string => {
    const ind = INDICATORS.find(i => i.id === key);
    return ind ? `${ind.icon} ${ind.name}` : key;
  }, []);

  /* 选择处理方案 */
  const handleSelectChoice = (choiceId: string) => {
    if (phase !== 'choices') return;
    setSelectedChoiceId(choiceId);
    onChoose(choiceId);
    setPhase('result');
  };

  /* 点击结果反馈中的继续 */
  const handleResultContinue = () => {
    stopCurrentVoice();
    onContinue();
  };

  /* 计算当前回复按钮文案 */
  const replyButtonText = (() => {
    if (currentLine?.replyText) return currentLine.replyText;
    if (isLastLine && hasChoices) return '查看处理方案';
    return defaultReplyText(currentLine?.kind);
  })();

  /* === 对话阶段 === */
  if (phase === 'dialogue' && currentLine) {
    const isNarration = currentLine.kind === 'narration';
    const isCaller = currentLine.kind === 'caller';
    const hasRole = !!(currentLine.role || callerRole);

    return (
      <div className={styles.phoneDialogueOverlay}>
        <div className={styles.phoneDialogueBackdrop} />
        <div className={styles.phoneDialogueStage}>
          {/* 暖色标题栏：仅显示来电人/旁白信息，不含风险标签 */}
          <div className={styles.phoneDialogueHeader}>
            <div className={styles.phoneCallerInfo}>
              {isCaller && (
                <>
                  <span className={styles.phoneCallerName}>{currentLine.speaker}</span>
                  {hasRole && (
                    <span className={styles.phoneCallerRole}>
                      {currentLine.role || callerRole}
                    </span>
                  )}
                </>
              )}
              {isNarration && (
                <span className={styles.phoneCallerName}>旁白</span>
              )}
              {!isCaller && !isNarration && (
                <>
                  <span className={styles.phoneCallerName}>{callerName}</span>
                  {hasRole && (
                    <span className={styles.phoneCallerRole}>
                      {currentLine.role || callerRole}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 对话主体 */}
          <div
            className={styles.phoneDialogueBox}
            onClick={handleDialogueAreaClick}
            role="button"
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') handleDialogueAreaClick();
            }}
            aria-label={isTyping ? '点击显示完整文本' : '当前对话内容'}
          >
            {/* 来电人/旁白标签 */}
            {isCaller && (
              <div className={styles.phoneSpeakerLabel}>
                来电：{currentLine.speaker}
              </div>
            )}
            {isNarration && (
              <div className={styles.phoneSpeakerLabelNarration}>
                旁白
              </div>
            )}
            <p
              className={
                isNarration
                  ? styles.phoneNarrationText
                  : styles.phoneDialogueText
              }
            >
              {displayedText}
              {isTyping && <span className={styles.phoneTypewriterCursor}>|</span>}
            </p>
          </div>

          {/* 操作区：院长回应按钮 */}
          <div className={styles.phoneDialogueActions}>
            <button
              className={styles.phoneReplyButton}
              onClick={handleReplyClick}
            >
              {isTyping ? '...' : replyButtonText}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* === 选择阶段 === */
  if (phase === 'choices' && choices && choices.length > 0) {
    const choiceItems: PhoneChoiceItem[] = choices;

    return (
      <div className={styles.phoneDialogueOverlay}>
        <div className={styles.phoneDialogueBackdrop} />
        <div className={styles.phoneDialogueStage}>
          {/* 选择阶段轻量头部 */}
          <div className={styles.phoneDialogueHeader}>
            <div className={styles.phoneCallerInfo}>
              <span className={styles.phoneCallerName}>{callerName}</span>
            </div>
          </div>

          {/* 选择提示 */}
          <div className={styles.phoneDialogueBox}>
            <p className={styles.phoneChoicePrompt}>请选择处理方式：</p>

            {remainingBudget !== undefined && (
              <p className={styles.phoneChoiceBudget}>
                当前剩余预算：<strong>{remainingBudget}</strong> 分
              </p>
            )}

            <div className={styles.phoneChoiceList}>
              {choiceItems.map(item => {
                const insufficient =
                  remainingBudget !== undefined &&
                  item.budgetCost !== undefined &&
                  remainingBudget < item.budgetCost;
                return (
                  <button
                    key={item.id}
                    className={`${styles.phoneChoiceCard} ${insufficient ? styles.phoneChoiceDisabled : ''}`}
                    onClick={() => !insufficient && handleSelectChoice(item.id)}
                    disabled={insufficient}
                  >
                    <div className={styles.phoneChoiceHeader}>
                      <h4 className={styles.phoneChoiceTitle}>{item.label}</h4>
                      {item.budgetCost !== undefined && (
                        <span className={styles.phoneChoiceCost}>
                          {item.budgetCost > 0
                            ? `消耗 ${item.budgetCost} 分`
                            : '不消耗预算'}
                        </span>
                      )}
                    </div>
                    <p className={styles.phoneChoiceDesc}>{item.description}</p>

                    {/* 工作事件详情 */}
                    {item.shortTermEffect && (
                      <div className={styles.phoneChoiceEffects}>
                        <div className={styles.phoneChoiceEffectRow}>
                          <span className={styles.phoneChoiceEffectLabel}>短期效果：</span>
                          <span className={styles.phoneChoiceEffectText}>
                            {item.shortTermEffect}
                          </span>
                        </div>
                        {item.longTermCost && (
                          <div className={styles.phoneChoiceEffectRow}>
                            <span className={styles.phoneChoiceEffectLabel}>长期代价：</span>
                            <span className={styles.phoneChoiceEffectText}>
                              {item.longTermCost}
                            </span>
                          </div>
                        )}
                        {item.effects && Object.keys(item.effects).length > 0 && (
                          <div className={styles.phoneChoiceEffectRow}>
                            <span className={styles.phoneChoiceEffectLabel}>指标影响：</span>
                            <span className={styles.phoneChoiceEffectDeltas}>
                              {Object.entries(item.effects).map(([key, delta]) => (
                                <span
                                  key={key}
                                  className={delta > 0 ? styles.deltaUp : delta < 0 ? styles.deltaDown : ''}
                                >
                                  {indicatorMap(key)} {delta > 0 ? '+' : ''}{delta}
                                </span>
                              ))}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {insufficient && (
                      <div className={styles.phoneChoiceWarning}>
                        当前剩余预算不足。可在稍后的临时调整阶段重新筹措，但撤销已承诺事项将带来信誉风险。
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* === 结果反馈阶段 === */
  if (phase === 'result') {
    return (
      <div className={styles.phoneDialogueOverlay}>
        <div className={styles.phoneDialogueBackdrop} />
        <div className={styles.phoneDialogueStage}>
          {/* 结果标题栏 — 与电话对话框一致的暖色风格 */}
          <div className={styles.phoneDialogueHeader}>
            <div className={styles.phoneCallerInfo}>
              <span className={styles.phoneCallerName}>通话记录</span>
            </div>
          </div>
          <div className={`${styles.phoneDialogueBox} ${styles.phoneResultBox}`}>
            <div className={styles.phoneResultIcon}>📋</div>
            <h3 className={styles.phoneResultTitle}>
              {resultTitle || '已处理'}
            </h3>
            {resultDetail && (
              <p className={styles.phoneResultText}>{resultDetail}</p>
            )}
            {!resultDetail && selectedChoiceId && (
              <p className={styles.phoneResultText}>
                已记录处理方案。请继续。
              </p>
            )}
            <button
              className={styles.phoneContinueButton}
              onClick={handleResultContinue}
            >
              {resultButtonText || '记录并挂断'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* 空状态（不应出现） */
  return null;
}

/* ======== 工具：WorkEventOption → PhoneChoiceItem ======== */
export function optionToChoiceItem(option: WorkEventOption): PhoneChoiceItem {
  return {
    id: option.id,
    label: option.label,
    description: option.description,
    budgetCost: option.budgetCost,
    shortTermEffect: option.shortTermEffect,
    longTermCost: option.longTermCost,
    effects: option.effects,
  };
}

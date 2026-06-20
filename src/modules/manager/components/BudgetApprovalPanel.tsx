import { useState, useCallback, useMemo, useRef } from 'react';
import {
  INDICATORS,
  BUDGET_CHOICES,
  TOTAL_BUDGET,
  type BudgetChoice,
  type FeedbackEvent,
  pickFeedbackEvents,
} from '../data/balanceData';
import type { ReputationRisk } from '../data/managerState';
import type { WorkEvent } from '../data/eventData';
import styles from '../styles/manager.module.css';

/* === 天平倾斜计算 === */
const CARE_QUALITY_KEYS = ['safety', 'dignity', 'family'] as const;
const OP_PRESSURE_KEYS = ['cost', 'staff'] as const;

function calculateTilt(indicators: Record<string, number>): number {
  const careSum = CARE_QUALITY_KEYS.reduce((s, k) => s + (indicators[k] ?? 0), 0);
  const opSum = OP_PRESSURE_KEYS.reduce((s, k) => s + (indicators[k] ?? 0), 0);
  const diff = careSum - opSum;
  return Math.max(-12, Math.min(12, diff * 0.05));
}

/* === 决策总结生成 === */
interface SummaryResult {
  priority: string[];
  sacrificed: string[];
  conclusion: string;
}

function generateSummary(
  selectedIds: string[],
  indicators: Record<string, number>,
  remainingBudget: number,
): SummaryResult {
  const highIndicators = INDICATORS
    .filter(ind => (indicators[ind.id] ?? 0) >= 65)
    .map(ind => ind.name);
  const lowIndicators = INDICATORS
    .filter(ind => (indicators[ind.id] ?? 0) <= 40)
    .map(ind => ind.name);
  const totalSpent = TOTAL_BUDGET - remainingBudget;

  let conclusion: string;
  if (selectedIds.length === 0) {
    conclusion = '你选择了不做任何投入。有时不选择本身也是一种选择——但问题并不会因此消失。';
  } else if (lowIndicators.length >= 2 && highIndicators.length >= 2) {
    conclusion = `你用 ${totalSpent} 分预算做出了艰难平衡。${lowIndicators.join('、')}的问题仍悬而未决，但${highIndicators.join('、')}得到了部分的保障。这就是院长的日常：没有完美答案，只有诚实的取舍。`;
  } else if (highIndicators.length >= 3) {
    conclusion = `你将有限资源集中投入到照护质量，${highIndicators.slice(0, 3).join('、')}有所改善。代价是其他方面承受了压力。你选择了"以人为本"。`;
  } else {
    conclusion = `你用 ${totalSpent} 分预算做出了自己的选择。有的指标上升，有的下降。在公共养老资源有限的现实里，每一位院长每天都在做这样的权衡。`;
  }

  return {
    priority: highIndicators.length > 0 ? highIndicators : ['未明确'],
    sacrificed: lowIndicators.length > 0 ? lowIndicators : ['各项相对均衡'],
    conclusion,
  };
}

/** 撤销已承诺项的反馈文案 */
function getRevokeNarrative(choiceId: string): string {
  const map: Record<string, string> = {
    c1: '"上次检查说好的整改，怎么又取消了？"',
    c3: '"之前说会改善老人生活，怎么又没了？"',
    c2: '"说好的增援又没了，大家真的撑不住了。"',
    c4: '"家属沟通好不容易建立起来，又要回到原点吗？"',
    c5: '"安全整改和物资补充说停就停，检查来了怎么办？"',
    c6: '"账面压力轻了一点，但这真的能撑到下次检查吗？"',
  };
  return map[choiceId] ?? '"撤销承诺从来不是一件轻松的事。"';
}

/* ==================== 主组件 ==================== */

interface BudgetApprovalPanelProps {
  selectedChoices: string[];
  remainingBudget: number;
  indicators: Record<string, number>;
  canSubmit: boolean;
  submitBlockedReason: string;
  onChoiceToggle: (choice: BudgetChoice) => void;
  onConfirm: () => void;
  /** 预算审批模式 */
  mode?: 'first' | 'adjustment';
  /** 调整模式专用 */
  committedChoiceIds?: string[];
  adjustmentRemaining?: number;
  reputationRisk?: ReputationRisk;
  activeWorkEvents?: WorkEvent[];
  suggestedChoiceIds?: string[];
  /** 第二轮撤销+新增回调（返回新的信誉风险级别） */
  onRevoke?: (choiceId: string) => ReputationRisk;
  onAddInAdjustment?: (choice: BudgetChoice) => void;
  /** 音频：播放音效 */
  playSfx?: (sfxKey: 'uiClick' | 'uiConfirm' | 'uiError' | 'notification' | 'reportGenerate' | 'computerPowerOn' | 'phoneRing' | 'phonePickup' | 'phoneHangup' | 'phoneDialing' | 'phoneConnected') => void;
}

export function BudgetApprovalPanel({
  selectedChoices,
  remainingBudget,
  indicators,
  canSubmit,
  submitBlockedReason,
  onChoiceToggle,
  onConfirm,
  mode = 'first',
  committedChoiceIds = [],
  adjustmentRemaining = 0,
  reputationRisk = 'low',
  activeWorkEvents = [],
  suggestedChoiceIds = [],
  onRevoke,
  onAddInAdjustment,
  playSfx,
}: BudgetApprovalPanelProps) {
  type PanelPhase = 'select' | 'feedback' | 'summary';
  const [panelPhase, setPanelPhase] = useState<PanelPhase>('select');
  const [lastNarrative, setLastNarrative] = useState('');
  const [budgetWarning, setBudgetWarning] = useState('');
  const [revokeWarning, setRevokeWarning] = useState('');
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAdjustment = mode === 'adjustment';

  const sortedChoices = useMemo(() => {
    return [...BUDGET_CHOICES].sort((a, b) => {
      if (a.cost <= 0 && b.cost > 0) return 1;
      if (b.cost <= 0 && a.cost > 0) return -1;
      return a.cost - b.cost;
    });
  }, []);

  const showBudgetWarning = useCallback((msg: string) => {
    if (warningTimer.current) clearTimeout(warningTimer.current);
    setBudgetWarning(msg);
    playSfx?.('uiError');
    warningTimer.current = setTimeout(() => setBudgetWarning(''), 2800);
  }, [playSfx]);

  const handleChoice = useCallback((choice: BudgetChoice) => {
    if (choice.locked) return;
    const isSelected = selectedChoices.includes(choice.id);

    if (isSelected) {
      // 取消选择
      if (isAdjustment) {
        const isCommitted = committedChoiceIds.includes(choice.id);
        if (isCommitted) {
          // 撤销已承诺项
          if (adjustmentRemaining <= 0) {
            showBudgetWarning('调整次数已用完，不能撤销已承诺事项。');
            return;
          }
          if (onRevoke) {
            onRevoke(choice.id);
            setRevokeWarning(getRevokeNarrative(choice.id));
            setTimeout(() => setRevokeWarning(''), 3500);
          }
        }
      }
      setLastNarrative('');
      onChoiceToggle(choice);
      return;
    }

    // 新增选择
    if (isAdjustment && onAddInAdjustment) {
      if (adjustmentRemaining <= 0) {
        showBudgetWarning('调整次数已用完，请直接提交最终方案。');
        return;
      }
    }

    if (remainingBudget < choice.cost && choice.cost > 0) {
      showBudgetWarning(
        `预算不足！"${choice.title}"需要 ${choice.cost} 分，当前剩余 ${remainingBudget} 分`,
      );
      return;
    }
    setLastNarrative(choice.narrative);
    if (isAdjustment && onAddInAdjustment) {
      onAddInAdjustment(choice);
    } else {
      onChoiceToggle(choice);
    }
  }, [selectedChoices, remainingBudget, onChoiceToggle, showBudgetWarning, isAdjustment, committedChoiceIds, adjustmentRemaining, onRevoke, onAddInAdjustment]);

  const handleSubmit = useCallback(() => {
    if (isAdjustment) {
      playSfx?.('uiConfirm');
      onConfirm();
    } else {
      playSfx?.('uiConfirm');
      setPanelPhase('feedback');
    }
  }, [isAdjustment, onConfirm, playSfx]);

  const handleViewSummary = useCallback(() => {
    playSfx?.('uiClick');
    setPanelPhase('summary');
  }, [playSfx]);

  const handleBackToSelect = useCallback(() => {
    if (isAdjustment) return;
    setPanelPhase('select');
  }, [isAdjustment]);

  /* === 派生值 === */
  const tilt = calculateTilt(indicators);
  const summary = useMemo(
    () => generateSummary(selectedChoices, indicators, remainingBudget),
    [selectedChoices, indicators, remainingBudget],
  );
  const feedbackEvents: FeedbackEvent[] = useMemo(
    () => pickFeedbackEvents(indicators, selectedChoices),
    [indicators, selectedChoices],
  );

  const toneClass = (tone: FeedbackEvent['tone']) => {
    if (tone === 'positive') return styles.feedbackPositive;
    if (tone === 'warning') return styles.feedbackWarning;
    return styles.feedbackMixed;
  };
  const toneIcon = (tone: FeedbackEvent['tone']) => {
    if (tone === 'positive') return '✅';
    if (tone === 'warning') return '⚠️';
    return '🔔';
  };

  const getIndicatorColor = (value: number): string => {
    if (value >= 70) return 'var(--color-success)';
    if (value <= 30) return 'var(--color-danger)';
    return 'var(--color-accent-warm)';
  };

  /* === 反馈阶段（仅第一轮） === */
  if (panelPhase === 'feedback' && !isAdjustment) {
    return (
      <div className={styles.budgetPanel}>
        <div className={styles.feedbackSection}>
          <h2 className={styles.summaryTitle}>📬 各方反馈</h2>
          <p className={styles.feedbackIntro}>
            预算已提交。你的选择在机构的各个角落引发了回响——
          </p>
          <div className={styles.feedbackList}>
            {feedbackEvents.map((event) => (
              <div
                key={event.id}
                className={`${styles.feedbackCard} ${toneClass(event.tone)}`}
              >
                <div className={styles.feedbackHeader}>
                  <span className={`${styles.feedbackSource} ${toneClass(event.tone)}`}>
                    {event.source}反馈
                  </span>
                  <span className={styles.feedbackToneBadge}>
                    {toneIcon(event.tone)}
                  </span>
                </div>
                <h4 className={styles.feedbackTitle}>{event.title}</h4>
                <p className={styles.feedbackDesc}>{event.description}</p>
              </div>
            ))}
          </div>
          <div className={styles.feedbackActions}>
            <button className={styles.feedbackBackBtn} onClick={handleBackToSelect}>
              ↩ 返回调整方案
            </button>
            <button className={styles.summaryConfirmBtn} onClick={handleViewSummary}>
              📋 查看院长决策总结
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* === 总结阶段（仅第一轮） === */
  if (panelPhase === 'summary' && !isAdjustment) {
    return (
      <div className={styles.budgetPanel}>
        <div className={styles.summaryPanel}>
          <h2 className={styles.summaryTitle}>📋 院长决策总结</h2>

          <div className={styles.summarySection}>
            <p className={styles.summaryLabel}>已使用预算</p>
            <p className={styles.summaryValue}>
              {TOTAL_BUDGET - remainingBudget}/{TOTAL_BUDGET} 分
            </p>
          </div>

          <div className={styles.summarySection}>
            <p className={styles.summaryLabel}>你的投入</p>
            <ul className={styles.summaryList}>
              {BUDGET_CHOICES
                .filter(c => selectedChoices.includes(c.id))
                .map(c => (
                  <li key={c.id}>{c.title}（{c.cost > 0 ? `${c.cost}分` : `省${Math.abs(c.cost)}分`}）</li>
                ))}
              {selectedChoices.length === 0 && (
                <li className={styles.summaryEmpty}>未做任何投入</li>
              )}
            </ul>
          </div>

          <div className={styles.summarySection}>
            <p className={styles.summaryLabel}>你优先保障了</p>
            <p className={styles.summaryHighlight}>{summary.priority.join('、')}</p>
          </div>

          <div className={styles.summarySection}>
            <p className={styles.summaryLabel}>不得已牺牲了</p>
            <p className={styles.summaryDim}>{summary.sacrificed.join('、')}</p>
          </div>

          <div className={styles.summarySection}>
            <p className={styles.summaryConclusion}>{summary.conclusion}</p>
          </div>

          <button className={styles.summaryConfirmBtn} onClick={onConfirm}>
            确认，继续前行
          </button>
        </div>
      </div>
    );
  }

  /* === 选择阶段 === */
  return (
    <div className={styles.budgetPanel}>
      {/* 调整模式：顶部提示条 */}
      {isAdjustment && (
        <div className={styles.adjustmentHeader}>
          <div className={styles.adjustmentInfoRow}>
            <span className={styles.adjustmentLabel}>🔄 临时调整模式</span>
            <span className={styles.adjustmentCount}>
              剩余调整次数：<strong>{adjustmentRemaining}</strong> / 4
            </span>
          </div>
          <div className={styles.adjustmentInfoRow}>
            <span className={styles.adjustmentLabel}>信誉风险</span>
            <span className={`${styles.adjustmentRisk} ${reputationRisk === 'high' ? styles.riskHigh : reputationRisk === 'medium' ? styles.riskMedium : styles.riskLow}`}>
              {reputationRisk === 'low' ? '低' : reputationRisk === 'medium' ? '中' : '高'}
            </span>
          </div>
          {/* 突发事件压力摘要 */}
          {activeWorkEvents.length > 0 && (
            <div className={styles.adjustmentEventsSummary}>
              <p className={styles.adjustmentEventsHint}>
                ⚠️ 本轮突发事件对以下方面造成压力：
              </p>
              <div className={styles.adjustmentEventTags}>
                {activeWorkEvents.map((ev, i) => (
                  <span key={i} className={styles.adjustmentEventTag}>
                    {ev.title}
                  </span>
                ))}
              </div>
            </div>
          )}
          {/* 相关建议高亮 */}
          {suggestedChoiceIds.length > 0 && (
            <div className={styles.adjustmentSuggestions}>
              <p className={styles.adjustmentSuggestHint}>
                💡 以下事项与当前事件相关，但并不代表唯一正确方案。
              </p>
              <div className={styles.adjustmentSuggestList}>
                {suggestedChoiceIds.map(cid => {
                  const choice = BUDGET_CHOICES.find(c => c.id === cid);
                  return choice ? (
                    <span key={cid} className={styles.adjustmentSuggestTag}>
                      {choice.title}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 撤销警告 */}
      {revokeWarning && (
        <div className={styles.revokeWarning} role="alert">
          {revokeWarning}
        </div>
      )}
      {/* 天平可视化 */}
      <div className={styles.balanceSection}>
        <div className={styles.tiltHint}>
          <span className={styles.tiltLabelLeft}>照护质量</span>
          <span className={styles.tiltLabelRight}>运营压力</span>
        </div>
        <div className={styles.balanceScale}>
          <svg viewBox="0 0 260 160" className={styles.scaleSvg}>
            <rect x="120" y="75" width="20" height="8" rx="2" fill="var(--color-accent-warm)" opacity="0.5" />
            <polygon points="125,75 135,75 130,85" fill="var(--color-accent-warm)" />
            <line
              x1="20" y1="70" x2="240" y2="70"
              stroke="var(--color-text-secondary)" strokeWidth="3"
              strokeLinecap="round"
              transform={`rotate(${tilt}, 130, 75)`}
              className={styles.scaleBeam}
            />
            <ellipse cx="40" cy="50" rx="30" ry="12"
              fill="rgba(107, 142, 78, 0.18)" stroke="var(--color-success)" strokeWidth="2"
            />
            <text x="40" y="48" textAnchor="middle" fontSize="8" fill="var(--color-success)" fontWeight="600">▲</text>
            <ellipse cx="220" cy="50" rx="30" ry="12"
              fill="rgba(181, 101, 90, 0.18)" stroke="var(--color-danger)" strokeWidth="2"
            />
            <text x="220" y="48" textAnchor="middle" fontSize="8" fill="var(--color-danger)" fontWeight="600">▲</text>
            <line x1="25" y1="52" x2="40" y2="55" stroke="var(--color-border)" strokeWidth="1" opacity="0.6" />
            <line x1="55" y1="52" x2="40" y2="55" stroke="var(--color-border)" strokeWidth="1" opacity="0.6" />
            <line x1="205" y1="52" x2="220" y2="55" stroke="var(--color-border)" strokeWidth="1" opacity="0.6" />
            <line x1="235" y1="52" x2="220" y2="55" stroke="var(--color-border)" strokeWidth="1" opacity="0.6" />
          </svg>
        </div>
        <p className={styles.scaleHint}>
          {tilt > 1 ? '天平倾向照护质量' : tilt < -1 ? '天平倾向运营压力' : '天平在尽力维持平衡'}
        </p>
      </div>

      {/* 剩余预算 */}
      <div className={styles.budgetBar}>
        <span className={styles.budgetLabel}>💰 剩余预算</span>
        <div className={styles.budgetTrack}>
          <div
            className={styles.budgetFill}
            style={{ width: `${(remainingBudget / TOTAL_BUDGET) * 100}%` }}
          />
        </div>
        <span className={styles.budgetText}>{remainingBudget}/{TOTAL_BUDGET}</span>
      </div>

      {/* 预算不足提示 */}
      {budgetWarning && (
        <div className={styles.budgetWarning} role="alert">
          {budgetWarning}
        </div>
      )}

      {/* 五项指标 */}
      <div className={styles.indicators}>
        <h3 className={styles.sectionTitle}>照护指标</h3>
        {INDICATORS.map(ind => {
          const val = indicators[ind.id] ?? ind.initialValue;
          const initVal = ind.initialValue;
          const delta = val - initVal;
          return (
            <div key={ind.id} className={styles.indicator}>
              <div className={styles.indicatorHeader}>
                <span className={styles.indicatorIcon}>{ind.icon}</span>
                <span className={styles.indicatorName}>{ind.name}</span>
                <span className={styles.indicatorValue} style={{ color: getIndicatorColor(val) }}>
                  {val}
                  {delta !== 0 && (
                    <span className={delta > 0 ? styles.deltaUp : styles.deltaDown}>
                      {delta > 0 ? `+${delta}` : delta}
                    </span>
                  )}
                </span>
              </div>
              <div className={styles.indicatorTrack}>
                <div
                  className={styles.indicatorFill}
                  style={{
                    width: `${val}%`,
                    backgroundColor: getIndicatorColor(val),
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 旁白 */}
      {lastNarrative && (
        <div className={styles.narrativeBubble}>
          <p className={styles.narrativeText}>{lastNarrative}</p>
        </div>
      )}

      {/* 预算投入选项 */}
      <div className={styles.choices}>
        <h3 className={styles.sectionTitle}>
          {isAdjustment ? '当前方案（点击已选项取消，点击未选项新增）' : '选择投入方向（点击选中，再次点击取消）'}
        </h3>
        {selectedChoices.length > 0 && (
          <p className={styles.choicesHint}>
            已选 {selectedChoices.length} 项，剩余预算 {remainingBudget} 分
          </p>
        )}
        <div className={styles.choicesGrid}>
          {sortedChoices.map(choice => {
            const isSelected = selectedChoices.includes(choice.id);
            const isCommitted = committedChoiceIds.includes(choice.id);
            const isSuggested = suggestedChoiceIds.includes(choice.id);
            const isInsufficient = !isSelected && remainingBudget < choice.cost && choice.cost > 0;
            const isLocked = choice.locked ?? false;

            let cardClass = styles.choiceCard;
            if (isSelected) cardClass += ` ${styles.selected}`;
            if (isCommitted && isSelected) cardClass += ` ${styles.choiceCommitted}`;
            if (isSuggested && !isSelected) cardClass += ` ${styles.choiceSuggested}`;
            if (isInsufficient) cardClass += ` ${styles.insufficient}`;
            if (isLocked) cardClass += ` ${styles.choiceLocked}`;

            return (
              <button
                key={choice.id}
                className={cardClass}
                onClick={() => handleChoice(choice)}
                disabled={isInsufficient || isLocked}
                title={
                  isLocked
                    ? choice.lockedReason
                    : isInsufficient
                      ? `预算不足：需要${choice.cost}分`
                      : undefined
                }
              >
                <div className={styles.choiceHeader}>
                  <h4 className={styles.choiceTitle}>
                    {isSelected ? '✅ ' : ''}{choice.title}
                  </h4>
                  {isSelected && isCommitted && (
                    <span className={styles.committedBadge}>已承诺</span>
                  )}
                  {isSelected && !isCommitted && (
                    <span className={styles.undoBadge}>点击取消</span>
                  )}
                  {isSelected && isCommitted && isAdjustment && (
                    <span className={styles.revokeRiskBadge}>撤销有信誉风险</span>
                  )}
                  {isSuggested && !isSelected && (
                    <span className={styles.suggestedBadge}>相关建议</span>
                  )}
                  {isInsufficient && (
                    <span className={styles.insufficientBadge}>预算不足</span>
                  )}
                  {isLocked && (
                    <span className={styles.lockedBadge}>暂不可选</span>
                  )}
                </div>
                <p className={styles.choiceDesc}>{choice.description}</p>
                {!isLocked && (
                  <span className={`${styles.choiceCost} ${choice.cost <= 0 ? styles.saving : ''}`}>
                    {choice.cost > 0 ? `💰 花费 ${choice.cost} 分` : `📉 节省 ${Math.abs(choice.cost)} 分`}
                  </span>
                )}
                {isLocked && choice.lockedReason && (
                  <span className={styles.lockedReason}>{choice.lockedReason}</span>
                )}
                {!isSelected && !isLocked && (
                  <div className={styles.effectsPreview}>
                    {Object.entries(choice.effects).map(([key, delta]) => {
                      const ind = INDICATORS.find(i => i.id === key);
                      if (!ind) return null;
                      if (delta === 0) return null;
                      return (
                        <span
                          key={key}
                          className={delta > 0 ? styles.effectUp : styles.effectDown}
                        >
                          {ind.icon} {delta > 0 ? '+' : ''}{delta}
                        </span>
                      );
                    })}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 提交区域 */}
      <div className={styles.actions}>
        {!canSubmit && !isAdjustment && (
          <div className={styles.submitBlocked}>
            <p className={styles.submitBlockedText}>{submitBlockedReason}</p>
          </div>
        )}
        {isAdjustment && adjustmentRemaining > 0 && selectedChoices.length > 0 && (
          <p className={styles.adjustmentHint}>
            你还可以调整 {adjustmentRemaining} 次。可以撤销已承诺项或新增项目，也可以直接提交最终方案。
          </p>
        )}
        {isAdjustment && adjustmentRemaining === 0 && (
          <p className={styles.adjustmentExhausted}>
            调整次数已用完。请提交最终方案或直接提交。
          </p>
        )}
        {canSubmit && selectedChoices.length > 0 && (
          <button className={styles.submitBtn} onClick={handleSubmit}>
            {isAdjustment ? '📋 提交最终方案' : '提交预算方案'}
          </button>
        )}
        {selectedChoices.length === 0 && (
          <div className={styles.emptySubmitSection}>
            <p className={styles.emptySubmitWarning}>
              ⚠️ 这意味着本月不批准任何新增投入，风险将由现有人员和老人共同承担。
            </p>
            <button
              className={styles.submitBtn}
              onClick={handleSubmit}
            >
              {isAdjustment ? '提交空缺最终方案' : '提交空缺方案'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

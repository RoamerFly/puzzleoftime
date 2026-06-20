/**
 * === UnifiedCareScene · 统一场景交互组件（Batch 6 改写） ===
 *
 * v5: 行动点始终可见（小圆点），不再依赖高理解门槛。
 *     行动卡只在点击后出现，关闭不留状态。
 *
 * 内部阶段：idle | clue_feedback | clue_bubble | action_card
 * - clue_feedback: ClueFeedbackOverlay 播放（微动画/特写/高亮）→ 气泡
 * - clue_bubble: 直接气泡（无反馈素材时）
 * - action_card: 行动预览卡（点击行为后显示）
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { UnifiedCareEventScene, ObserveHotspot, InterventionHotspot } from '../../data/unifiedSceneData';
import { caregiverAssets, getClueDetailImage } from '../../assets/assets';
import type { CaregiverAssetEntry } from '../../assets/assets';
import { resolveInsightLevel } from '../../logic/insightRules';
import { getClueByClueId } from '../../data/clueRegistry';
import { SceneHotspotLayer } from './SceneHotspotLayer';
import { getClueState } from './clueState';
import { ClueBubble } from './ClueBubble';
import { ClueFeedbackOverlay } from './ClueFeedbackOverlay';
import { HandoverNotebook } from './HandoverNotebook';
import { OutcomeImagePanel } from './OutcomeImagePanel';
import { SceneFxLayer } from './SceneFxLayer';
import { ActionPreviewCard } from './ActionPreviewCard';
import { ActionTargetGuide } from './ActionTargetGuide';
import styles from './UnifiedCareScene.module.css';

// ============================================================
// 交互阶段（v5: 移除 action_confirm / action_animating）
// ============================================================

type InteractionPhase =
  | 'idle'
  | 'clue_feedback'
  | 'clue_bubble'
  | 'action_card';

// ============================================================
// Props
// ============================================================

export interface UnifiedCareSceneProps {
  scene: UnifiedCareEventScene;
  mode: 'observe' | 'outcome';
  recordedClueIds: string[];
  consequence?: 'success' | 'partial' | 'failure';
  /** Batch 5: 三级结果旁白文本（由父组件按 insightLevel 预选） */
  outcomeFeedback?: string;
  onCluePeek: (clueId: string) => void;
  onClueRecord: (clueId: string) => void;
  onInterventionSelect: (hotspot: InterventionHotspot) => void;
  onOutcomeContinue: () => void;
}

// ============================================================
// 组件
// ============================================================

export function UnifiedCareScene({
  scene,
  mode,
  recordedClueIds,
  consequence,
  outcomeFeedback,
  onCluePeek,
  onClueRecord,
  onInterventionSelect,
  onOutcomeContinue,
}: UnifiedCareSceneProps) {
  const [phase, setPhase] = useState<InteractionPhase>('idle');
  const [activeClueId, setActiveClueId] = useState<string | null>(null);
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [openIntervention, setOpenIntervention] = useState<InterventionHotspot | null>(null);
  const [hoveredIntervention, setHoveredIntervention] = useState<InterventionHotspot | null>(null);
  const [animatingHotspot, setAnimatingHotspot] = useState<ObserveHotspot | null>(null);

  // ── SFX: 干预卡片出现（仅一次） ──
  const cardsSfxRef = useRef(false);
  useEffect(() => {
    if (openIntervention && !cardsSfxRef.current) {
      cardsSfxRef.current = true;
      window.dispatchEvent(new CustomEvent('caregiver:click'));
    }
    if (!openIntervention) cardsSfxRef.current = false;
  }, [openIntervention]);

  // ── SFX: 结果CG进入（仅一次） ──
  const outcomeSfxRef = useRef(false);
  useEffect(() => {
    if (mode === 'outcome' && !outcomeSfxRef.current) {
      outcomeSfxRef.current = true;
      window.dispatchEvent(new CustomEvent('caregiver:click'));
    }
  }, [mode]);

  const activeHotspot = activeClueId
    ? scene.observeHotspots.find((h) => h.clueId === activeClueId) ?? null
    : null;

  const bgEntry = (caregiverAssets as Record<string, CaregiverAssetEntry>)[scene.sceneImage];
  const bgSrc = bgEntry?.src ?? '';

  // ============================================================
  // 理解等级计算（Batch 1 选择器）
  // ============================================================

  const insightLevel = resolveInsightLevel(scene, recordedClueIds);

  // ============================================================
  // 全局交互锁（bubble 阶段锁定热点点击 + 行动点，仅弹窗内按钮可用）
  // ============================================================

  const interactionLocked =
    phase === 'clue_feedback' ||
    phase === 'clue_bubble' ||
    phase === 'action_card';

  // ============================================================
  // 观察热点点击
  // ============================================================

  const handleObserveClick = useCallback((hotspot: ObserveHotspot) => {
    if (interactionLocked) return;
    // Batch 6: 统一进入 clue_feedback，ClueFeedbackOverlay 内部决定展示方式
    setPhase('clue_feedback');
    setAnimatingHotspot(hotspot);
    setActiveClueId(null);
  }, [interactionLocked]);

  const handleFeedbackComplete = useCallback(() => {
    const hs = animatingHotspot;
    setAnimatingHotspot(null);
    setPhase('clue_bubble');
    if (hs) setActiveClueId(hs.clueId);
  }, [animatingHotspot]);

  const handleBubbleRecord = useCallback((clueId: string) => {
    onClueRecord(clueId);
    setActiveClueId(null);
    setPhase('idle');
  }, [onClueRecord]);

  const handleBubbleClose = useCallback((clueId: string) => {
    onCluePeek(clueId);
    setActiveClueId(null);
    setPhase('idle');
  }, [onCluePeek]);

  // ============================================================
  // 行动点（Batch 2: 圆点→开卡→执行/关闭）
  // ============================================================

  const handleInterventionOpen = useCallback((hotspot: InterventionHotspot) => {
    if (interactionLocked) return;
    setOpenIntervention(hotspot);
    setHoveredIntervention(hotspot);
    setPhase('action_card');
  }, [interactionLocked]);

  const handleInterventionHover = useCallback((hotspot: InterventionHotspot | null) => {
    if (phase === 'action_card') return; // 开卡期间不改变悬停
    setHoveredIntervention(hotspot);
  }, [phase]);

  const handleInterventionExecute = useCallback((hotspot: InterventionHotspot) => {
    onInterventionSelect(hotspot);
    setOpenIntervention(null);
    setHoveredIntervention(null);
    setPhase('idle');
  }, [onInterventionSelect]);

  const handleInterventionCancel = useCallback(() => {
    setOpenIntervention(null);
    setHoveredIntervention(null);
    setPhase('idle');
  }, []);

  // ============================================================
  // outcome 模式
  // ============================================================

  if (mode === 'outcome') {
    return (
      <OutcomeImagePanel
        outcomeImages={scene.outcomeImages}
        consequence={consequence ?? 'partial'}
        outcomeFeedback={outcomeFeedback ?? ''}
        onContinue={onOutcomeContinue}
      />
    );
  }

  // ============================================================
  // 渲染
  // ============================================================

  return (
    <div className={styles.unifiedRoot}>
      <div className={styles.sceneBox}>
        {/* 全屏场景图 */}
        <div className={styles.unifiedBg}>
          {bgSrc && <img src={bgSrc} alt="" className={styles.unifiedBgImg} />}
        </div>

        {/* FX: 场景压暗 */}
        {phase === 'clue_feedback' && (
          <SceneFxLayer effectKey="FX_SCENE_DIM_MASK" />
        )}

        {/* 热点层 — v5: 观察热点始终显示，行动点始终显示为圆点 */}
        <SceneHotspotLayer
          observeHotspots={scene.observeHotspots}
          interventionHotspots={scene.interventionHotspots}
          recordedClueIds={recordedClueIds}
          insightLevel={insightLevel}
          hoveredInterventionId={hoveredIntervention?.id ?? null}
          disabled={interactionLocked}
          onObserveClick={handleObserveClick}
          onInterventionOpen={handleInterventionOpen}
          onInterventionHover={handleInterventionHover}
        />

        {/* 行动目标高亮（悬停+开卡时均显示） */}
        {hoveredIntervention && (
          <ActionTargetGuide hotspot={hoveredIntervention} />
        )}

        {/* Batch 6: 统一线索反馈容器 */}
        {phase === 'clue_feedback' && animatingHotspot && getClueByClueId(animatingHotspot.clueId) && (
          <ClueFeedbackOverlay
            clue={getClueByClueId(animatingHotspot.clueId)!}
            isRecorded={recordedClueIds.includes(animatingHotspot.clueId)}
            onComplete={handleFeedbackComplete}
          />
        )}

        {/* 集中式线索弹窗（基于 sceneBox 居中，不再使用 bubbleAnchor） */}
        {phase === 'clue_bubble' && activeHotspot && (() => {
          // 图片优先级：静态特写图 → 动画首帧（回看时与反馈阶段展示一致）
          const detailImg = getClueDetailImage(activeHotspot.clueId);
          const clueSpec = getClueByClueId(activeHotspot.clueId);
          const anmFirstKey = clueSpec?.microAnimation?.frameKeys[0];
          const clueImg = detailImg
            ?? ((anmFirstKey && (caregiverAssets as Record<string, CaregiverAssetEntry>)[anmFirstKey]?.src) || null);

          return (
            <ClueBubble
              observationText={activeHotspot.observationText}
              clueId={activeHotspot.clueId}
              state={getClueState(activeHotspot.clueId, recordedClueIds)}
              clueImage={clueImg}
              hotspotRect={activeHotspot.rect}
              onRecord={handleBubbleRecord}
              onClose={handleBubbleClose}
            />
          );
        })()}

        {/* 行动预览卡（Batch 2: 点击行动点后弹出） */}
        {phase === 'action_card' && openIntervention && (
          <ActionPreviewCard
            hotspot={openIntervention}
            insightLevel={insightLevel}
            anchorTop={openIntervention.cardAnchor?.top ?? openIntervention.anchor?.top ?? '50%'}
            anchorLeft={openIntervention.cardAnchor?.left ?? openIntervention.anchor?.left ?? '50%'}
            onConfirm={handleInterventionExecute}
            onCancel={handleInterventionCancel}
          />
        )}

        {/* 底部：手册按钮（移除理解计数提示） */}
        <div className={styles.bottomBar}>
          <button
            className={styles.notebookToggle}
            onClick={() => setIsNotebookOpen((v) => !v)}
            disabled={interactionLocked}
            aria-disabled={interactionLocked}
          >
            📋 {recordedClueIds.length}
          </button>
        </div>

        {/* 手册 */}
        {isNotebookOpen && (
          <HandoverNotebook
            scene={scene}
            recordedClueIds={recordedClueIds}
            onClose={() => setIsNotebookOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

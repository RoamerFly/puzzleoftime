/**
 * === ClueFeedbackOverlay · 居中动画查看器（Phase 2 改写） ===
 *
 * micro-animation 从场景原位叠加改为网页居中展示：
 * - 小尺寸 RGBA 补丁 → Canvas 从主场景截取背景补齐后居中播放
 * - 中、大尺寸动画 → 直接居中播放
 * - 三档响应式尺寸：small ≤ 560px, medium ≤ 820px, large ≤ 1180px
 * - 点击遮罩或 Esc 跳过
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CaregiverClueSpec, MicroAnimationSpec } from '../../data/clueRegistry';
import { caregiverAssets } from '../../assets/assets';
import type { CaregiverAssetEntry } from '../../assets/assets';
import styles from './UnifiedCareScene.module.css';

// ============================================================
// 场景背景映射
// ============================================================

const SCENE_BACKGROUND_KEYS: Record<string, string> = {
  wang: 'SCN_WANG_MEAL',
  li: 'SCN_LI_REHAB',
  chen: 'SCN_CHEN_GLUCOSE',
};

type AnimationSize = 'small' | 'medium' | 'large';

interface PreparedAnimationFrame {
  src: string;
  size: AnimationSize;
  aspectRatio: string;
}

// ============================================================
// Props
// ============================================================

export interface ClueFeedbackOverlayProps {
  clue: CaregiverClueSpec;
  isRecorded: boolean;
  onComplete: () => void;
}

// ============================================================
// 工具：尺寸分档
// ============================================================

function getAnimationSize(width: number, height: number): AnimationSize {
  const area = width * height;
  if (width <= 640 && height <= 520 && area <= 300_000) return 'small';
  if (width <= 1400 && height <= 1000 && area <= 1_200_000) return 'medium';
  return 'large';
}

// ============================================================
// 工具：图片加载
// ============================================================

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load: ${src}`));
    image.src = src;
  });
}

// ============================================================
// 小图背景补齐（Canvas 合成）
// ============================================================

async function patchSmallFrame(
  frameSrc: string,
  background: HTMLImageElement,
  spec: MicroAnimationSpec,
): Promise<PreparedAnimationFrame> {
  const frame = await loadImage(frameSrc);
  const sceneWidth = background.naturalWidth;
  const sceneHeight = background.naturalHeight;
  const rect = spec.overlayRect;

  // 百分比 → 像素
  const overlayLeft = sceneWidth * parseFloat(rect.left) / 100;
  const overlayTop = sceneHeight * parseFloat(rect.top) / 100;
  const overlayWidth = sceneWidth * parseFloat(rect.width) / 100;
  const overlayHeight = sceneHeight * parseFloat(rect.height) / 100;

  // 安全边距
  const paddingX = Math.max(64, overlayWidth * 0.45);
  const paddingY = Math.max(48, overlayHeight * 0.45);

  const cropLeft = Math.max(0, Math.floor(overlayLeft - paddingX));
  const cropTop = Math.max(0, Math.floor(overlayTop - paddingY));
  const cropRight = Math.min(sceneWidth, Math.ceil(overlayLeft + overlayWidth + paddingX));
  const cropBottom = Math.min(sceneHeight, Math.ceil(overlayTop + overlayHeight + paddingY));
  const cropWidth = cropRight - cropLeft;
  const cropHeight = cropBottom - cropTop;

  const canvas = document.createElement('canvas');
  canvas.width = cropWidth;
  canvas.height = cropHeight;
  const ctx = canvas.getContext('2d');

  // Canvas context 创建失败 → 降级为直接返回原图
  if (!ctx) {
    return {
      src: frameSrc,
      size: 'small',
      aspectRatio: `${frame.naturalWidth} / ${frame.naturalHeight}`,
    };
  }

  // 先画背景截取区域
  ctx.drawImage(background, cropLeft, cropTop, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

  // 再叠 RGBA 补丁（居中放置，不用 fill 拉伸）
  const drawLeft = overlayLeft - cropLeft + (overlayWidth - frame.naturalWidth) / 2;
  const drawTop = overlayTop - cropTop + (overlayHeight - frame.naturalHeight) / 2;

  ctx.drawImage(frame, Math.round(drawLeft), Math.round(drawTop));

  return {
    src: canvas.toDataURL('image/png'),
    size: 'small',
    aspectRatio: `${cropWidth} / ${cropHeight}`,
  };
}

// ============================================================
// 帧预处理入口
// ============================================================

async function prepareAnimationFrames(
  frameSources: string[],
  backgroundSrc: string | undefined,
  spec: MicroAnimationSpec,
): Promise<PreparedAnimationFrame[]> {
  if (frameSources.length === 0) return [];

  // 加载背景图
  let background: HTMLImageElement | undefined;
  if (backgroundSrc) {
    try {
      background = await loadImage(backgroundSrc);
    } catch {
      background = undefined;
    }
  }

  // 加载首帧确定尺寸
  const firstFrame = await loadImage(frameSources[0]);
  const size = getAnimationSize(firstFrame.naturalWidth, firstFrame.naturalHeight);
  const firstWidth = firstFrame.naturalWidth;
  const firstHeight = firstFrame.naturalHeight;

  // 小图 + 有背景 → Canvas 补齐（逐帧加载，含同组尺寸校验）
  if (size === 'small' && background) {
    const frames: PreparedAnimationFrame[] = [];
    for (const src of frameSources) {
      try {
        const frame = await loadImage(src);
        // P0-3: 同组尺寸校验
        if (frame.naturalWidth !== firstWidth || frame.naturalHeight !== firstHeight) {
          console.warn(
            `[Animation] 同组帧尺寸不一致: ${src} (${frame.naturalWidth}x${frame.naturalHeight}) ` +
            `vs 首帧 (${firstWidth}x${firstHeight})`
          );
        }
        frames.push(await patchSmallFrame(src, background, spec));
      } catch {
        frames.push({ src, size: 'small', aspectRatio: `${firstWidth} / ${firstHeight}` });
      }
    }
    return frames;
  }

  // 中/大图直接使用原始 URL —— P0-2: 单次 map，每帧独立 src
  const images = await Promise.all(frameSources.map(loadImage));
  const sameSize = images.every(
    (img) => img.naturalWidth === firstWidth && img.naturalHeight === firstHeight,
  );
  if (!sameSize) {
    console.warn(
      `[Animation] 动画组帧尺寸不一致: ${frameSources[0]} 组 ` +
      `(${images.map((img) => `${img.naturalWidth}x${img.naturalHeight}`).join(', ')})`
    );
  }

  return frameSources.map((src) => ({
    src,
    size,
    aspectRatio: `${firstWidth} / ${firstHeight}`,
  }));
}

// ============================================================
// 主组件
// ============================================================

export function ClueFeedbackOverlay({
  clue,
  isRecorded,
  onComplete,
}: ClueFeedbackOverlayProps) {
  const resolvedType = resolveFeedbackType(clue);

  // 已记录的动画线索 → 降级展示首帧静态图（与静态线索回看行为一致）
  if (isRecorded && resolvedType === 'micro-animation') {
    const firstFrameKey = clue.microAnimation?.frameKeys[0];
    if (firstFrameKey) {
      return <DetailImageViewer imageKey={firstFrameKey} onComplete={onComplete} />;
    }
    return <MinimalFeedback onComplete={onComplete} />;
  }

  switch (resolvedType) {
    case 'micro-animation':
      return (
        <MicroAnimationPlayer
          clue={clue}
          isRecorded={isRecorded}
          onComplete={onComplete}
        />
      );
    case 'detail-image':
      return (
        <DetailImageViewer
          imageKey={clue.detailImage!}
          onComplete={onComplete}
        />
      );
    case 'focus-highlight':
      return (
        <FocusHighlight
          targetRect={clue.focusTarget ?? clue.rect}
          onComplete={onComplete}
        />
      );
    default:
      return <MinimalFeedback onComplete={onComplete} />;
  }
}

// ============================================================
// 降级映射
// ============================================================

function resolveFeedbackType(clue: CaregiverClueSpec): CaregiverClueSpec['feedbackType'] {
  const type = clue.feedbackType as string;
  if (type === 'micro-animation' || type === 'detail-image' || type === 'focus-highlight') return type as CaregiverClueSpec['feedbackType'];
  if (type === 'animation' || type === 'detail') return clue.detailImage ? 'detail-image' : 'focus-highlight';
  return 'focus-highlight';
}

// ============================================================
// 居中微动画播放器（Phase 2 重构）
// ============================================================

function MicroAnimationPlayer({
  clue,
  isRecorded,
  onComplete,
}: {
  clue: CaregiverClueSpec;
  isRecorded: boolean;
  onComplete: () => void;
}) {
  const spec = clue.microAnimation!;
  const frameSources: string[] = spec.frameKeys
    .map((key) => (caregiverAssets as Record<string, CaregiverAssetEntry>)[key]?.src ?? '')
    .filter(Boolean);

  const [frameIndex, setFrameIndex] = useState(0);
  const [preparedFrames, setPreparedFrames] = useState<PreparedAnimationFrame[]>([]);
  const [phase, setPhase] = useState<'loading' | 'playing' | 'done'>('loading');
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const completeRef = useRef(false);

  const finish = useCallback(() => {
    if (completeRef.current) return;
    completeRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    onComplete();
  }, [onComplete]);

  // 预处理帧
  useEffect(() => {
    let cancelled = false;
    if (isRecorded || frameSources.length === 0) {
      finish();
      return;
    }

    const bgKey = SCENE_BACKGROUND_KEYS[clue.sceneId];
    const bgAsset = (caregiverAssets as Record<string, CaregiverAssetEntry>)[bgKey];
    const bgSrc = bgAsset?.src;

    prepareAnimationFrames(frameSources, bgSrc, spec).then((frames) => {
      if (cancelled) return;
      if (frames.length === 0) { finish(); return; }
      setPreparedFrames(frames);
      setFrameIndex(0);  // P0-1: 在预处理回调中重置，避免 effect 同步 setState
      setPhase('playing');
    }).catch(() => finish());

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── SFX: 微动画开始触发轻提示 + 线索揭示（仅一次） ──
  const sfxDispatchedRef = useRef(false);
  useEffect(() => {
    if (phase === 'playing' && !sfxDispatchedRef.current) {
      sfxDispatchedRef.current = true;
      window.dispatchEvent(new CustomEvent('caregiver:click'));
      window.dispatchEvent(new CustomEvent('caregiver:click'));
    }
  }, [phase]);

  // 播放循环（仅在 playing 阶段；frameIndex=0 已在预处理回调中设置）
  useEffect(() => {
    if (phase !== 'playing' || preparedFrames.length === 0) return;
    const totalFrames = preparedFrames.length;

    const advance = () => {
      setFrameIndex((prev) => {
        const next = prev + 1;
        if (next >= totalFrames) {
          timerRef.current = setTimeout(finish, spec.holdDuration);
          return prev; // 保持最后一帧
        }
        timerRef.current = setTimeout(advance, spec.frameDuration);
        return next;
      });
    };

    timerRef.current = setTimeout(advance, spec.frameDuration);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, preparedFrames.length]);

  // Esc 跳过
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') finish(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [finish]);

  const currentFrame = preparedFrames[frameIndex] ?? null;
  const sizeClass =
    currentFrame?.size === 'small' ? styles.microAnimationStageSmall
      : currentFrame?.size === 'large' ? styles.microAnimationStageLarge
        : styles.microAnimationStageMedium;

  return (
    <div
      className={styles.microAnimationOverlay}
      onClick={finish}
      role="button"
      tabIndex={0}
      aria-label={`跳过${clue.label}动画`}
    >
      {/* 压暗遮罩 */}
      <div className={styles.animDim} />

      {/* 居中画框 */}
      <div
        className={`${styles.microAnimationStage} ${sizeClass}`}
        style={{ aspectRatio: currentFrame?.aspectRatio ?? '16 / 9' }}
      >
        {phase === 'loading' && (
          <span className={styles.microAnimationLoading}>⏳</span>
        )}
        {phase === 'playing' && currentFrame && (
          <img
            key={frameIndex}
            src={currentFrame.src}
            alt=""
            className={styles.microAnimationCenteredImg}
          />
        )}
      </div>

      {/* 跳过提示 */}
      <span className={styles.animSkipHint}>点击或按 Esc 跳过</span>
    </div>
  );
}

// ============================================================
// 静态特写查看器
// ============================================================

function DetailImageViewer({
  imageKey,
  onComplete,
}: {
  imageKey: string;
  onComplete: () => void;
}) {
  const entry = (caregiverAssets as Record<string, CaregiverAssetEntry>)[imageKey];
  const imgSrc = entry?.src ?? '';

  const handleClick = useCallback(() => onComplete(), [onComplete]);

  // SFX: 打开/关闭静态特写
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('caregiver:click'));
    return () => { window.dispatchEvent(new CustomEvent('caregiver:click')); };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onComplete(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onComplete]);

  if (!imgSrc) return <MinimalFeedback onComplete={onComplete} />;

  return (
    <div className={styles.detailImageOverlay} onClick={handleClick}>
      <div className={styles.animDim} />
      <div className={styles.animClueDetail}>
        <img src={imgSrc} alt="" className={styles.animClueDetailImg} />
      </div>
      <span className={styles.animSkipHint}>点击或按 Esc 继续</span>
    </div>
  );
}

// ============================================================
// 聚焦高亮
// ============================================================

function FocusHighlight({
  targetRect,
  onComplete,
}: {
  targetRect: { top: string; left: string; width: string; height: string };
  onComplete: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 450);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={styles.focusHighlightOverlay}>
      <div
        className={styles.focusHighlightTarget}
        style={{
          top: targetRect.top,
          left: targetRect.left,
          width: targetRect.width,
          height: targetRect.height,
        }}
      />
    </div>
  );
}

// ============================================================
// 最小反馈
// ============================================================

function MinimalFeedback({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 150);
    return () => clearTimeout(timer);
  }, [onComplete]);
  return null;
}

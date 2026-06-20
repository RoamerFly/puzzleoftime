/**
 * === AnimationOverlay · @deprecated ===
 *
 * 已被 ClueFeedbackOverlay.MicroAnimationPlayer 完全取代。
 * 保留用于向后兼容，所有新动画请使用 MicroAnimationSpec 路径。
 *
 * v3 功能：预加载全部帧 → 双缓冲 cross-fade 播放 → 支持连续片段。
 * 流程：压暗背景 → 逐帧播放（按各片段 frameDuration）→ 末帧停留 holdDuration → 淡出 → onComplete。
 * 有 ANM 素材时只播放动画 + 文字气泡（不重复显示 CLUE 图）。
 * 无 ANM、有 CLUE 时：压暗 → CLUE 特写 → onComplete。
 * 点击遮罩或 Esc 跳过；卸载时完整清理。
 */

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { getAnimationSequence, getClueDetailImage } from '../../assets/assets';
import type { AnimationClip } from '../../assets/assets';
import styles from './UnifiedCareScene.module.css';

interface AnimationOverlayProps {
  clueId: string;
  onComplete: () => void;
}

// ============================================================
// 预加载工具
// ============================================================

function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      img.decode().then(() => resolve(img)).catch(() => resolve(img));
    };
    img.onerror = () => reject(new Error(`Failed to load: ${src}`));
    img.src = src;
  });
}

async function preloadAllFrames(clips: AnimationClip[]): Promise<string[]> {
  const allUrls = clips.flatMap((c) => c.urls);
  const uniqueUrls = [...new Set(allUrls)];
  await Promise.all(uniqueUrls.map(preloadImage));
  return allUrls;
}

// ============================================================
// 展平片段为播放队列
// ============================================================

interface FrameEntry {
  src: string;
  duration: number;       // 本帧显示时长 (ms)
  isLastInClip: boolean;
  holdDuration: number;   // 片段末帧额外停留 (ms)
}

function flattenClips(clips: AnimationClip[]): FrameEntry[] {
  const entries: FrameEntry[] = [];
  for (const clip of clips) {
    for (let i = 0; i < clip.urls.length; i++) {
      const isLast = i === clip.urls.length - 1;
      entries.push({
        src: clip.urls[i],
        duration: clip.frameDuration,
        isLastInClip: isLast,
        holdDuration: isLast ? clip.holdDuration : 0,
      });
    }
  }
  return entries;
}

// ============================================================
// 组件
// ============================================================

export function AnimationOverlay({ clueId, onComplete }: AnimationOverlayProps) {
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const clips = useMemo(() => getAnimationSequence(clueId), [clueId]);
  const clueImg = useMemo(() => getClueDetailImage(clueId), [clueId]);

  // 预加载状态
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // 播放状态
  const [frameIndex, setFrameIndex] = useState(-1); // -1 = 初始黑场
  const [prevSrc, setPrevSrc] = useState<string | null>(null);
  const [currSrc, setCurrSrc] = useState<string | null>(null);
  const [fadingOut, setFadingOut] = useState(false);
  const [showClue, setShowClue] = useState(false); // 无 ANM 的 CLUE 模式

  // 清理句柄
  const cleanupRef = useRef<(() => void) | null>(null);
  const skippedRef = useRef(false);

  // ============================================================
  // 预加载
  // ============================================================

  useEffect(() => {
    if (!clips || clips.length === 0) {
      if (clueImg) {
        const t = setTimeout(() => setShowClue(true), 0);
        return () => clearTimeout(t);
      } else {
        onCompleteRef.current();
      }
      return;
    }

    let cancelled = false;
    preloadAllFrames(clips)
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    return () => { cancelled = true; };
  }, [clips, clueImg]);

  // ============================================================
  // 播放控制
  // ============================================================

  const skip = useCallback(() => {
    if (skippedRef.current) return;
    skippedRef.current = true;
    cleanupRef.current?.();
    cleanupRef.current = null;
    setFadingOut(true);
    window.setTimeout(() => onCompleteRef.current(), 300);
  }, []);

  useEffect(() => {
    if (!ready || !clips) return;

    const entries = flattenClips(clips);
    if (entries.length === 0) {
      onCompleteRef.current();
      return;
    }

    let current = 0;
    let timerId = 0;
    let holdTimer = 0;
    let fadeTimer = 0;
    let stopped = false;

    const advanceFrame = () => {
      if (stopped) return;

      if (current === 0) {
        // 第一帧：直接显示
        setFrameIndex(0);
        setCurrSrc(entries[0].src);
        setPrevSrc(null);
        current++;
        scheduleNext();
      } else if (current < entries.length) {
        // 中间帧：cross-fade（前一帧 → 当前帧）
        setPrevSrc(entries[current - 1].src);
        setCurrSrc(entries[current].src);
        setFrameIndex(current);

        // cross-fade 后清理前一帧
        window.setTimeout(() => setPrevSrc(null), 100);

        // 当前帧停留后继续。若当前帧是所在片段的末帧，额外停留 holdDuration
        const frameEntry = entries[current];
        const delay = frameEntry.isLastInClip
          ? frameEntry.duration + frameEntry.holdDuration
          : frameEntry.duration;
        current++;
        scheduleNextAfter(delay);
      } else {
        // 序列最后一帧播完 → 淡出 → onComplete
        holdTimer = window.setTimeout(() => {
          if (stopped) return;
          setFadingOut(true);
          fadeTimer = window.setTimeout(() => {
            if (stopped) return;
            onCompleteRef.current();
          }, 300);
        }, 100); // 100ms 余量确保最后一帧已渲染
      }
    };

    const scheduleNext = () => {
      const entry = entries[current];
      timerId = window.setTimeout(advanceFrame, entry ? entry.duration : 320);
    };

    const scheduleNextAfter = (ms: number) => {
      timerId = window.setTimeout(advanceFrame, ms);
    };

    // 启动
    advanceFrame();

    // 键盘跳过
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        skip();
      }
    };
    window.addEventListener('keydown', handleKey);

    cleanupRef.current = () => {
      stopped = true;
      clearTimeout(timerId);
      clearTimeout(holdTimer);
      clearTimeout(fadeTimer);
      window.removeEventListener('keydown', handleKey);
    };

    return () => {
      stopped = true;
      clearTimeout(timerId);
      clearTimeout(holdTimer);
      clearTimeout(fadeTimer);
      window.removeEventListener('keydown', handleKey);
    };
  }, [ready, clips, skip]);

  // 加载失败 → 直接回调
  useEffect(() => {
    if (loadError) onCompleteRef.current();
  }, [loadError]);

  // ============================================================
  // 无 ANM、有 CLUE → 显示特写
  // ============================================================

  if (showClue && clueImg) {
    return (
      <div className={styles.animOverlay} onClick={skip}>
        <div className={styles.animDim} />
        <div className={styles.animClueDetail}>
          <img src={clueImg} alt="" className={styles.animClueDetailImg} />
        </div>
        <span className={styles.animSkipHint}>点击继续</span>
      </div>
    );
  }

  // ============================================================
  // 普通渲染
  // ============================================================

  if ((!clips || clips.length === 0) && !clueImg) return null;
  if (!ready || fadingOut) {
    // loading 或 fading out 时压暗
    return (
      <div className={`${styles.animOverlay} ${fadingOut ? styles.animOverlayFadeOut : ''}`}>
        <div className={styles.animDim} />
        {currSrc && (
          <img src={currSrc} alt="" className={styles.animFrame} />
        )}
      </div>
    );
  }

  return (
    <div
      className={`${styles.animOverlay} ${fadingOut ? styles.animOverlayFadeOut : ''}`}
      onClick={skip}
      role="button"
      tabIndex={0}
      aria-label="跳过动画"
    >
      {/* 压暗遮罩 */}
      <div className={styles.animDim} />

      {/* 双缓冲帧 */}
      <div className={styles.animFrameStack}>
        {/* 前一帧 → 淡出 */}
        {prevSrc && (
          <img
            key={`prev-${frameIndex}`}
            src={prevSrc}
            alt=""
            className={`${styles.animFrame} ${styles.animFramePrev}`}
          />
        )}
        {/* 当前帧 → 淡入 */}
        {currSrc && (
          <img
            key={`curr-${frameIndex}`}
            src={currSrc}
            alt=""
            className={styles.animFrame}
          />
        )}
      </div>

      {/* 跳过提示 */}
      <span className={styles.animSkipHint}>点击或按 Esc 跳过</span>
    </div>
  );
}

/* === 第二章音频播放 Hook v2.2 ===
 *
 * BGM: 状态机驱动
 * SFX: 统一50ms中性低频点击音，防抖150ms
 */

import { useEffect, useRef, useCallback } from 'react';
import { CAREGIVER_AUDIO } from '../assets/audioAssets';
import { SCENE_BGM_MAP, AUDIO_VOLUME, FADE_MS, SFX_DEBOUNCE_MS } from '../data/caregiverBgmConfig';
import type { CaregiverBgmKey, CaregiverSceneId } from '../data/caregiverBgmConfig';

function createAudio(src: string, loop: boolean, volume: number): HTMLAudioElement {
  const a = new Audio(src);
  a.loop = loop;
  a.volume = volume;
  a.preload = 'auto';
  return a;
}

function fade(audio: HTMLAudioElement, to: number, ms: number, onDone?: () => void) {
  const from = audio.volume;
  const start = performance.now();
  const step = () => {
    const t = Math.min(1, (performance.now() - start) / ms);
    audio.volume = from + (to - from) * t;
    if (t < 1) requestAnimationFrame(step);
    else onDone?.();
  };
  requestAnimationFrame(step);
}

function stopAudio(a: HTMLAudioElement | null) {
  if (!a) return;
  a.pause();
  a.currentTime = 0;
  a.src = '';
  a.load();
}

interface UseCaregiverBgmProps {
  phase: string;
  sceneId: CaregiverSceneId | null;
  enabled?: boolean;
}

export function useCaregiverBgm({ phase, sceneId, enabled = true }: UseCaregiverBgmProps) {
  const bgmRef = useRef<{ key: CaregiverBgmKey | null; audio: HTMLAudioElement | null }>({ key: null, audio: null });
  const lastClickRef = useRef(0);

  useEffect(() => () => stopAudio(bgmRef.current.audio), []);

  const playBgm = useCallback((key: CaregiverBgmKey, volume: number, loop: boolean) => {
    const prev = bgmRef.current;
    if (prev.key === key && prev.audio && !prev.audio.paused) return;
    const src = CAREGIVER_AUDIO.bgm[key];
    if (!src) return;
    const next = createAudio(src, loop, 0);
    bgmRef.current = { key, audio: next };
    if (prev.audio) fade(prev.audio, 0, FADE_MS.bgmFadeOut, () => stopAudio(prev.audio));
    next.play().catch(() => {
      const resume = () => {
        if (bgmRef.current.audio === next) { next.play().catch(() => {}); fade(next, volume, FADE_MS.bgmFadeIn); }
        document.removeEventListener('click', resume); document.removeEventListener('keydown', resume);
      };
      document.addEventListener('click', resume, { once: true });
      document.addEventListener('keydown', resume, { once: true });
    });
    if (!next.paused) fade(next, volume, FADE_MS.bgmFadeIn);
  }, []);

  /** 统一点击音：80ms 短促"滴"，防抖150ms */
  const playClick = useCallback(() => {
    const now = performance.now();
    if (now - lastClickRef.current < SFX_DEBOUNCE_MS) return;
    lastClickRef.current = now;
    const src = CAREGIVER_AUDIO.sfx.click;
    if (!src) return;
    const a = new Audio(src);
    a.volume = AUDIO_VOLUME.sfx;
    a.play().catch(() => {});
  }, []);

  /** 自定义事件: 任何组件 dispatch 'caregiver:click' 触发统一音效 */
  useEffect(() => {
    if (!enabled) return;
    const handler = () => playClick();
    window.addEventListener('caregiver:click', handler);
    return () => window.removeEventListener('caregiver:click', handler);
  }, [enabled, playClick]);

  /* ══════════════════════════════════════
     BGM 状态机
     ══════════════════════════════════════ */

  useEffect(() => {
    if (!enabled) return;
    if (phase === 'summary' || phase === 'ending') {
      playBgm('finalSummary', AUDIO_VOLUME.summaryBgm, true);
      return;
    }
    if (phase === 'event-scene' && sceneId) {
      const bgmKey = SCENE_BGM_MAP[sceneId];
      if (bgmKey) playBgm(bgmKey, AUDIO_VOLUME.sceneBgm, true);
    }
  }, [phase, sceneId, enabled, playBgm]);

  return { playClick };
}

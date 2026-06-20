/**
 * === 院长视角模块：音频管理 Hook ===
 *
 * 管理第三章所有音频播放：BGM、环境音、交互音效、电话配音。
 *
 * 使用原生 HTMLAudioElement，不依赖第三方库。
 * 遵循浏览器自动播放限制：首次用户交互后再初始化音频。
 * 播放失败时不报错中断游戏。
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  managerAudioAssets,
  AUDIO_VOLUMES,
  WORK_EVENT_VOICE_MAP,
  FAMILY_CALL_VOICE_MAP,
} from '../assets/audioAssets';
import type { ManagerPhase } from '../data/managerState';

/* ======== 类型 ======== */

export interface UseManagerAudioOptions {
  phase: ManagerPhase;
  isNightMode: boolean;
  isNightEnding: boolean;
  /** 工作事件类型（用于配音映射），仅在 workEventHandling 阶段有效 */
  workEventType?: string | null;
  /** 家庭来电对象 */
  familyCaller?: 'child' | 'spouse' | null;
}

export interface UseManagerAudioReturn {
  /** 音频是否已通过用户交互初始化 */
  audioInitialized: boolean;
  /** 用户首次交互标记（触发初始化） */
  markFirstInteraction: () => void;
  /** 播放一次性音效 */
  playSfx: (sfxKey: keyof typeof managerAudioAssets.sfx) => void;
  /** 开始循环电话铃声 */
  startPhoneRing: () => void;
  /** 停止电话铃声（不清除其他音频） */
  stopPhoneRing: () => void;
  /** 播放电话接听音效 */
  playPhonePickup: () => void;
  /** 播放电话挂断音效 */
  playPhoneHangup: () => void;
  /** 开始拨号音 */
  startPhoneDialing: () => void;
  /** 停止拨号音 + 播放接通音效 */
  onPhoneConnected: () => void;
  /** 停止拨号音 */
  stopPhoneDialing: () => void;
  /**
   * 获取当前 caller 台词对应的配音资源路径。
   * 返回 null 表示该台词不需要配音或没有对应资源。
   */
  getVoiceSrc: (
    dialogueLineIndex: number,
    dialogueKind: string,
    eventType?: string | null,
    familyCaller?: 'child' | 'spouse' | null,
  ) => string | null;
  /** 播放指定 src 的语音，返回 Audio 元素 */
  playVoice: (src: string) => HTMLAudioElement | null;
  /** 停止当前语音 */
  stopVoice: () => void;
  /** 停止所有第三章音频（退出时调用） */
  stopAll: () => void;
}

/* ======== 音量常量 ======== */

const FADE_DURATION_MS = 800;
const BGM_DUCK_VOLUME = 0.06;

/* ======== 辅助函数 ======== */

function createAudioElement(src: string, loop: boolean, volume: number): HTMLAudioElement {
  const audio = new Audio(src);
  audio.loop = loop;
  audio.volume = volume;
  audio.preload = 'auto';
  return audio;
}

function safePlay(audio: HTMLAudioElement): void {
  audio.play().catch(() => {
    // 浏览器自动播放限制，静默处理
  });
}

function safeStop(audio: HTMLAudioElement | null): void {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}

function safeCleanup(audio: HTMLAudioElement | null): void {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  audio.src = '';
  audio.load();
}

function fadeIn(
  audio: HTMLAudioElement,
  targetVolume: number,
  durationMs: number,
  cancelled: () => boolean,
): void {
  const startVolume = audio.volume;
  const startTime = performance.now();

  function step() {
    if (cancelled()) return;
    const elapsed = performance.now() - startTime;
    const progress = Math.min(1, elapsed / durationMs);
    audio.volume = startVolume + (targetVolume - startVolume) * progress;

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

function fadeOut(
  audio: HTMLAudioElement,
  durationMs: number,
  cancelled: () => boolean,
  onComplete?: () => void,
): void {
  const startVolume = audio.volume;
  const startTime = performance.now();

  function step() {
    if (cancelled()) return;
    const elapsed = performance.now() - startTime;
    const progress = Math.min(1, elapsed / durationMs);
    audio.volume = startVolume * (1 - progress);

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 0;
      onComplete?.();
    }
  }

  requestAnimationFrame(step);
}

function setVolume(audio: HTMLAudioElement, targetVolume: number): void {
  audio.volume = targetVolume;
}

/* ======== Hook ======== */

export function useManagerAudio(options: UseManagerAudioOptions): UseManagerAudioReturn {
  const { phase, isNightMode, isNightEnding } = options;

  const [audioInitialized, setAudioInitialized] = useState(false);
  const initializedRef = useRef(false);
  const fadeCancelledRef = useRef(false);

  const isFadeCancelled = useCallback(() => fadeCancelledRef.current, []);

  // BGM 元素
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  const pressureBgmAudioRef = useRef<HTMLAudioElement | null>(null);

  // 环境音元素
  const ambDayRef = useRef<HTMLAudioElement | null>(null);
  const ambNightRef = useRef<HTMLAudioElement | null>(null);
  const ambCricketsRef = useRef<HTMLAudioElement | null>(null);

  // 电话音效元素
  const phoneRingRef = useRef<HTMLAudioElement | null>(null);
  const phoneDialingRef = useRef<HTMLAudioElement | null>(null);

  // 语音元素
  const voiceRef = useRef<HTMLAudioElement | null>(null);

  // 跟踪当前播放的 BGM 类型，防止重复切换
  const currentBgmTypeRef = useRef<'day' | 'night' | 'pressure' | null>(null);

  /* ======== 初始化 ======== */
  const initAudio = useCallback(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // 创建 BGM 元素
    bgmAudioRef.current = createAudioElement(
      managerAudioAssets.bgm.day,
      true,
      AUDIO_VOLUMES.bgm,
    );
    pressureBgmAudioRef.current = createAudioElement(
      managerAudioAssets.bgm.pressure,
      true,
      AUDIO_VOLUMES.bgmPressure,
    );

    // 创建环境音元素
    ambDayRef.current = createAudioElement(
      managerAudioAssets.ambience.officeDay,
      true,
      AUDIO_VOLUMES.ambienceOffice,
    );
    ambNightRef.current = createAudioElement(
      managerAudioAssets.ambience.officeNight,
      true,
      AUDIO_VOLUMES.ambienceOffice,
    );
    ambCricketsRef.current = createAudioElement(
      managerAudioAssets.ambience.cricketsNight,
      true,
      AUDIO_VOLUMES.ambienceCrickets,
    );

    setAudioInitialized(true);
  }, []);

  const markFirstInteraction = useCallback(() => {
    if (!initializedRef.current) {
      initAudio();
    }
  }, [initAudio]);

  /* ======== BGM 播放 ======== */

  const playDayBgm = useCallback(() => {
    if (currentBgmTypeRef.current === 'day') return;
    const audio = bgmAudioRef.current;
    if (!audio) return;

    // 停止压力 BGM
    if (pressureBgmAudioRef.current) {
      const pBgm = pressureBgmAudioRef.current;
      fadeOut(pBgm, FADE_DURATION_MS, isFadeCancelled, () => {
        safeStop(pBgm);
      });
    }

    currentBgmTypeRef.current = 'day';
    audio.loop = true;
    setVolume(audio, AUDIO_VOLUMES.bgm);
    safePlay(audio);
  }, []);

  const playNightBgm = useCallback(() => {
    if (currentBgmTypeRef.current === 'night') return;
    const audio = bgmAudioRef.current;
    if (!audio) return;

    // 停止压力 BGM
    if (pressureBgmAudioRef.current) {
      safeStop(pressureBgmAudioRef.current);
    }

    currentBgmTypeRef.current = 'night';
    // 切换到夜晚 BGM
    audio.src = managerAudioAssets.bgm.night;
    audio.loop = true;
    setVolume(audio, AUDIO_VOLUMES.bgm);
    safePlay(audio);
  }, []);

  const playPressureBgm = useCallback(() => {
    if (currentBgmTypeRef.current === 'pressure') return;
    const audio = pressureBgmAudioRef.current;
    if (!audio) return;

    currentBgmTypeRef.current = 'pressure';

    // Duck 白天 BGM
    if (bgmAudioRef.current) {
      fadeIn(bgmAudioRef.current, BGM_DUCK_VOLUME, 400, isFadeCancelled);
    }

    audio.loop = true;
    setVolume(audio, AUDIO_VOLUMES.bgmPressure);
    safePlay(audio);
  }, []);

  const stopPressureBgm = useCallback(() => {
    const audio = pressureBgmAudioRef.current;
    if (!audio) return;

    fadeOut(audio, FADE_DURATION_MS * 0.6, isFadeCancelled, () => {
      safeStop(audio);
    });

    // 恢复白天 BGM 音量
    if (bgmAudioRef.current && currentBgmTypeRef.current === 'pressure') {
      currentBgmTypeRef.current = 'day';
      fadeIn(bgmAudioRef.current, AUDIO_VOLUMES.bgm, FADE_DURATION_MS, isFadeCancelled);
    }
  }, []);

  /* ======== 环境音播放 ======== */

  const startDayAmbience = useCallback(() => {
    const audio = ambDayRef.current;
    if (!audio) return;
    audio.loop = true;
    setVolume(audio, AUDIO_VOLUMES.ambienceOffice);
    safePlay(audio);
  }, []);

  const stopDayAmbience = useCallback(() => {
    const audio = ambDayRef.current;
    if (!audio) return;
    fadeOut(audio, FADE_DURATION_MS, isFadeCancelled, () => {
      safeStop(audio);
    });
  }, []);

  const startNightAmbience = useCallback(() => {
    const night = ambNightRef.current;
    const crickets = ambCricketsRef.current;
    if (!night || !crickets) return;

    night.loop = true;
    setVolume(night, AUDIO_VOLUMES.ambienceOffice);
    safePlay(night);

    crickets.loop = true;
    setVolume(crickets, AUDIO_VOLUMES.ambienceCrickets);
    safePlay(crickets);
  }, []);

  const stopNightAmbience = useCallback(() => {
    const night = ambNightRef.current;
    const crickets = ambCricketsRef.current;

    if (night) {
      fadeOut(night, FADE_DURATION_MS, isFadeCancelled, () => safeStop(night));
    }
    if (crickets) {
      fadeOut(crickets, FADE_DURATION_MS, isFadeCancelled, () => safeStop(crickets));
    }
  }, []);

  /* ======== BGM / 环境音 主控逻辑 ======== */

  // 跟踪上一个 phase 以便判断过渡
  const prevPhaseRef = useRef<ManagerPhase>('office');

  useEffect(() => {
    if (!audioInitialized) return;

    const prevPhase = prevPhaseRef.current;
    prevPhaseRef.current = phase;

    // 夜晚模式切换
    const enteringNight = isNightMode && !isNightEnding;
    const enteringNightEnding = isNightEnding;

    // 白天阶段：播放白天BGM + 白天环境音
    const isDayPhase =
      phase === 'office' ||
      phase === 'computer' ||
      phase === 'infoReview' ||
      phase === 'firstBudget' ||
      phase === 'workEventIncoming' ||
      phase === 'workEventCall' ||
      phase === 'workEventHandling' ||
      phase === 'familyCallIncoming' ||
      phase === 'familyCall' ||
      phase === 'secondAdjustment';

    // 夜晚阶段（但不是 final nightEnding）
    const isNightPhase = enteringNight && !enteringNightEnding;

    if (isDayPhase) {
      // 播放白天 BGM
      playDayBgm();

      // 播放白天环境音
      if (!isNightMode) {
        startDayAmbience();
      }

      // 压力 BGM 控制：在事件处理/电话阶段叠加
      if (
        phase === 'workEventIncoming' ||
        phase === 'workEventCall' ||
        phase === 'workEventHandling' ||
        phase === 'familyCallIncoming' ||
        phase === 'familyCall'
      ) {
        playPressureBgm();
      } else {
        stopPressureBgm();
      }
    }

    // 家人电话结束 → 进入夜晚
    if (isNightPhase && prevPhase !== 'office') {
      // 淡出白天 BGM，切换夜晚 BGM
      stopPressureBgm();

      // 停止白天环境音
      stopDayAmbience();

      // 短暂延迟后启动夜晚音频（给淡出留时间）
      setTimeout(() => {
        playNightBgm();
        startNightAmbience();
      }, FADE_DURATION_MS * 0.5);
    }

    // finalReport / nightEnding：保持夜晚音频
    if (phase === 'finalReport') {
      playNightBgm();
      startNightAmbience();
      stopPressureBgm();
    }

    // 完成阶段：停止所有
    if (phase === 'completed') {
      stopAllAudio();
    }

    // 如果夜晚模式已开启（从夜间办公室回来）
    if (isNightMode && phase === 'office' && prevPhase === 'secondAdjustment') {
      playNightBgm();
      startNightAmbience();
      stopPressureBgm();
    }
  }, [
    audioInitialized,
    phase,
    isNightMode,
    isNightEnding,
    playDayBgm,
    playNightBgm,
    playPressureBgm,
    stopPressureBgm,
    startDayAmbience,
    stopDayAmbience,
    startNightAmbience,
    stopNightAmbience,
  ]);

  /* ======== 音效播放 ======== */

  const playSfx = useCallback((sfxKey: keyof typeof managerAudioAssets.sfx) => {
    if (!audioInitialized) return;
    const src = managerAudioAssets.sfx[sfxKey];
    if (!src) return;

    const audio = new Audio(src);
    audio.loop = false;

    // 设置合适的音量
    switch (sfxKey) {
      case 'uiClick':
      case 'uiConfirm':
      case 'uiError':
        audio.volume = AUDIO_VOLUMES.sfxUi;
        break;
      case 'notification':
        audio.volume = AUDIO_VOLUMES.sfxNotification;
        break;
      case 'reportGenerate':
        audio.volume = AUDIO_VOLUMES.sfxReportGenerate;
        break;
      case 'computerPowerOn':
        audio.volume = AUDIO_VOLUMES.sfxComputerPowerOn;
        break;
      default:
        audio.volume = AUDIO_VOLUMES.sfxUi;
    }

    safePlay(audio);
  }, [audioInitialized]);

  /* ======== 电话音效 ======== */

  const startPhoneRing = useCallback(() => {
    if (!audioInitialized) return;
    // 如果已经有铃声在播放，先停止
    stopPhoneRing();

    const audio = new Audio(managerAudioAssets.sfx.phoneRing);
    audio.loop = true;
    audio.volume = AUDIO_VOLUMES.sfxPhoneRing;
    phoneRingRef.current = audio;
    safePlay(audio);
  }, [audioInitialized]);

  const stopPhoneRing = useCallback(() => {
    const audio = phoneRingRef.current;
    if (audio) {
      safeStop(audio);
      safeCleanup(audio);
      phoneRingRef.current = null;
    }
  }, []);

  const playPhonePickup = useCallback(() => {
    if (!audioInitialized) return;
    const audio = new Audio(managerAudioAssets.sfx.phonePickup);
    audio.loop = false;
    audio.volume = AUDIO_VOLUMES.sfxPhonePickup;
    safePlay(audio);
  }, [audioInitialized]);

  const playPhoneHangup = useCallback(() => {
    if (!audioInitialized) return;
    const audio = new Audio(managerAudioAssets.sfx.phoneHangup);
    audio.loop = false;
    audio.volume = AUDIO_VOLUMES.sfxPhoneHangup;
    safePlay(audio);
  }, [audioInitialized]);

  const startPhoneDialing = useCallback(() => {
    if (!audioInitialized) return;
    stopPhoneDialing();

    const audio = new Audio(managerAudioAssets.sfx.phoneDialing);
    audio.loop = true;
    audio.volume = AUDIO_VOLUMES.sfxPhoneRing;
    phoneDialingRef.current = audio;
    safePlay(audio);
  }, [audioInitialized]);

  const stopPhoneDialing = useCallback(() => {
    const audio = phoneDialingRef.current;
    if (audio) {
      safeStop(audio);
      safeCleanup(audio);
      phoneDialingRef.current = null;
    }
  }, []);

  const onPhoneConnected = useCallback(() => {
    stopPhoneDialing();
    if (!audioInitialized) return;
    const audio = new Audio(managerAudioAssets.sfx.phoneConnected);
    audio.loop = false;
    audio.volume = AUDIO_VOLUMES.sfxPhonePickup;
    safePlay(audio);
  }, [audioInitialized, stopPhoneDialing]);

  /* ======== 对白配音 ======== */

  const getVoiceSrc = useCallback(
    (
      dialogueLineIndex: number,
      dialogueKind: string,
      eventType?: string | null,
      familyCaller?: 'child' | 'spouse' | null,
    ): string | null => {
      if (dialogueKind !== 'caller') return null;

      // 工作电话
      if (eventType) {
        const eventMap = WORK_EVENT_VOICE_MAP[eventType];
        if (!eventMap) return null;
        const voiceKey = eventMap[dialogueLineIndex];
        if (!voiceKey) return null;
        return (managerAudioAssets.voice as Record<string, string>)[voiceKey] ?? null;
      }

      // 家庭电话
      if (familyCaller) {
        const familyMap = FAMILY_CALL_VOICE_MAP[familyCaller];
        if (!familyMap) return null;
        const voiceKey = familyMap[dialogueLineIndex];
        if (!voiceKey) return null;
        return (managerAudioAssets.voice as Record<string, string>)[voiceKey] ?? null;
      }

      return null;
    },
    [],
  );

  const playVoice = useCallback((src: string): HTMLAudioElement | null => {
    if (!audioInitialized) return null;
    // 停止当前语音
    stopVoice();

    const audio = new Audio(src);
    audio.loop = false;
    audio.volume = AUDIO_VOLUMES.sfxVoice;
    voiceRef.current = audio;
    safePlay(audio);
    return audio;
  }, [audioInitialized]);

  const stopVoice = useCallback(() => {
    const audio = voiceRef.current;
    if (audio) {
      safeStop(audio);
      safeCleanup(audio);
      voiceRef.current = null;
    }
  }, []);

  /* ======== 停止所有音频 ======== */

  const stopAllAudio = useCallback(() => {
    fadeCancelledRef.current = true;

    safeCleanup(bgmAudioRef.current);
    bgmAudioRef.current = null;
    safeCleanup(pressureBgmAudioRef.current);
    pressureBgmAudioRef.current = null;

    safeCleanup(ambDayRef.current);
    ambDayRef.current = null;
    safeCleanup(ambNightRef.current);
    ambNightRef.current = null;
    safeCleanup(ambCricketsRef.current);
    ambCricketsRef.current = null;

    stopPhoneRing();
    stopPhoneDialing();
    stopVoice();

    currentBgmTypeRef.current = null;
    fadeCancelledRef.current = false;
  }, [stopPhoneRing, stopPhoneDialing, stopVoice]);

  const stopAll = useCallback(() => {
    stopAllAudio();
  }, [stopAllAudio]);

  // 组件卸载时停止所有
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, [stopAllAudio]);

  return {
    audioInitialized,
    markFirstInteraction,
    playSfx,
    startPhoneRing,
    stopPhoneRing,
    playPhonePickup,
    playPhoneHangup,
    startPhoneDialing,
    onPhoneConnected,
    stopPhoneDialing,
    getVoiceSrc,
    playVoice,
    stopVoice,
    stopAll,
  };
}

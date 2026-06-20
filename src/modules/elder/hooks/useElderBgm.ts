/* === 老人模块 BGM 播放 Hook ===
 *
 * 管理全部 21 首 BGM 的播放、停止、淡入淡出、优先级切换、Ducking。
 *
 * 播放层级：
 *   Layer 0: 场景 BGM（常驻循环，可被 ducking）
 *   Layer 1: 事件 BGM（覆盖层，高优先级时覆盖场景）
 *   Layer 2: 结局 BGM（最高优先级，独占播放）
 *
 * 设计原则：
 * - 结局 > 危机/迷路/电话 > 回忆碎片 > 场景常驻 > 过渡音效
 * - 事件 BGM 可压低场景 BGM（ducking）
 * - 结局 BGM 独占，不与其他混合
 * - 每首 BGM 有指定时长，one-shot 类的播完自动停止
 * - 循环类的持续播放直到被切换
 */

import { useEffect, useRef, useCallback } from 'react';
import type { ElderGameState } from '../types';
import {
  BGM_ASSETS,
  getSceneBgm,
  getSceneVolume,
  getEventBgm,
  getEndingBgm,
  getClosedSceneBgm,
} from '../data/bgmConfig';
import type { BgmKey, BgmEvent, EndingBgmRule } from '../data/bgmConfig';

/** BGM 播放器状态 */
interface BgmPlayerState {
  /** 当前场景 BGM key */
  sceneKey: BgmKey | null;
  /** 场景 BGM Audio 元素 */
  sceneAudio: HTMLAudioElement | null;
  /** 场景 BGM 当前音量（可能被 ducking 压低） */
  sceneVolume: number;
  /** 场景 BGM 基础音量（ducking 前） */
  sceneBaseVolume: number;
  /** 当前事件 BGM key */
  eventKey: BgmKey | null;
  /** 事件 BGM Audio 元素 */
  eventAudio: HTMLAudioElement | null;
  /** 当前结局 BGM key */
  endingKey: BgmKey | null;
  /** 结局 BGM Audio 元素 */
  endingAudio: HTMLAudioElement | null;
  /** 淡入淡出定时器 */
  fadeTimers: number[];
  /** 停止定时器 */
  stopTimers: number[];
  /** 当前是否静音（全局） */
  isMuted: boolean;
}

/** 创建 Audio 元素 */
function createAudio(src: string, loop: boolean, volume: number): HTMLAudioElement {
  const audio = new Audio(src);
  audio.loop = loop;
  audio.volume = volume;
  audio.preload = 'auto';
  return audio;
}

/** 线性音量淡入 */
function fadeIn(audio: HTMLAudioElement, targetVolume: number, durationMs: number, playerRef: { current: BgmPlayerState }): number {
  const startVolume = audio.volume;
  const startTime = performance.now();

  const step = () => {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(1, elapsed / durationMs);
    audio.volume = startVolume + (targetVolume - startVolume) * progress;

    if (progress < 1) {
      const timer = requestAnimationFrame(step);
      playerRef.current.fadeTimers.push(timer);
    }
  };

  const timer = requestAnimationFrame(step);
  playerRef.current.fadeTimers.push(timer);
  return timer;
}

/** 线性音量淡出 */
function fadeOut(audio: HTMLAudioElement, durationMs: number, playerRef: { current: BgmPlayerState }, onComplete?: () => void): number {
  const startVolume = audio.volume;
  const startTime = performance.now();

  const step = () => {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(1, elapsed / durationMs);
    audio.volume = startVolume * (1 - progress);

    if (progress < 1) {
      const timer = requestAnimationFrame(step);
      playerRef.current.fadeTimers.push(timer);
    } else {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 0;
      onComplete?.();
    }
  };

  const timer = requestAnimationFrame(step);
  playerRef.current.fadeTimers.push(timer);
  return timer;
}

/** 清理所有定时器 */
function clearAllTimers(playerRef: { current: BgmPlayerState }) {
  const state = playerRef.current;
  state.fadeTimers.forEach(id => cancelAnimationFrame(id));
  state.stopTimers.forEach(id => clearTimeout(id));
  state.fadeTimers = [];
  state.stopTimers = [];
}

/** 停止并清理 Audio */
function stopAndCleanup(audio: HTMLAudioElement | null) {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  audio.src = '';
  audio.load();
}

interface UseElderBgmExtra {
  /** 碎片弹窗可见 */
  fragmentToastVisible: boolean;
  /** 护工对话框步骤 */
  caregiverStep: string | null;
  /** 用餐邀请可见 */
  mealInvitation: boolean;
  /** 饿晕对话框可见 */
  faintingDialog: boolean;
  /** 体力耗尽对话框可见 (v6.9) */
  exhaustionDialog?: boolean;
  /** 拨号中 */
  isDialing: boolean;
  /** 视频拨号中 */
  isVideoDialing?: boolean;
  /** 视频未接通 */
  videoCallFailed?: boolean;
  /** 视频通话已接通 */
  videoCallConnected?: boolean;
  /** 聊天气泡可见 */
  chatDialogVisible: boolean;
  /** 来电响铃中 */
  incomingCallActive: boolean;
  /** 过渡状态 */
  transitionState: string;
  /** 移动中 */
  isTraveling: boolean;
  /** 翻相册中 */
  albumActionActive: boolean;
  /** 强制喂食中 */
  forceFeedActive: boolean;
  /** 打营养液中 */
  ivNutritionActive: boolean;
  /** 迷路中 */
  getLostActive: boolean;
  /** 结局阶段 */
  endingPhase: string;
  /** 主结局 CG key */
  endingCgKey: string | undefined;
  /** 是否已进入结局 */
  isEnding: boolean;
}

export function useElderBgm(
  state: ElderGameState,
  extra: UseElderBgmExtra,
  enabled: boolean = true,
) {
  const playerRef = useRef<BgmPlayerState>({
    sceneKey: null,
    sceneAudio: null,
    sceneVolume: 0,
    sceneBaseVolume: 0,
    eventKey: null,
    eventAudio: null,
    endingKey: null,
    endingAudio: null,
    fadeTimers: [],
    stopTimers: [],
    isMuted: false,
  });

  // 清理资源
  useEffect(() => {
    return () => {
      clearAllTimers(playerRef);
      const p = playerRef.current;
      stopAndCleanup(p.sceneAudio);
      stopAndCleanup(p.eventAudio);
      stopAndCleanup(p.endingAudio);
    };
  }, []);

  /* stopEventBgm / stopEndingBgm kept for external use */

  /** 播放场景 BGM */
  const playSceneBgm = useCallback((key: BgmKey, volume: number, fadeInMs: number) => {
    const p = playerRef.current;
    if (p.sceneKey === key && p.sceneAudio) {
      // 同一首，只调整音量
      p.sceneBaseVolume = volume;
      p.sceneVolume = volume;
      if (Math.abs(p.sceneAudio.volume - volume) > 0.01) {
        fadeIn(p.sceneAudio, volume, 500, playerRef);
      }
      return;
    }

    // 切换场景曲目
    const src = BGM_ASSETS[key];
    if (!src) return;

    // 淡出旧曲
    if (p.sceneAudio && p.sceneKey !== null) {
      const oldAudio = p.sceneAudio;
      p.sceneAudio = null;
      p.sceneKey = null;
      fadeOut(oldAudio, fadeInMs * 0.6, playerRef, () => {
        stopAndCleanup(oldAudio);
      });
    }

    // 创建新曲
    const newAudio = createAudio(src, true, 0); // loop=true，从0音量开始
    p.sceneAudio = newAudio;
    p.sceneKey = key;
    p.sceneBaseVolume = volume;
    p.sceneVolume = volume;

    newAudio.play().catch(() => {
      // 自动播放被阻止，静默处理
    });
    fadeIn(newAudio, volume, fadeInMs, playerRef);
  }, []);

  /** 播放事件 BGM */
  const playEventBgm = useCallback((event: BgmEvent) => {
    const p = playerRef.current;
    if (p.eventKey === event.key && p.eventAudio) {
      // 同一事件继续，只调整音量
      if (Math.abs(p.eventAudio.volume - event.volume) > 0.01) {
        fadeIn(p.eventAudio, event.volume, 300, playerRef);
      }
      return;
    }

    // 淡出旧事件
    if (p.eventAudio && p.eventKey !== null) {
      fadeOut(p.eventAudio, 400, playerRef, () => {
        stopAndCleanup(p.eventAudio);
      });
    }

    const src = BGM_ASSETS[event.key];
    if (!src) return;

    const newAudio = createAudio(src, event.loop, 0);
    // 主动拨号铃声加速至1.5倍
    if (event.key === 'callDo') {
      newAudio.playbackRate = 1.5;
    }
    p.eventAudio = newAudio;
    p.eventKey = event.key;

    newAudio.play().catch(() => {});
    fadeIn(newAudio, event.volume, event.fadeInMs, playerRef);

    // 时长控制：如果指定了 stopAfterSeconds 且 > 0
    if (event.stopAfterSeconds > 0) {
      const timer = setTimeout(() => {
        if (p.eventKey === event.key && p.eventAudio === newAudio) {
          fadeOut(newAudio, event.fadeOutMs, playerRef, () => {
            stopAndCleanup(newAudio);
            p.eventAudio = null;
            p.eventKey = null;
          });
        }
      }, event.stopAfterSeconds * 1000) as unknown as number;
      p.stopTimers.push(timer);
    }
  }, []);

  /** 播放结局 BGM */
  const playEndingBgm = useCallback((rule: EndingBgmRule) => {
    const p = playerRef.current;
    if (p.endingKey === rule.key && p.endingAudio) return;

    // 停止事件和场景
    if (p.eventAudio) {
      fadeOut(p.eventAudio, 800, playerRef, () => stopAndCleanup(p.eventAudio));
      p.eventKey = null;
    }
    if (p.sceneAudio) {
      fadeOut(p.sceneAudio, 1000, playerRef, () => stopAndCleanup(p.sceneAudio));
      p.sceneKey = null;
    }

    const src = BGM_ASSETS[rule.key];
    if (!src) return;

    const newAudio = createAudio(src, rule.loop, 0);
    p.endingAudio = newAudio;
    p.endingKey = rule.key;

    newAudio.play().catch(() => {});
    fadeIn(newAudio, rule.volume, rule.fadeInMs, playerRef);

    // 时长控制
    if (rule.stopAfterSeconds > 0) {
      const timer = setTimeout(() => {
        if (p.endingKey === rule.key && p.endingAudio === newAudio) {
          fadeOut(newAudio, rule.fadeOutMs, playerRef, () => {
            stopAndCleanup(newAudio);
            p.endingAudio = null;
            p.endingKey = null;
          });
        }
      }, rule.stopAfterSeconds * 1000) as unknown as number;
      p.stopTimers.push(timer);
    }
  }, []);

  /** 更新场景 ducking 音量 */
  const updateSceneDucking = useCallback((targetVolume: number, fadeMs: number = 500) => {
    const p = playerRef.current;
    if (p.sceneAudio && Math.abs(p.sceneAudio.volume - targetVolume) > 0.01) {
      p.sceneVolume = targetVolume;
      fadeIn(p.sceneAudio, targetVolume, fadeMs, playerRef);
    }
  }, []);

  /** 静音所有 BGM */
  const mute = useCallback(() => {
    const p = playerRef.current;
    p.isMuted = true;
    if (p.sceneAudio) p.sceneAudio.muted = true;
    if (p.eventAudio) p.eventAudio.muted = true;
    if (p.endingAudio) p.endingAudio.muted = true;
  }, []);

  /** 取消静音 */
  const unmute = useCallback(() => {
    const p = playerRef.current;
    p.isMuted = false;
    if (p.sceneAudio) p.sceneAudio.muted = false;
    if (p.eventAudio) p.eventAudio.muted = false;
    if (p.endingAudio) p.endingAudio.muted = false;
  }, []);

  // ═══════════════════════════
  // 主逻辑：响应游戏状态变化
  // ═══════════════════════════
  // 使用时间段代替 gameTime，只在 BGM 边界（整点）触发切换
  const timeSlot = Math.floor(state.gameTime / 60); // 游戏内的小时数，整点变化

  useEffect(() => {
    if (!enabled) return;

    // ── 游戏重置（重新体验）：强制停止所有 BGM ──
    if (state.showOpening) {
      // 结局 BGM 可能在 showOpening=true 时仍然残留播放
      const p = playerRef.current;
      if (p.endingAudio) {
        p.endingAudio.pause();
        p.endingAudio.currentTime = 0;
        p.endingAudio.volume = 0;
        stopAndCleanup(p.endingAudio);
        p.endingAudio = null;
        p.endingKey = null;
      }
      if (p.eventAudio) {
        p.eventAudio.pause();
        stopAndCleanup(p.eventAudio);
        p.eventAudio = null;
        p.eventKey = null;
      }
      if (p.sceneAudio) {
        p.sceneAudio.pause();
        stopAndCleanup(p.sceneAudio);
        p.sceneAudio = null;
        p.sceneKey = null;
      }
      clearAllTimers(playerRef);
      p.sceneVolume = 0;
      p.sceneBaseVolume = 0;
      return; // 开场过场期间不播 BGM
    }

    // ── Layer 2: 结局 BGM（最高优先级） ──
    if (extra.isEnding && extra.endingCgKey) {
      const endingBgm = getEndingBgm(extra.endingCgKey, extra.endingPhase);
      if (endingBgm) {
        playEndingBgm(endingBgm);
        return;
      }
    }

    // ── Layer 1: 事件 BGM ──
    const event = getEventBgm(state, {
      fragmentToastVisible: extra.fragmentToastVisible,
      caregiverStep: extra.caregiverStep,
      mealInvitation: extra.mealInvitation,
      faintingDialog: extra.faintingDialog,
      exhaustionDialog: extra.exhaustionDialog,
      isDialing: extra.isDialing,
      isVideoDialing: extra.isVideoDialing,
      videoCallFailed: extra.videoCallFailed,
      videoCallConnected: extra.videoCallConnected,
      chatDialogVisible: extra.chatDialogVisible,
      incomingCallActive: extra.incomingCallActive,
      transitionState: extra.transitionState,
      isTraveling: extra.isTraveling,
      albumActionActive: extra.albumActionActive,
      forceFeedActive: extra.forceFeedActive,
      ivNutritionActive: extra.ivNutritionActive,
      getLostActive: extra.getLostActive,
    });

    if (event) {
      playEventBgm(event);

      // Ducking: 压低场景音量
      updateSceneDucking(event.duckVolume, 500);

      // 确保场景 BGM 在后台继续播放（只是被压低了音量，不停）
      const hasScene = playerRef.current.sceneAudio && playerRef.current.sceneKey !== null;
      if (!hasScene) {
        // 场景音频意外丢失，重新开始
        const locationId = state.currentLocationId as 'room' | 'corridor' | 'dining' | 'activity' | 'garden' | 'clinic' | 'nurse' | 'phone';
        const closedBgm = getClosedSceneBgm(locationId, state.gameTime);
        const sceneKey = closedBgm ?? getSceneBgm(locationId, state.gameTime);
        playSceneBgm(sceneKey, event.duckVolume, 800);
      }
      return; // 事件覆盖后不执行场景逻辑
    }

    // ── 事件结束：停止事件 BGM ──
    if (playerRef.current.eventKey !== null && playerRef.current.eventAudio) {
      // 立即释放引用，防止竞态重复停止
      const oldEventAudio = playerRef.current.eventAudio;
      const oldFadeMs = 400; // 快速淡出
      playerRef.current.eventKey = null;
      playerRef.current.eventAudio = null;
      fadeOut(oldEventAudio, oldFadeMs, playerRef, () => {
        stopAndCleanup(oldEventAudio);
      });
    }

    // ── Layer 0: 场景 BGM（无事件时以正常音量播放） ──
    const locationId = state.currentLocationId as 'room' | 'corridor' | 'dining' | 'activity' | 'garden' | 'clinic' | 'nurse' | 'phone';

    // 检查场景是否已关闭
    const closedBgm = getClosedSceneBgm(locationId, state.gameTime);
    const sceneKey = closedBgm ?? getSceneBgm(locationId, state.gameTime);
    const baseVolume = getSceneVolume(locationId, state.gameTime);

    // 无事件时不 duck，使用场景基础音量
    const targetVolume = baseVolume;

    // 场景切换或音量恢复
    if (playerRef.current.sceneKey !== sceneKey || !playerRef.current.sceneAudio) {
      // 场景变了（切换地点或时段变化），完整切换
      playSceneBgm(sceneKey, targetVolume, 1200);
    } else if (playerRef.current.sceneAudio) {
      // 同一场景，恢复音量到正常水平
      const currentVol = playerRef.current.sceneAudio.volume;
      if (Math.abs(currentVol - targetVolume) > 0.02) {
        playerRef.current.sceneBaseVolume = targetVolume;
        playerRef.current.sceneVolume = targetVolume;
        fadeIn(playerRef.current.sceneAudio, targetVolume, 600, playerRef);
      }
    } else {
      // 意外丢失，重新创建
      playSceneBgm(sceneKey, targetVolume, 800);
    }

  }, [
    enabled,
    state.showOpening,
    state.currentLocationId,
    timeSlot, // 仅整点变化时触发场景 BGM 切换
    extra.isEnding,
    extra.endingCgKey,
    extra.endingPhase,
    extra.fragmentToastVisible,
    extra.caregiverStep,
    extra.mealInvitation,
    extra.faintingDialog,
    extra.exhaustionDialog,
    extra.isDialing,
    extra.isVideoDialing,
    extra.videoCallFailed,
    extra.videoCallConnected,
    extra.chatDialogVisible,
    extra.incomingCallActive,
    extra.transitionState,
    extra.isTraveling,
    extra.albumActionActive,
    extra.forceFeedActive,
    extra.ivNutritionActive,
    extra.getLostActive,
    state.currentFragmentId,
    state.isEnding,
  ]);

  return { mute, unmute };
}

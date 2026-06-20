/**
 * === 院长模块图片预加载 Hook ===
 *
 * 管理图片预加载状态，提供 imageReadyMap 用于 UI 判断。
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { preloadImage, preloadImages } from '../utils/preloadImages';

/** 关键图片 src 标识 */
export const CRITICAL_IMAGE_KEYS = [
  'officeDay',
  'officeNight',
  'computerFocus',
  'computerFocusNight',
] as const;

/** 监控图片 src 标识 */
export const MONITOR_IMAGE_KEYS = [
  'monitorCorridor',
  'monitorDining',
  'monitorActivityRoom',
] as const;

export interface ImagePreloadState {
  /** 所有关键图片是否都已 ready */
  criticalImagesReady: boolean;
  /** 所有监控图片是否都已 ready */
  monitorImagesReady: boolean;
  /** 单张图片 ready 状态 Map */
  imageReadyMap: Record<string, boolean>;
  /** 预加载关键图片 */
  preloadCritical: () => void;
  /** 预加载监控图片 */
  preloadMonitors: () => void;
  /** 检查并等待指定图片 ready */
  waitForImage: (key: string, timeoutMs?: number) => Promise<boolean>;
}

/**
 * useManagerImagePreload
 *
 * 使用方式：
 * const { imageReadyMap, preloadCritical, preloadMonitors, waitForImage } = useManagerImagePreload(managerAssets);
 *
 * - 挂载后自动调用 preloadCritical()（后台加载，不阻塞渲染）
 * - 需要时调用 preloadMonitors() 加载监控图片
 * - 需要等待某张图片时调用 waitForImage(key)
 */
export function useManagerImagePreload(assets: Record<string, string>): ImagePreloadState {
  const allKeys = [...CRITICAL_IMAGE_KEYS, ...MONITOR_IMAGE_KEYS];

  const [imageReadyMap, setImageReadyMap] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    allKeys.forEach(key => { init[key] = false; });
    return init;
  });

  const readyMapRef = useRef(imageReadyMap);
  const preloadedCriticalRef = useRef(false);
  const preloadedMonitorRef = useRef(false);

  // 同步 ref
  useEffect(() => {
    readyMapRef.current = imageReadyMap;
  }, [imageReadyMap]);

  const markReady = useCallback((key: string) => {
    setImageReadyMap(prev => {
      if (prev[key]) return prev;
      return { ...prev, [key]: true };
    });
  }, []);

  const criticalImagesReady =
    CRITICAL_IMAGE_KEYS.every(key => imageReadyMap[key]);
  const monitorImagesReady =
    MONITOR_IMAGE_KEYS.every(key => imageReadyMap[key]);

  const preloadCritical = useCallback(() => {
    if (preloadedCriticalRef.current) return;
    preloadedCriticalRef.current = true;

    CRITICAL_IMAGE_KEYS.forEach(key => {
      const src = assets[key];
      if (!src) return;
      preloadImage(src).then(() => markReady(key)).catch(() => {});
    });
  }, [assets, markReady]);

  const preloadMonitors = useCallback(() => {
    if (preloadedMonitorRef.current) return;
    preloadedMonitorRef.current = true;

    // 并行预加载三张监控图
    preloadImages(
      MONITOR_IMAGE_KEYS.map(key => assets[key]).filter(Boolean),
    ).then(() => {
      MONITOR_IMAGE_KEYS.forEach(key => markReady(key));
    }).catch(() => {});
  }, [assets, markReady]);

  const waitForImage = useCallback(async (key: string, _timeoutMs = 8000): Promise<boolean> => {
    const src = assets[key];
    if (!src) return false;
    if (readyMapRef.current[key]) return true;

    try {
      await preloadImage(src);
      markReady(key);
      return true;
    } catch {
      // 超时或失败时也返回 false，不阻塞流程
      return false;
    }
  }, [assets, markReady]);

  return {
    criticalImagesReady,
    monitorImagesReady,
    imageReadyMap,
    preloadCritical,
    preloadMonitors,
    waitForImage,
  };
}

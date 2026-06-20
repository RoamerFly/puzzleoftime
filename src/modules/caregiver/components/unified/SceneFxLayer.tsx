/**
 * === SceneFxLayer · FX 素材统一渲染层 ===
 *
 * 按 1672×941 全画布绝对定位，渲染 FX_* PNG 效果素材。
 * CSS 边框保留为无素材或加载失败时的降级样式。
 */

import { caregiverAssets } from '../../assets/assets';
import type { CaregiverAssetEntry } from '../../assets/assets';
import styles from './UnifiedCareScene.module.css';

interface SceneFxLayerProps {
  /** FX_* 素材 key，如 'FX_SCENE_DIM_MASK' */
  effectKey: string;
  /** 可选：额外 CSS 类名 */
  className?: string;
}

export function SceneFxLayer({ effectKey, className }: SceneFxLayerProps) {
  const entry = (caregiverAssets as Record<string, CaregiverAssetEntry>)[effectKey];
  const src = entry?.src;

  if (!src) {
    // 降级：CSS 边框占位
    return <div className={`${styles.sceneFxFallback} ${className ?? ''}`} />;
  }

  return (
    <img
      src={src}
      alt=""
      className={`${styles.sceneFxImage} ${className ?? ''}`}
      draggable={false}
    />
  );
}

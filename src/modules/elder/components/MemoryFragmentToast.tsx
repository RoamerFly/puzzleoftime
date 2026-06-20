/* === 回忆碎片图文弹窗 ===
 *
 * 触发回忆碎片时显示全屏弹窗，包含：
 * - 碎片图片（16:9 比例，加载失败时 CSS 渐变 fallback）
 * - 碎片标题
 * - 碎片描述
 * - 回忆文本（memoryText）
 * - "确认"按钮
 *
 * 弹窗显示时阻止背景点击。支持键盘 Enter/Space 确认。
 */

import { useEffect, useCallback, useState } from 'react';
import type { MemoryFragment } from '../types';
import { getAssetPath, FRAGMENT_PLACEHOLDER_COLORS } from '../data/generatedAssets';

interface MemoryFragmentToastProps {
  fragment: MemoryFragment;
  onConfirm: () => void;
  /** 自动关闭毫秒数（0 = 不自动关闭，默认 0） */
  autoCloseMs?: number;
}

export function MemoryFragmentToast({
  fragment,
  onConfirm,
  autoCloseMs = 0,
}: MemoryFragmentToastProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const imagePath = getAssetPath(fragment.imageKey);
  const placeholderBg = FRAGMENT_PLACEHOLDER_COLORS[fragment.imageKey]
    || 'linear-gradient(135deg, #F5E6C8 0%, #E8D8B8 100%)';

  // 键盘确认
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onConfirm();
    }
  }, [onConfirm]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // 自动关闭
  useEffect(() => {
    if (autoCloseMs > 0) {
      const timer = setTimeout(onConfirm, autoCloseMs);
      return () => clearTimeout(timer);
    }
  }, [autoCloseMs, onConfirm]);

  return (
    <div className="elder-fragment-overlay" onClick={onConfirm}>
      <div
        className="elder-fragment-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`回忆碎片：${fragment.title}`}
      >
        {/* 碎片图片 */}
        <div className="elder-fragment-dialog__image-wrap">
          {imagePath && !imgError ? (
            <img
              src={imagePath}
              alt={fragment.title}
              className={`elder-fragment-dialog__image${imgLoaded ? ' elder-fragment-dialog__image--loaded' : ''}`}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          ) : null}
          {/* CSS fallback */}
          {(!imagePath || imgError) && (
            <div
              className="elder-fragment-dialog__fallback"
              style={{ background: placeholderBg }}
            >
              <span className="elder-fragment-dialog__fallback-icon">📷</span>
            </div>
          )}
          {/* 图片未加载时的占位 */}
          {imagePath && !imgError && !imgLoaded && (
            <div
              className="elder-fragment-dialog__loading"
              style={{ background: placeholderBg }}
            >
              <span className="elder-fragment-dialog__loading-text">加载中...</span>
            </div>
          )}
        </div>

        {/* 文字内容 */}
        <div className="elder-fragment-dialog__content">
          <h2 className="elder-fragment-dialog__title">{fragment.title}</h2>
          <p className="elder-fragment-dialog__desc">{fragment.description}</p>
          <p className="elder-fragment-dialog__text">{fragment.memoryText}</p>
        </div>

        {/* 确认按钮 */}
        <div className="elder-fragment-dialog__actions">
          <button
            className="elder-fragment-dialog__confirm"
            onClick={onConfirm}
            autoFocus
          >
            确认
          </button>
          <span className="elder-fragment-dialog__hint">
            按 Enter 或 Space 快速确认
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * === ClueBubble · 集中式线索弹窗 ===
 *
 * 相对于 sceneBox 居中弹出，不再使用每条线索的 bubbleAnchor 定位。
 *
 * 层叠结构（由底到顶）：
 *   场景背景 → 半透明压暗遮罩 → 当前热点持续脉冲高亮 → 中央弹窗（图+文+按钮）
 *
 * 约束：
 *   - 桌面宽度 320–420px，max min(420px, 100%-32px)，不超过 sceneBox 高度的 70%
 *   - 图片固定 16:9 比例容器，不因加载导致弹窗跳位
 *   - 正文区内容过长时独立滚动
 *   - 手机/竖屏：width calc(100%-24px), max-height 65dvh
 *   - 已记录/未记录使用完全相同的定位规则
 *   - 点击压暗背景（非弹窗区域）可关闭
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import type { PercentRect } from '../../data/unifiedSceneData';
import styles from './UnifiedCareScene.module.css';

export type ClueBubbleState = 'unseen' | 'peeked' | 'recorded';

interface ClueBubbleProps {
  observationText: string;
  clueId: string;
  state: ClueBubbleState;
  /** 线索特写图 URL，有则显示在文本上方固定比例容器中 */
  clueImage?: string | null;
  /** 当前热点 rect（百分比），用于保持热点高亮描边 */
  hotspotRect?: PercentRect;
  onRecord: (clueId: string) => void;
  onClose: (clueId: string) => void;
}

export function ClueBubble({
  observationText,
  clueId,
  state,
  clueImage,
  hotspotRect,
  onRecord,
  onClose,
}: ClueBubbleProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const completeRef = useRef(false);

  // Esc 关闭
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!completeRef.current) {
          completeRef.current = true;
          onClose(clueId);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [clueId, onClose]);

  // 点击压暗背景关闭（仅点击遮罩本身，不冒泡到弹窗）
  const handleDimClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && !completeRef.current) {
        completeRef.current = true;
        onClose(clueId);
      }
    },
    [clueId, onClose],
  );

  const isRecorded = state === 'recorded';

  return (
    <div className={styles.clueCentralOverlay} onClick={handleDimClick}>
      {/* 半透明压暗背景 — 不全屏不透明 */}
      <div className={styles.clueCentralDim} />

      {/* 当前热点持续脉冲高亮 */}
      {hotspotRect && (
        <div
          className={styles.clueCentralHotspot}
          style={{
            top: hotspotRect.top,
            left: hotspotRect.left,
            width: hotspotRect.width,
            height: hotspotRect.height,
          }}
        />
      )}

      {/* 集中弹窗 */}
      <div className={styles.clueCentralPopup}>
        {isRecorded ? (
          /* ── 已记录：图片 + 简化便签（与静态线索回看一致）── */
          <div className={styles.clueCentralRecorded}>
            {clueImage && (
              <div className={styles.clueCentralImage}>
                <img
                  src={clueImage}
                  alt=""
                  className={styles.clueCentralImageImg}
                  onLoad={() => setImageLoaded(true)}
                  style={{ opacity: imageLoaded ? 1 : 0 }}
                />
              </div>
            )}
            <span className={styles.clueBubbleNoteMark}>✓ 已记录</span>
            <p className={styles.clueBubbleNoteText}>
              {observationText.length > 60
                ? observationText.slice(0, 60) + '…'
                : observationText}
            </p>
            <button
              className={styles.clueBubbleBtnClose}
              style={{ marginTop: 8 }}
              onClick={() => {
                if (!completeRef.current) {
                  completeRef.current = true;
                  onClose(clueId);
                }
              }}
            >
              关闭
            </button>
          </div>
        ) : (
          <>
            {/* 图片 — 固定 16:9 比例容器，加载完成后淡入 */}
            {clueImage && (
              <div className={styles.clueCentralImage}>
                <img
                  src={clueImage}
                  alt=""
                  className={styles.clueCentralImageImg}
                  onLoad={() => setImageLoaded(true)}
                  style={{ opacity: imageLoaded ? 1 : 0 }}
                />
              </div>
            )}

            {/* 正文 — 内容过长时独立滚动 */}
            <div className={styles.clueCentralBody}>
              <p className={styles.clueCentralText}>{observationText}</p>
            </div>

            {/* 操作按钮 */}
            <div className={styles.clueCentralActions}>
              <button
                className={styles.clueBubbleBtnRecord}
                onClick={() => {
                  if (!completeRef.current) {
                    completeRef.current = true;
                    onRecord(clueId);
                  }
                }}
              >
                记下
              </button>
              <button
                className={styles.clueBubbleBtnClose}
                onClick={() => {
                  if (!completeRef.current) {
                    completeRef.current = true;
                    onClose(clueId);
                  }
                }}
              >
                关闭
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

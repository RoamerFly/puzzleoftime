/**
 * === HandoverNotebook · 交接手册 ===
 *
 * 待办事项列表风格：仅展示 recorded 线索为已完成状态。
 * 未找到的线索不占位、不显示。
 * 每条 recorded 线索配 emoji 图标 + 已完成划线样式。
 * 支持：✕ 按钮 / 点击遮罩层 / Esc 键 关闭面板。
 */

import { useEffect } from 'react';
import type { UnifiedCareEventScene } from '../../data/unifiedSceneData';
import styles from './UnifiedCareScene.module.css';

interface HandoverNotebookProps {
  scene: UnifiedCareEventScene;
  recordedClueIds: string[];
  onClose: () => void;
}

export function HandoverNotebook({
  scene,
  recordedClueIds,
  onClose,
}: HandoverNotebookProps) {
  const recordedHotspots = scene.observeHotspots.filter((h) =>
    recordedClueIds.includes(h.clueId),
  );

  // Esc 键关闭
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className={styles.notebookOverlay} onClick={onClose}>
      {/* 阻止面板内部点击冒泡到遮罩层 */}
      <div className={styles.notebookPanel} onClick={(e) => e.stopPropagation()}>
        {/* 头部 */}
        <div className={styles.notebookHeader}>
          <h3 className={styles.notebookTitle}>📋 交接手册</h3>
          <button className={styles.notebookCloseBtn} onClick={onClose} title="关闭">
            ✕
          </button>
        </div>

        {/* Batch 4: 仅显示记录数，不提示阈值和理解等级 */}
        <div className={`${styles.notebookInsight} ${styles.notebookInsightNeutral}`}>
          已记下 {recordedHotspots.length} 条线索
        </div>

        {/* 已记录线索列表 —— 仅记录了的才显示 */}
        {recordedHotspots.length === 0 ? (
          <div className={styles.notebookEmpty}>
            还没记下任何线索。<br />
            <small>点击场景中的异常细节，选择"记下"。</small>
          </div>
        ) : (
          <div className={styles.notebookList}>
            {recordedHotspots.map((h) => (
              <div
                key={h.clueId}
                className={`${styles.notebookItem} ${h.isKey ? styles.notebookItemKey : ''}`}
              >
                <span className={styles.notebookCheck}>✓</span>
                <div className={styles.notebookItemBody}>
                  <span className={styles.notebookItemLabel}>
                    {h.emoji} {h.label}
                  </span>
                  <p className={styles.notebookItemText}>{h.shortRecordedText}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

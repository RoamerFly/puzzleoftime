import { useEffect, useCallback } from 'react';
import styles from '../styles/manager.module.css';

interface BulletinBoardProps {
  onClose: () => void;
  /** 动态新增的便签（来自突发事件处理） */
  dynamicNotes?: string[];
}

interface BulletinNote {
  id: string;
  title: string;
  desc: string;
  type: 'budget' | 'check' | 'warning' | 'activity' | 'repair' | 'family' | 'event';
  icon: string;
  isDynamic?: boolean;
}

const STATIC_NOTES: BulletinNote[] = [
  {
    id: 'budget',
    title: '本月可用预算：60',
    desc: '财务月报摘要',
    type: 'budget',
    icon: '💰',
  },
  {
    id: 'check',
    title: '民政安全检查：3天后',
    desc: '请各部门配合准备',
    type: 'check',
    icon: '🏥',
  },
  {
    id: 'warning',
    title: '夜班护理人手紧张',
    desc: '已连续两周超负荷排班',
    type: 'warning',
    icon: '⚠️',
  },
  {
    id: 'activity',
    title: '活动室本周开放次数减少',
    desc: '受人手影响，调整为每周3次',
    type: 'activity',
    icon: '🏓',
  },
  {
    id: 'repair',
    title: '走廊照明维修待排期',
    desc: '3处照明已报修，等待工程部安排',
    type: 'repair',
    icon: '💡',
  },
  {
    id: 'family',
    title: '家属探访反馈待回复',
    desc: '上周有2份家属意见未处理',
    type: 'family',
    icon: '✉️',
  },
];

export function BulletinBoard({ onClose, dynamicNotes = [] }: BulletinBoardProps) {
  // Esc 键关闭
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // 将动态便签转换为 BulletingNote
  const dynamicNotesList: BulletinNote[] = dynamicNotes.map((note, i) => ({
    id: `dyn-${i}`,
    title: note,
    desc: '新更便签',
    type: 'event' as const,
    icon: '🆕',
    isDynamic: true,
  }));

  // 动态便签放在前面
  const allNotes = [...dynamicNotesList, ...STATIC_NOTES];

  return (
    <div className={styles.bulletinFocusOverlay} role="dialog" aria-label="公告板">
      {/* 背景遮罩 — 点击可关闭 */}
      <div className={styles.bulletinFocusBackdrop} onClick={onClose} />

      <section className={styles.bulletinFocusBoard} aria-label="公告板">
        {/* 木框 + 软木板 */}
        <div className={styles.bulletinWoodFrame}>
          {/* 标题栏 */}
          <header className={styles.bulletinBoardHeader}>
            <div className={styles.bulletinHeaderLeft}>
              <span className={styles.bulletinBoardIcon}>📋</span>
              <h2 className={styles.bulletinBoardTitle}>公告板</h2>
            </div>

            <button
              type="button"
              className={styles.bulletinCloseButton}
              onClick={onClose}
              aria-label="关闭公告板"
            >
              ×
            </button>
          </header>

          {/* 软木板内容区 */}
          <div className={styles.bulletinCorkArea}>
            {allNotes.map((note, index) => {
              // 轻微错位旋转（交替方向，整体整洁）
              const rotations = [-2, 1.5, -1.2, 2, -1.5, 1, -2.2, 1.8, -1];
              const rotation = rotations[index % rotations.length];

              return (
                <div
                  key={note.id}
                  className={`${styles.bulletinPinnedNote} ${styles[`bulletinNote_${note.type}`] || ''} ${note.isDynamic ? styles.bulletinNoteNew : ''}`}
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  {/* 图钉装饰 */}
                  <span className={styles.bulletinPin} aria-hidden="true" />

                  <span className={styles.bulletinNoteIcon}>{note.icon}</span>
                  <span className={styles.bulletinNoteTitle}>{note.title}</span>
                  <span className={styles.bulletinNoteDesc}>{note.desc}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 底部关闭按钮 */}
        <button className={styles.bulletinCloseBtn} onClick={onClose}>
          关闭公告板
        </button>
      </section>
    </div>
  );
}

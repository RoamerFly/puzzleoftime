import { useNavigate } from 'react-router-dom';
import { useGame } from '../core/GameContext';
import { Button } from '../components/ui/Button';
import { PageTransition } from '../components/layout/PageTransition';
import { getAllChapters, getTotalChapters } from '../core/chapterRegistry';
import styles from './ChapterSelect.module.css';

const isDev = import.meta.env.DEV;

export function ChapterSelect() {
  const navigate = useNavigate();
  const { isChapterUnlocked, startChapter, completeChapter, resetGame, state } = useGame();
  const chapters = getAllChapters();
  const totalChapters = getTotalChapters();

  const handleChapterClick = (chapterId: string) => {
    if (isChapterUnlocked(chapterId)) {
      startChapter(chapterId);
      navigate(`/chapter/${chapterId}`);
    }
  };

  const isEpilogueUnlocked = state.progress.completedChapters.length >= totalChapters;

  /** [开发调试] 解锁全部章节 */
  const handleDebugUnlockAll = () => {
    const allIds = chapters.map(c => c.chapterId);
    for (const id of allIds) {
      if (!state.progress.completedChapters.includes(id)) {
        completeChapter(id);
      }
    }
  };

  /** [开发调试] 直接试玩第三章 */
  const handleDebugPlayChapter3 = () => {
    const prereqs = ['elder', 'caregiver'];
    for (const id of prereqs) {
      if (!state.progress.completedChapters.includes(id)) {
        completeChapter(id);
      }
    }
    startChapter('manager');
    navigate('/chapter/manager');
  };

  return (
    <PageTransition>
      <div className={styles.container}>
        <header className={styles.header}>
          <Button variant="ghost" size="small" onClick={() => navigate('/')}>
            ← 返回
          </Button>
          <h2 className={styles.title}>📖 章节选择</h2>
          <div style={{ width: 60 }} />
        </header>

        <div className={styles.list}>
          {chapters.map((chapter) => {
            const unlocked = isChapterUnlocked(chapter.chapterId);
            const completed = state.progress.completedChapters.includes(chapter.chapterId);

            return (
              <button
                key={chapter.chapterId}
                className={`${styles.card} ${unlocked ? styles.unlocked : styles.locked} ${completed ? styles.completed : ''}`}
                onClick={() => handleChapterClick(chapter.chapterId)}
                disabled={!unlocked}
              >
                <span className={styles.cardIcon}>
                  {unlocked ? chapter.icon : '🔒'}
                </span>
                <div className={styles.cardInfo}>
                  <span className={styles.cardLabel}>第{chapter.order}章 · {chapter.perspective}</span>
                  <h3 className={styles.cardTitle}>{chapter.title}</h3>
                  <p className={styles.cardSubtitle}>{chapter.subtitle}</p>
                </div>
                {completed && (
                  <span className={styles.completedBadge}>✓ 已完成</span>
                )}
              </button>
            );
          })}

          {/* 终章 */}
          <button
            className={`${styles.card} ${styles.epilogue} ${isEpilogueUnlocked ? styles.unlocked : styles.locked}`}
            onClick={() => isEpilogueUnlocked && navigate('/epilogue')}
            disabled={!isEpilogueUnlocked}
          >
            <span className={styles.cardIcon}>
              {isEpilogueUnlocked ? '🌅' : '🔒'}
            </span>
            <div className={styles.cardInfo}>
              <span className={styles.cardLabel}>终章</span>
              <h3 className={styles.cardTitle}>岁月的答案</h3>
              <p className={styles.cardSubtitle}>完成所有章节后解锁</p>
            </div>
          </button>
        </div>

        {/* [开发调试面板] 仅 dev 环境可见 */}
        {isDev && (
          <div className={styles.debugPanel}>
            <p className={styles.debugTitle}>🛠 开发调试</p>
            <div className={styles.debugActions}>
              <button className={styles.debugBtn} onClick={handleDebugUnlockAll}>
                🔓 解锁全部章节
              </button>
              <button className={styles.debugBtnPrimary} onClick={handleDebugPlayChapter3}>
                ⚖️ 直接试玩第三章
              </button>
              <button className={styles.debugBtnDanger} onClick={resetGame}>
                🗑 清空存档
              </button>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

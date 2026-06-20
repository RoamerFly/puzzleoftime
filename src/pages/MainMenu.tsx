import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../core/GameContext';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { PageTransition } from '../components/layout/PageTransition';
import { ReportBody } from '../components/ui/ReportBody';
import { getAllChapters } from '../core/chapterRegistry';
import type { ChapterConfig } from '../core/chapterRegistry';
import styles from './MainMenu.module.css';

/** 从章节私有状态中提取摘要信息 */
function extractChapterSummary(chapterId: string, chapterState: unknown): string {
  if (!chapterState || typeof chapterState !== 'object') return '';
  const s = chapterState as Record<string, unknown>;

  if (chapterId === 'elder') {
    const frags = Array.isArray(s.collectedFragments) ? s.collectedFragments.length : 0;
    const gameTime = typeof s.gameTime === 'number' ? s.gameTime : 0;
    const hour = Math.floor(6 + gameTime / 60) % 24;
    const min = gameTime % 60;
    return `收集了 ${frags} 个回忆碎片 · 结束时 ${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }
  if (chapterId === 'caregiver') {
    const report = s.historyReport;
    if (report && typeof report === 'object') {
      const r = report as Record<string, unknown>;
      const stats = r.stats as Record<string, unknown> | undefined;
      const label = typeof r.label === 'string' ? r.label : '';
      const ratio = stats?.understandingRatio ?? '?';
      const success = stats?.successInterventions ?? '?';
      return label
        ? `${label} · 理解率 ${ratio}% · 合适干预 ${success} 次`
        : `理解率 ${ratio}% · 合适干预 ${success} 次`;
    }
    const tasks = Array.isArray(s.completedTasks) ? s.completedTasks.length : 0;
    return `完成了 ${tasks} 项任务`;
  }
  if (chapterId === 'manager') {
    // 优先从 historyReport 中读取摘要
    const report = s.historyReport;
    if (report && typeof report === 'object') {
      const r = report as Record<string, unknown>;
      const primaryTag = typeof r.primaryTag === 'string' ? r.primaryTag : '';
      const approvedCount = Array.isArray(r.approvedItems) ? r.approvedItems.length : '?';
      return primaryTag ? `决策倾向: ${primaryTag} · 批准${approvedCount}项` : `批准项目: ${approvedCount} 项`;
    }
    const budget = typeof s.remainingBudget === 'number' ? s.remainingBudget : '?';
    return `剩余预算: ${budget} 分`;
  }
  return '';
}

export function MainMenu() {
  const navigate = useNavigate();
  const { startChapter, state, dispatch } = useGame();
  const allChapters = getAllChapters();

  // 模态框状态
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [selectedRole, setSelectedRole] = useState<ChapterConfig | null>(null);

  // 历史面板状态
  const [showHistory, setShowHistory] = useState(false);
  // 报告弹窗
  const [reportEntry, setReportEntry] = useState<{
    config: ChapterConfig;
    chapterState: unknown;
    completedAt?: string;
  } | null>(null);

  // 历史记录 — 全部来自 playHistory（栈模型：进行中 + 已完成）
  const historyEntries = useMemo(() => {
    const entries: {
      id: string;
      config: ChapterConfig;
      summary: string;
      status: 'completed' | 'in-progress';
      startedAt: string;
      completedAt?: string;
      chapterState: unknown;
    }[] = [];

    for (const entry of state.progress.playHistory) {
      const config = allChapters.find(c => c.chapterId === entry.chapterId);
      if (!config) continue;
      entries.push({
        id: entry.id,
        config,
        summary: extractChapterSummary(entry.chapterId, entry.state),
        status: entry.status,
        startedAt: entry.startedAt,
        completedAt: entry.completedAt,
        chapterState: entry.state,
      });
    }

    // 排序：进行中在前，已完成按完成时间倒序，进行中按开始时间倒序
    return entries.sort((a, b) => {
      if (a.status !== b.status) return a.status === 'in-progress' ? -1 : 1;
      const timeA = a.status === 'completed' ? (a.completedAt ?? '') : a.startedAt;
      const timeB = b.status === 'completed' ? (b.completedAt ?? '') : b.startedAt;
      return timeB.localeCompare(timeA);
    });
  }, [state.progress.playHistory, allChapters]);

  // 恢复进度
  const handleResume = (chapterId: string) => {
    startChapter(chapterId);
    navigate(`/chapter/${chapterId}`, { state: { resume: true } });
  };

  // 查看报告
  const handleViewReport = (entry: { config: ChapterConfig; chapterState: unknown; completedAt?: string }) => {
    setReportEntry(entry);
  };

  // 删除记录
  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_PLAYTHROUGH', id });
  };

  // 打开角色选择
  const handleStartGame = () => {
    setShowRoleSelect(true);
    setSelectedRole(null);
  };

  // 选择一个角色（进入详情预览）
  const handleSelectRole = (chapter: ChapterConfig) => {
    setSelectedRole(chapter);
  };

  // 返回角色列表
  const handleBackToRoles = () => {
    setSelectedRole(null);
  };

  // 确认开始游戏 — 入栈新记录 + 清除工作状态
  const handleConfirmRole = () => {
    if (!selectedRole) return;
    setShowRoleSelect(false);
    setSelectedRole(null);
    // 入栈：创建新的进行中记录
    dispatch({ type: 'START_PLAYTHROUGH', chapterId: selectedRole.chapterId });
    // 清除旧的工作状态，确保章节从初始开始
    dispatch({ type: 'UPDATE_CHAPTER_STATE', chapterId: selectedRole.chapterId, payload: undefined as unknown });
    startChapter(selectedRole.chapterId);
    navigate(`/chapter/${selectedRole.chapterId}`);
  };

  // 关闭模态框
  const handleCloseModal = () => {
    setShowRoleSelect(false);
    setSelectedRole(null);
  };

  return (
    <PageTransition>
      <div className={styles.container}>
        <div className={styles.texture} />

        {/* ── 终章入口 ── */}
        <button
          className={styles.epilogueEntry}
          onClick={() => navigate('/epilogue')}
        >
          📊 进入终章
        </button>

        {/* ── 历史体验按钮 ── */}
        <button
          className={`${styles.historyToggle} ${showHistory ? styles.historyToggleActive : ''}`}
          onClick={() => setShowHistory(!showHistory)}
        >
          📜 历史体验
        </button>

        {showHistory && (
          <div className={styles.historyPanel}>
            <h3 className={styles.historyTitle}>历史体验</h3>
            {historyEntries.length === 0 ? (
              <p className={styles.historyEmpty}>暂无体验记录</p>
            ) : (
              <div className={styles.historyList}>
                {historyEntries.map(({ id, config, summary, status, startedAt, completedAt, chapterState }) => (
                  <div key={id} className={styles.historyItem}>
                    <span className={styles.historyIcon}>{config.icon}</span>
                    <div className={styles.historyInfo}>
                      <div className={styles.historyHeader}>
                        <span className={styles.historyName}>{config.title}</span>
                        <div className={styles.historyHeaderRight}>
                          <span className={`${styles.historyStatus} ${status === 'in-progress' ? styles.historyStatusActive : ''}`}>
                            {status === 'completed' ? '✓' : '●'}
                          </span>
                          <button
                            className={styles.historyDelete}
                            onClick={(e) => { e.stopPropagation(); handleDelete(id); }}
                            title="删除记录"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <span className={styles.historyTime}>
                        {status === 'completed' && completedAt
                          ? new Date(completedAt).toLocaleString('zh-CN', {
                              month: 'numeric', day: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })
                          : status === 'in-progress'
                            ? `开始于 ${new Date(startedAt).toLocaleString('zh-CN', {
                                month: 'numeric', day: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })}`
                            : ''}
                      </span>
                      {summary && (
                        <span className={styles.historySummary}>{summary}</span>
                      )}
                      {status === 'in-progress' && (
                        <button
                          className={styles.historyResume}
                          onClick={() => handleResume(config.chapterId)}
                        >
                          继续体验 →
                        </button>
                      )}
                      {status === 'completed' && (
                        <button
                          className={styles.historyReport}
                          onClick={() => handleViewReport({ config, chapterState, completedAt })}
                        >
                          查看报告
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 英雄区 ── */}
        <div className={styles.hero}>
          <div className={styles.iconWrap}>
            <span className={styles.icon}>🧩</span>
          </div>
          <h1 className={styles.title}>岁月拼图</h1>
          <p className={styles.subtitle}>适老化关怀 · 互动绘本</p>
          <div className={styles.divider}>
            <span className={styles.dividerDot} />
            <span className={styles.dividerLine} />
            <span className={styles.dividerDot} />
          </div>
          <p className={styles.tagline}>
            每一块碎片，都是一段值得被看见的人生
          </p>
        </div>

        {/* ── 开始游戏按钮 ── */}
        <div className={styles.actions}>
          <Button variant="primary" size="large" onClick={handleStartGame}>
            开始游戏
          </Button>
          <Button variant="ghost" size="medium" onClick={() => navigate('/settings')}>
            ⚙ 设置
          </Button>
        </div>

        {/* ── 底部 ── */}
        <footer className={styles.footer}>
          <p>一款关于理解与陪伴的公益互动体验</p>
        </footer>

        {/* ── 角色选择模态框 ── */}
        <Dialog visible={showRoleSelect} onClose={handleCloseModal}>
          <div className={styles.modal}>
            {!selectedRole ? (
              <>
                <h2 className={styles.modalTitle}>选择体验角色</h2>
                <p className={styles.modalHint}>点击角色卡片查看详情</p>
                <div className={styles.modalRoleGrid}>
                  {allChapters.map(chapter => (
                    <button
                      key={chapter.chapterId}
                      className={styles.modalRoleCard}
                      onClick={() => handleSelectRole(chapter)}
                    >
                      <span className={styles.modalRoleIcon}>{chapter.icon}</span>
                      <span className={styles.modalRoleName}>{chapter.title}</span>
                      <span className={styles.modalRolePerspective}>{chapter.perspective}</span>
                    </button>
                  ))}
                </div>
                <button className={styles.modalClose} onClick={handleCloseModal}>
                  ✕
                </button>
              </>
            ) : (
              <>
                <h2 className={styles.modalTitle}>{selectedRole.title}</h2>
                <div className={styles.modalDetail}>
                  <span className={styles.modalDetailIcon}>{selectedRole.icon}</span>
                  <p className={styles.modalDetailPerspective}>{selectedRole.perspective}</p>
                  <p className={styles.modalDetailDesc}>{selectedRole.subtitle}</p>
                  <div className={styles.modalDetailNarrative}>
                    {selectedRole.narrativeBefore.map((line, i) => (
                      <p key={i} className={styles.modalDetailLine}>{line}</p>
                    ))}
                  </div>
                </div>
                <div className={styles.modalActions}>
                  <Button variant="secondary" size="medium" onClick={handleBackToRoles}>
                    ← 返回
                  </Button>
                  <Button variant="primary" size="large" onClick={handleConfirmRole}>
                    确认选择
                  </Button>
                </div>
                <button className={styles.modalClose} onClick={handleBackToRoles}>
                  ✕
                </button>
              </>
            )}
          </div>
        </Dialog>

        {/* ── 查看报告弹窗 ── */}
        <Dialog visible={!!reportEntry} onClose={() => setReportEntry(null)}>
          {reportEntry && (
            <div className={`${styles.modal} ${styles.reportModal}`}>
              <h2 className={styles.modalTitle}>
                {reportEntry.config.icon} {reportEntry.config.title}
                {reportEntry.completedAt && (
                  <span style={{ fontSize: '0.7em', opacity: 0.6, marginLeft: '0.5em' }}>
                    {new Date(reportEntry.completedAt).toLocaleString('zh-CN', {
                      month: 'numeric', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                )}
              </h2>
              <div className={styles.reportContent}>
                <ReportBody
                  chapterId={reportEntry.config.chapterId}
                  chapterState={reportEntry.chapterState}
                />
              </div>
              <button className={styles.modalClose} onClick={() => setReportEntry(null)}>✕</button>
            </div>
          )}
        </Dialog>
      </div>
    </PageTransition>
  );
}

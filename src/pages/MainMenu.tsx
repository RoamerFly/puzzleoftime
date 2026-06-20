import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../core/GameContext';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { PageTransition } from '../components/layout/PageTransition';
import { getAllChapters } from '../core/chapterRegistry';
import type { ChapterConfig } from '../core/chapterRegistry';
import type { ManagerHistoryReport } from '../modules/manager';
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

/** 类型守卫：判断一个值是否为有效的 ManagerHistoryReport */
function isManagerHistoryReport(value: unknown): value is ManagerHistoryReport {
  if (!value || typeof value !== 'object') return false;
  const r = value as Record<string, unknown>;
  return typeof r.version === 'string'
    && typeof r.primaryTag === 'string'
    && typeof r.secondaryTag === 'string'
    && typeof r.remainingBudget === 'number'
    && typeof r.indicators === 'object';
}

export function MainMenu() {
  const navigate = useNavigate();
  const { startChapter, state } = useGame();
  const allChapters = getAllChapters();

  // 模态框状态
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [selectedRole, setSelectedRole] = useState<ChapterConfig | null>(null);

  // 历史面板状态
  const [showHistory, setShowHistory] = useState(false);
  // 报告弹窗
  const [reportChapter, setReportChapter] = useState<ChapterConfig | null>(null);

  // 历史记录（已完成 + 进行中）
  const historyEntries = useMemo(() => {
    const entries: {
      config: ChapterConfig;
      summary: string;
      status: 'completed' | 'in-progress';
    }[] = [];

    // 已完成
    for (const id of state.progress.completedChapters) {
      const config = allChapters.find(c => c.chapterId === id);
      if (!config) continue;
      const chapterState = state.progress.chapters[id];
      entries.push({ config, summary: extractChapterSummary(id, chapterState), status: 'completed' });
    }

    // 进行中（有保存状态但未完成）
    for (const id of Object.keys(state.progress.chapters)) {
      if (state.progress.completedChapters.includes(id)) continue;
      const config = allChapters.find(c => c.chapterId === id);
      if (!config) continue;
      const chapterState = state.progress.chapters[id];
      entries.push({ config, summary: extractChapterSummary(id, chapterState), status: 'in-progress' });
    }

    return entries;
  }, [state.progress.completedChapters, state.progress.chapters, allChapters]);

  // 恢复进度
  const handleResume = (chapterId: string) => {
    startChapter(chapterId);
    navigate(`/chapter/${chapterId}`, { state: { resume: true } });
  };

  // 查看报告
  const handleViewReport = (chapter: ChapterConfig) => {
    setReportChapter(chapter);
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

  // 确认开始游戏
  const handleConfirmRole = () => {
    if (!selectedRole) return;
    setShowRoleSelect(false);
    setSelectedRole(null);
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
                {historyEntries.map(({ config, summary, status }) => (
                  <div key={config.chapterId} className={styles.historyItem}>
                    <span className={styles.historyIcon}>{config.icon}</span>
                    <div className={styles.historyInfo}>
                      <div className={styles.historyHeader}>
                        <span className={styles.historyName}>{config.title}</span>
                        <span className={`${styles.historyStatus} ${status === 'in-progress' ? styles.historyStatusActive : ''}`}>
                          {status === 'completed' ? '✓' : '●'}
                        </span>
                      </div>
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
                          onClick={() => handleViewReport(config)}
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
        <Dialog visible={!!reportChapter} onClose={() => setReportChapter(null)}>
          {reportChapter && (
            <div className={`${styles.modal} ${styles.reportModal}`}>
              <h2 className={styles.modalTitle}>
                {reportChapter.icon} {reportChapter.title}
              </h2>
              <div className={styles.reportContent}>
                {(() => {
                  const cs = state.progress.chapters[reportChapter.chapterId];
                  if (!cs || typeof cs !== 'object') return <p>暂无详细数据</p>;
                  const s = cs as Record<string, unknown>;

                  if (reportChapter.chapterId === 'elder') {
                    const frags = Array.isArray(s.collectedFragments) ? s.collectedFragments.length : 0;
                    const gt = typeof s.gameTime === 'number' ? s.gameTime : 0;
                    const h = Math.floor(6 + gt / 60) % 24;
                    const m = gt % 60;
                    const status = s.status as Record<string, number> | undefined;
                    return (
                      <>
                        <p className={styles.reportStatus}>状态：已完成 ✓</p>
                        <div className={styles.reportSummary}>
                          <div className={styles.reportGrid}>
                            <div className={styles.reportItem}>
                              <span className={styles.reportLabel}>收集回忆碎片</span>
                              <span className={styles.reportValue}>{frags} 个</span>
                            </div>
                            <div className={styles.reportItem}>
                              <span className={styles.reportLabel}>结束时间</span>
                              <span className={styles.reportValue}>{String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}</span>
                            </div>
                            {status && (
                              <>
                                <div className={styles.reportItem}>
                                  <span className={styles.reportLabel}>体力</span>
                                  <span className={styles.reportValue}>{status.energy ?? '?'}</span>
                                </div>
                                <div className={styles.reportItem}>
                                  <span className={styles.reportLabel}>心情</span>
                                  <span className={styles.reportValue}>{status.mood ?? '?'}</span>
                                </div>
                                <div className={styles.reportItem}>
                                  <span className={styles.reportLabel}>健康</span>
                                  <span className={styles.reportValue}>{status.health ?? '?'}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </>
                    );
                  }

                  if (reportChapter.chapterId === 'manager') {
                    const report = s.historyReport;
                    if (!report || !isManagerHistoryReport(report)) {
                      // 旧存档兼容：没有 historyReport
                      return (
                        <>
                          <p className={styles.reportStatus}>状态：已完成 ✓</p>
                          <div className={styles.reportLegacyNote}>
                            <p>该记录来自旧版本，未保存详细决策报告。</p>
                            <p>重新体验第三章后即可生成完整报告。</p>
                          </div>
                        </>
                      );
                    }

                    const riskLabel = report.reputationRisk === 'low' ? '低' : report.reputationRisk === 'medium' ? '中' : '高';
                    const riskClass = report.reputationRisk === 'high' ? styles.managerReportRiskHigh : report.reputationRisk === 'medium' ? styles.managerReportRiskMedium : styles.managerReportRiskLow;

                    return (
                      <div className={styles.managerReport}>
                        <p className={styles.reportStatus}>状态：已完成 ✓</p>

                        {/* 标签 */}
                        <div className={styles.managerReportTags}>
                          <span className={styles.managerReportTagPrimary}>{report.primaryTag}</span>
                          <span className={styles.managerReportTagSecondary}>{report.secondaryTag}</span>
                        </div>

                        {/* 决策概况 */}
                        <div className={styles.managerReportSection}>
                          <h3 className={styles.managerReportSectionTitle}>决策概况</h3>
                          <div className={styles.managerReportGrid}>
                            <div className={styles.managerReportGridItem}>
                              <span className={styles.managerReportGridLabel}>批准项目</span>
                              <span className={styles.managerReportGridValue}>{report.approvedItems.length} 项</span>
                            </div>
                            <div className={styles.managerReportGridItem}>
                              <span className={styles.managerReportGridLabel}>剩余预算</span>
                              <span className={styles.managerReportGridValue}>{report.remainingBudget} / {report.totalBudget} 分</span>
                            </div>
                            <div className={styles.managerReportGridItem}>
                              <span className={styles.managerReportGridLabel}>突发事件</span>
                              <span className={styles.managerReportGridValue}>{report.workEventsCompleted} 个</span>
                            </div>
                            <div className={styles.managerReportGridItem}>
                              <span className={styles.managerReportGridLabel}>临时调整</span>
                              <span className={styles.managerReportGridValue}>{report.adjustmentUsed} 次</span>
                            </div>
                            <div className={styles.managerReportGridItem}>
                              <span className={styles.managerReportGridLabel}>信誉风险</span>
                              <span className={`${styles.managerReportGridValue} ${riskClass}`}>{riskLabel}</span>
                            </div>
                          </div>
                        </div>

                        {/* 批准项目明细 */}
                        {report.approvedItems.length > 0 && (
                          <div className={styles.managerReportSection}>
                            <h3 className={styles.managerReportSectionTitle}>批准预算项目</h3>
                            <div className={styles.managerReportBudgetList}>
                              {report.approvedItems.map(item => (
                                <div key={item.id} className={styles.managerReportBudgetItem}>
                                  <span className={styles.managerReportBudgetName}>{item.title}</span>
                                  <span className={styles.managerReportBudgetCost}>{item.cost} 分</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 资源天平 */}
                        <div className={styles.managerReportSection}>
                          <h3 className={styles.managerReportSectionTitle}>⚖️ 资源天平</h3>
                          <div className={styles.managerReportScale}>
                            <div className={styles.managerReportScaleSide}>
                              <span className={styles.managerReportScaleLabel}>照护质量</span>
                              <span className={styles.managerReportScaleValue}>{report.scale.careQualityScore}</span>
                            </div>
                            <div className={styles.managerReportScaleBar}>
                              <div
                                className={styles.managerReportScaleFill}
                                style={{
                                  width: `${Math.min(100, (report.scale.careQualityScore / (report.scale.careQualityScore + report.scale.operationPressureScore)) * 100)}%`,
                                }}
                              />
                            </div>
                            <div className={styles.managerReportScaleSide}>
                              <span className={styles.managerReportScaleLabel}>运营压力</span>
                              <span className={styles.managerReportScaleValue}>{report.scale.operationPressureScore}</span>
                            </div>
                          </div>
                          <p className={styles.managerReportScaleText}>{report.scale.balanceText}</p>
                        </div>

                        {/* 最终指标 */}
                        <div className={styles.managerReportSection}>
                          <h3 className={styles.managerReportSectionTitle}>最终指标</h3>
                          <div className={styles.managerReportGrid}>
                            <div className={styles.managerReportGridItem}>
                              <span className={styles.managerReportGridLabel}>🛡️ 安全保障</span>
                              <span className={styles.managerReportGridValue}>{report.indicators.safety ?? '?'}</span>
                            </div>
                            <div className={styles.managerReportGridItem}>
                              <span className={styles.managerReportGridLabel}>💜 老人尊严</span>
                              <span className={styles.managerReportGridValue}>{report.indicators.dignity ?? '?'}</span>
                            </div>
                            <div className={styles.managerReportGridItem}>
                              <span className={styles.managerReportGridLabel}>👨‍👩‍👧 家属满意</span>
                              <span className={styles.managerReportGridValue}>{report.indicators.family ?? '?'}</span>
                            </div>
                            <div className={styles.managerReportGridItem}>
                              <span className={styles.managerReportGridLabel}>👩‍⚕️ 护理员压力</span>
                              <span className={styles.managerReportGridValue}>{report.indicators.staff ?? '?'}</span>
                            </div>
                            <div className={styles.managerReportGridItem}>
                              <span className={styles.managerReportGridLabel}>💰 运营成本</span>
                              <span className={styles.managerReportGridValue}>{report.indicators.cost ?? '?'}</span>
                            </div>
                          </div>
                        </div>

                        {/* 突发事件 */}
                        {report.workEvents.length > 0 && (
                          <div className={styles.managerReportSection}>
                            <h3 className={styles.managerReportSectionTitle}>突发事件</h3>
                            {report.workEvents.map((ev, i) => (
                              <div key={i} className={styles.managerReportEventCard}>
                                <div className={styles.managerReportEventHeader}>
                                  <span className={styles.managerReportEventName}>{i + 1}. {ev.title}</span>
                                  <span className={styles.managerReportEventSeverity}>
                                    {ev.severity === 'low' ? '低风险' : ev.severity === 'medium' ? '中风险' : '高风险'}
                                  </span>
                                </div>
                                <p className={styles.managerReportEventDesc}>{ev.description}</p>
                                <p className={styles.managerReportEventOutcome}>
                                  <strong>处理方式：</strong>{ev.chosenOptionLabel}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 四方反馈 */}
                        <div className={styles.managerReportSection}>
                          <h3 className={styles.managerReportSectionTitle}>四方反馈</h3>
                          <div className={styles.managerReportQuadGrid}>
                            <div className={styles.managerReportQuadCard}>
                              <span className={styles.managerReportQuadIcon}>👴</span>
                              <span className={styles.managerReportQuadTitle}>老人</span>
                              <p className={styles.managerReportQuadText}>{report.quadFeedback.elderly}</p>
                            </div>
                            <div className={styles.managerReportQuadCard}>
                              <span className={styles.managerReportQuadIcon}>👨‍👩‍👧</span>
                              <span className={styles.managerReportQuadTitle}>家属</span>
                              <p className={styles.managerReportQuadText}>{report.quadFeedback.family}</p>
                            </div>
                            <div className={styles.managerReportQuadCard}>
                              <span className={styles.managerReportQuadIcon}>👩‍⚕️</span>
                              <span className={styles.managerReportQuadTitle}>护理员</span>
                              <p className={styles.managerReportQuadText}>{report.quadFeedback.caregiver}</p>
                            </div>
                            <div className={styles.managerReportQuadCard}>
                              <span className={styles.managerReportQuadIcon}>🏛️</span>
                              <span className={styles.managerReportQuadTitle}>管理/运营方</span>
                              <p className={styles.managerReportQuadText}>{report.quadFeedback.management}</p>
                            </div>
                          </div>
                        </div>

                        {/* 家庭来电 */}
                        <div className={styles.managerReportSection}>
                          <h3 className={styles.managerReportSectionTitle}>家庭来电</h3>
                          <div className={styles.managerReportFamilyCall}>
                            <p className={styles.managerReportFamilyCallLine}>
                              <strong>来电人：</strong>{report.familyCall.callerLabel}
                            </p>
                            <p className={styles.managerReportFamilyCallLine}>
                              <strong>选择：</strong>{report.familyCall.choiceLabel}
                            </p>
                          </div>
                        </div>

                        {/* 院长内心独白 */}
                        {report.monologue && (
                          <div className={styles.managerReportSection}>
                            <h3 className={styles.managerReportSectionTitle}>院长手记</h3>
                            <div className={styles.managerReportMonologue}>
                              <p>"{report.monologue}"</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  return <p>详细数据：{JSON.stringify(s).slice(0, 100)}</p>;
                })()}
              </div>
              <button className={styles.modalClose} onClick={() => setReportChapter(null)}>✕</button>
            </div>
          )}
        </Dialog>
      </div>
    </PageTransition>
  );
}

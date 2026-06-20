/**
 * === 历史报告内容组件 ===
 * 根据章节 ID 渲染对应的完成报告。
 * 支持 Elder / Caregiver / Manager 三个章节。
 */

import type { ManagerHistoryReport } from '../../modules/manager';
import type { CaregiverHistoryReport } from '../../modules/caregiver';
import styles from './ReportBody.module.css';

interface ReportBodyProps {
  chapterId: string;
  chapterState: unknown;
}

function isManagerReport(v: unknown): v is ManagerHistoryReport {
  if (!v || typeof v !== 'object') return false;
  const r = v as Record<string, unknown>;
  return typeof r.version === 'string'
    && typeof r.primaryTag === 'string'
    && typeof r.indicators === 'object';
}

function isCaregiverReport(v: unknown): v is CaregiverHistoryReport {
  if (!v || typeof v !== 'object') return false;
  const r = v as Record<string, unknown>;
  return typeof r.version === 'string'
    && typeof r.label === 'string'
    && typeof r.stats === 'object'
    && Array.isArray(r.echoes);
}

export function ReportBody({ chapterId, chapterState }: ReportBodyProps) {
  if (!chapterState || typeof chapterState !== 'object') {
    return <p className={styles.emptyHint}>暂无详细数据</p>;
  }
  const s = chapterState as Record<string, unknown>;

  if (chapterId === 'elder') return <ElderReport s={s} />;
  if (chapterId === 'caregiver') return <CaregiverReport s={s} />;
  if (chapterId === 'manager') return <ManagerReport s={s} />;

  return <p className={styles.emptyHint}>暂不支持此章节的报告</p>;
}

/* ======== Elder 报告 ======== */
function ElderReport({ s }: { s: Record<string, unknown> }) {
  const frags = Array.isArray(s.collectedFragments) ? s.collectedFragments.length : 0;
  const gt = typeof s.gameTime === 'number' ? s.gameTime : 0;
  const h = Math.floor(6 + gt / 60) % 24;
  const m = gt % 60;
  const status = s.status as Record<string, number> | undefined;
  const endingResult = s.endingResult as Record<string, unknown> | undefined;
  const mainEnding = endingResult?.mainEnding as Record<string, string> | undefined;
  const endingLabel = mainEnding?.label ?? null;

  return (
    <div className={styles.report}>
      <p className={styles.status}>🧩 老人的一日 · 已完成 ✓</p>

      {/* 结局类型 */}
      {endingLabel && (
        <div className={styles.elderEndingTag}>
          <span className={styles.elderEndingIcon}>🌅</span>
          <span>{endingLabel}</span>
        </div>
      )}

      {/* 统计卡片 */}
      <div className={styles.section}>
        <div className={styles.statGrid}>
          <div className={styles.statItem}>
            <span className={styles.statIcon}>🧩</span>
            <span className={styles.statNumber}>{frags}</span>
            <span className={styles.statLabel}>回忆碎片</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statIcon}>🕐</span>
            <span className={styles.statNumber}>{String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}</span>
            <span className={styles.statLabel}>结束时刻</span>
          </div>
        </div>
      </div>

      {/* 身心状态 */}
      {status && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>身心状态</h3>
          <div className={styles.barList}>
            <div className={styles.barItem}>
              <span className={styles.barLabel}>💪 体力</span>
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ width: `${Math.min(100, (status.energy ?? 0))}%`, backgroundColor: '#6b8e4e' }} />
              </div>
              <span className={styles.barValue}>{status.energy ?? '?'}</span>
            </div>
            <div className={styles.barItem}>
              <span className={styles.barLabel}>💜 心情</span>
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ width: `${Math.min(100, (status.mood ?? 0))}%`, backgroundColor: '#c49a3c' }} />
              </div>
              <span className={styles.barValue}>{status.mood ?? '?'}</span>
            </div>
            <div className={styles.barItem}>
              <span className={styles.barLabel}>❤️ 健康</span>
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ width: `${Math.min(100, (status.health ?? 0))}%`, backgroundColor: '#b5655a' }} />
              </div>
              <span className={styles.barValue}>{status.health ?? '?'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ======== Caregiver 报告 ======== */
function CaregiverReport({ s }: { s: Record<string, unknown> }) {
  const report = s.historyReport;
  if (!report || !isCaregiverReport(report)) {
    return (
      <div className={styles.report}>
        <p className={styles.status}>📋 护理员的一日 · 已完成 ✓</p>
        <div className={styles.legacyNote}>
          <p>该记录来自旧版本，未保存详细分析报告。</p>
          <p>重新体验第二章后即可生成完整报告。</p>
        </div>
      </div>
    );
  }

  const { stats, echoes, label, subtitle, reflection, handoverRecords } = report;
  const understandingPercent = stats.understandingRatio;
  const successRatio = stats.completedEvents > 0
    ? Math.round((stats.successInterventions / stats.completedEvents) * 100)
    : 0;

  return (
    <div className={styles.report}>
      <p className={styles.status}>📋 护理员的一日 · 已完成 ✓</p>

      {/* 结局标签 */}
      <div className={styles.caregiverEndingTag}>
        <span className={styles.caregiverEndingLabel}>"{label}"</span>
        <p className={styles.caregiverEndingSubtitle}>{subtitle}</p>
      </div>

      {/* 核心统计 */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>📊 班次统计</h3>
        <div className={styles.statGrid}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{stats.completedEvents}/{stats.totalEvents}</span>
            <span className={styles.statLabel}>完成事件</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber} style={{ color: 'var(--color-success)' }}>{stats.successInterventions}</span>
            <span className={styles.statLabel}>合适干预</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{understandingPercent}%</span>
            <span className={styles.statLabel}>理解比例</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber} style={{ color: successRatio >= 60 ? 'var(--color-success)' : 'var(--color-warning)' }}>{successRatio}%</span>
            <span className={styles.statLabel}>干预成功率</span>
          </div>
        </div>

        {/* 干预分布条 */}
        <div className={styles.interventionBar}>
          <div
            className={styles.interventionSuccess}
            style={{ flex: stats.successInterventions || 0.01 }}
            title={`成功 ${stats.successInterventions}`}
          />
          <div
            className={styles.interventionPartial}
            style={{ flex: stats.partialInterventions || 0.01 }}
            title={`部分成功 ${stats.partialInterventions}`}
          />
          <div
            className={styles.interventionFailure}
            style={{ flex: stats.failureInterventions || 0.01 }}
            title={`失败 ${stats.failureInterventions}`}
          />
        </div>
        <div className={styles.interventionLegend}>
          <span>🟢 成功 {stats.successInterventions}</span>
          <span>🟡 部分 {stats.partialInterventions}</span>
          <span>🔴 失败 {stats.failureInterventions}</span>
        </div>
      </div>

      {/* 老人回响 */}
      {echoes.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>👴👵 老人回响</h3>
          <div className={styles.echoList}>
            {echoes.map((echo, i) => (
              <div key={i} className={styles.echoCard}>
                <div className={styles.echoHeader}>
                  <span className={styles.echoName}>
                    {echo.elderName === '王奶奶' ? '👵' : echo.elderName === '李爷爷' ? '👴' : '👩‍🦳'} {echo.elderName}
                  </span>
                  <span className={styles.echoInsight}>
                    {echo.insightLevel >= 2 ? '💡 深刻理解' : echo.insightLevel >= 1 ? '👁️ 有所理解' : '📝 表层记录'}
                  </span>
                </div>
                {echo.saw && (
                  <p className={styles.echoLine}>
                    <span className={styles.echoTag}>看到</span>
                    {echo.saw.length > 60 ? echo.saw.slice(0, 60) + '…' : echo.saw}
                  </p>
                )}
                {echo.did && (
                  <p className={styles.echoLine}>
                    <span className={styles.echoTag}>做了</span>
                    {echo.did.length > 60 ? echo.did.slice(0, 60) + '…' : echo.did}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 交接记录 */}
      {handoverRecords.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>📝 交接记录摘要</h3>
          <div className={styles.handoverList}>
            {handoverRecords.map((rec, i) => (
              <div key={i} className={styles.handoverItem}>
                <span className={styles.handoverElder}>{rec.elderName}</span>
                <span className={styles.handoverText}>
                  {rec.text.length > 48 ? rec.text.slice(0, 48) + '…' : rec.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 反思 */}
      {reflection && (
        <div className={styles.reflection}>
          <p>"{reflection}"</p>
        </div>
      )}
    </div>
  );
}

/* ======== Manager 报告（保持原有视觉结构） ======== */
function ManagerReport({ s }: { s: Record<string, unknown> }) {
  const report = s.historyReport;
  if (!report || !isManagerReport(report)) {
    return (
      <div className={styles.report}>
        <p className={styles.status}>⚖️ 管理者的一日 · 已完成 ✓</p>
        <div className={styles.legacyNote}>
          <p>该记录来自旧版本，未保存详细决策报告。</p>
          <p>重新体验第三章后即可生成完整报告。</p>
        </div>
      </div>
    );
  }

  const riskLabel = report.reputationRisk === 'low' ? '低' : report.reputationRisk === 'medium' ? '中' : '高';
  const riskClass = report.reputationRisk === 'high' ? styles.riskHigh : report.reputationRisk === 'medium' ? styles.riskMedium : styles.riskLow;

  return (
    <div className={styles.report}>
      <p className={styles.status}>⚖️ 管理者的一日 · 已完成 ✓</p>

      {/* 标签 */}
      <div className={styles.tagRow}>
        <span className={styles.tagPrimary}>{report.primaryTag}</span>
        <span className={styles.tagSecondary}>{report.secondaryTag}</span>
      </div>

      {/* 决策概况 */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>📋 决策概况</h3>
        <div className={styles.statGrid}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{report.approvedItems.length}</span>
            <span className={styles.statLabel}>批准项目</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{report.remainingBudget}/{report.totalBudget}</span>
            <span className={styles.statLabel}>剩余预算</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{report.workEventsCompleted}</span>
            <span className={styles.statLabel}>突发事件</span>
          </div>
          <div className={styles.statItem}>
            <span className={`${styles.statNumber} ${riskClass}`}>{riskLabel}</span>
            <span className={styles.statLabel}>信誉风险</span>
          </div>
        </div>
      </div>

      {/* 资源天平 */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>⚖️ 资源天平</h3>
        <div className={styles.scaleRow}>
          <div className={styles.scaleSide}>
            <span className={styles.scaleLabel}>照护质量</span>
            <span className={styles.scaleValue}>{report.scale.careQualityScore}</span>
          </div>
          <div className={styles.scaleBar}>
            <div
              className={styles.scaleFill}
              style={{ width: `${Math.min(100, (report.scale.careQualityScore / (report.scale.careQualityScore + report.scale.operationPressureScore)) * 100)}%` }}
            />
          </div>
          <div className={styles.scaleSide}>
            <span className={styles.scaleLabel}>运营压力</span>
            <span className={styles.scaleValue}>{report.scale.operationPressureScore}</span>
          </div>
        </div>
        <p className={styles.scaleText}>{report.scale.balanceText}</p>
      </div>

      {/* 最终指标 */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>📊 最终指标</h3>
        <div className={styles.statGrid}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{report.indicators.safety ?? '?'}</span>
            <span className={styles.statLabel}>🛡️ 安全保障</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{report.indicators.dignity ?? '?'}</span>
            <span className={styles.statLabel}>💜 老人尊严</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{report.indicators.family ?? '?'}</span>
            <span className={styles.statLabel}>👨‍👩‍👧 家属满意</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{report.indicators.staff ?? '?'}</span>
            <span className={styles.statLabel}>👩‍⚕️ 护理员压力</span>
          </div>
        </div>
      </div>

      {/* 批准项目 */}
      {report.approvedItems.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>✅ 批准预算项目</h3>
          <div className={styles.budgetList}>
            {report.approvedItems.map(item => (
              <div key={item.id} className={styles.budgetItem}>
                <span className={styles.budgetName}>{item.title}</span>
                <span className={styles.budgetCost}>{item.cost} 分</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 四方反馈 */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>💬 四方反馈</h3>
        <div className={styles.quadGrid}>
          <div className={styles.quadCard}>
            <span className={styles.quadTitle}>👴 老人</span>
            <p className={styles.quadText}>{report.quadFeedback.elderly}</p>
          </div>
          <div className={styles.quadCard}>
            <span className={styles.quadTitle}>👨‍👩‍👧 家属</span>
            <p className={styles.quadText}>{report.quadFeedback.family}</p>
          </div>
          <div className={styles.quadCard}>
            <span className={styles.quadTitle}>👩‍⚕️ 护理员</span>
            <p className={styles.quadText}>{report.quadFeedback.caregiver}</p>
          </div>
          <div className={styles.quadCard}>
            <span className={styles.quadTitle}>🏛️ 管理方</span>
            <p className={styles.quadText}>{report.quadFeedback.management}</p>
          </div>
        </div>
      </div>

      {/* 家庭来电 */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>📞 家庭来电</h3>
        <div className={styles.familyCallCard}>
          <p className={styles.familyCallLine}>
            <strong>来电人：</strong>{report.familyCall.callerLabel}
          </p>
          <p className={styles.familyCallLine}>
            <strong>选择：</strong>{report.familyCall.choiceLabel}
          </p>
        </div>
      </div>

      {/* 院长手记 */}
      {report.monologue && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>✍️ 院长手记</h3>
          <div className={styles.monologue}>
            <p>"{report.monologue}"</p>
          </div>
        </div>
      )}
    </div>
  );
}

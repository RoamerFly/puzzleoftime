/**
 * === 第二章结算面板（线性时间线版） ===
 * 午间总结：统计识破需求数、合适干预次数、交接记录质量。
 *
 * @deprecated 已被 CorridorBreath + CaregiverEnding 替代。
 *             保留文件仅供参考，勿接入渲染流程。
 */

import type { HandoverRecord } from '../data/caregiverState';
import type { Chapter2Summary } from '../logic/summaryRules';
import styles from '../styles/caregiver.module.css';

interface Chapter2SummaryPanelProps {
  summary: Chapter2Summary;
  records: HandoverRecord[];
  onComplete: () => void;
}

export function Chapter2SummaryPanel({
  summary,
  records,
  onComplete,
}: Chapter2SummaryPanelProps) {
  const {
    ending,
    completedEventCount,
    totalEventCount,
    understoodEventCount,
    successInterventionCount,
    partialInterventionCount,
    failureInterventionCount,
    understandingRatio,
    riskTags,
    understoodElders,
  } = summary;

  const understandingPercent = Math.round(understandingRatio * 100);

  return (
    <div className={`caregiver-scene-root ${styles.gameContent}`}>
      <div className={styles.phasePanel}>
        <h2 className={styles.phaseTitle}>📋 午间交接总结</h2>
        <p className={styles.phaseIntro}>
          一个上午结束了。这是你今天的交接手册。
        </p>

        {/* 统计卡片区 */}
        <div className={styles.summaryStatGrid}>
          <div className={styles.summaryStat}>
            <span className={styles.summaryStatNumber}>
              {completedEventCount}/{totalEventCount}
            </span>
            <span className={styles.summaryStatLabel}>完成事件</span>
          </div>
          <div className={styles.summaryStat}>
            <span className={styles.summaryStatNumber}>{understoodEventCount}</span>
            <span className={styles.summaryStatLabel}>理解事件</span>
          </div>
          <div className={styles.summaryStat}>
            <span className={styles.summaryStatNumber}>
              {successInterventionCount}
            </span>
            <span className={styles.summaryStatLabel}>合适干预</span>
          </div>
          <div className={styles.summaryStat}>
            <span className={styles.summaryStatNumber}>
              {understandingPercent}%
            </span>
            <span className={styles.summaryStatLabel}>理解比例</span>
          </div>
        </div>

        {/* 干预分布 */}
        <div className={styles.summaryStatGrid}>
          <div className={styles.summaryStat}>
            <span className={styles.summaryStatNumber} style={{ color: 'var(--color-success)' }}>
              {successInterventionCount}
            </span>
            <span className={styles.summaryStatLabel}>成功</span>
          </div>
          <div className={styles.summaryStat}>
            <span className={styles.summaryStatNumber} style={{ color: 'var(--color-warning)' }}>
              {partialInterventionCount}
            </span>
            <span className={styles.summaryStatLabel}>部分成功</span>
          </div>
          <div className={styles.summaryStat}>
            <span className={styles.summaryStatNumber} style={{ color: 'var(--color-danger)' }}>
              {failureInterventionCount}
            </span>
            <span className={styles.summaryStatLabel}>失败</span>
          </div>
        </div>

        {/* 记录列表 */}
        {records.length > 0 && (
          <div className={styles.summaryRecordList}>
            <h3 className={styles.summarySectionTitle}>你的交接笔记</h3>
            {records.map((r, i) => (
              <div
                key={i}
                className={`${styles.summaryRecordCard} ${styles.summaryRecordUnderstanding}`}
              >
                <div className={styles.summaryRecordHeader}>
                  <span className={styles.summaryRecordElder}>{r.elderName}</span>
                  <span className={styles.summaryRecordType}>交接记录</span>
                </div>
                <p className={styles.summaryRecordText}>{r.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* 结局评价 */}
        <div className={styles.summaryEnding}>
          <h3 className={styles.summaryEndingLabel}>
            {ending.label}（理解率 {understandingPercent}%）
          </h3>
          <div className={styles.summaryEndingNarrative}>
            {ending.narrative.map((line, i) => (
              <p key={i} className={styles.summaryEndingLine}>
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* 洞察 */}
        {riskTags.length > 0 && (
          <div className={styles.managerBridge}>
            <h3 className={styles.managerBridgeTitle}>🔑 你今天洞察到的深层问题</h3>
            <p className={styles.managerBridgeIntro}>
              以下来自你的理解记录——它们不是数据，是你亲眼看到、亲耳听到的事。
            </p>
            <div className={styles.managerBridgeTags}>
              {riskTags.map((item, i) => (
                <div key={i} className={styles.managerBridgeTag}>
                  <span className={styles.managerBridgeTagLabel}>
                    📌 {item.tag}
                  </span>
                  <span className={styles.managerBridgeTagSource}>{item.source}</span>
                </div>
              ))}
            </div>
            {understoodElders.length > 0 && (
              <p className={styles.managerBridgeElders}>
                你的理解覆盖了 {understoodElders.length} 位老人：
                {understoodElders.join('、')}。
              </p>
            )}
          </div>
        )}

        {riskTags.length === 0 && (
          <div className={styles.managerBridge}>
            <h3 className={styles.managerBridgeTitle}>🔑 今日洞察</h3>
            <p className={styles.managerBridgeIntro}>
              交接手册上记了流程和数据。老人的故事——还在那些没有被写下的细节里。
            </p>
          </div>
        )}

        {/* 反思 */}
        <div className={styles.summaryNextHint}>
          <p>{ending.nextChapterHint}</p>
        </div>

        <button className={styles.confirmBtn} onClick={onComplete}>
          结束上午
        </button>
      </div>
    </div>
  );
}

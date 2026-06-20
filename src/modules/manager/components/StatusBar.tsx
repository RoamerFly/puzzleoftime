import type { InfoModule, ManagerPhase } from '../data/managerState';
import styles from '../styles/manager.module.css';

interface StatusBarProps {
  currentPhase: string;
  remainingBudget: number;
  totalBudget: number;
  viewedInfoModules: InfoModule[];
  adjustmentRemaining: number;
  reputationRisk: string;
  phoneRinging?: boolean;
  phaseHint?: string;
  phase?: ManagerPhase;
}

export function StatusBar({
  remainingBudget,
  totalBudget,
  viewedInfoModules,
  adjustmentRemaining,
  reputationRisk,
  phoneRinging = false,
  phaseHint = '',
  phase = 'office',
}: StatusBarProps) {
  const minViewed = 2;
  const viewedCount = viewedInfoModules.length;

  const riskLabel = reputationRisk === 'low' ? '低' : reputationRisk === 'medium' ? '中' : '高';

  const tipText = phaseHint || '及时查看报表，掌握运营情况。';

  // 计算今日待办已完成任务数（复用 TodoPanel 中的判断逻辑）
  const isReportTaskDone = viewedInfoModules.includes('report');
  const hasViewedAnotherInfo = ['mail', 'monitor', 'notification', 'bulletin'].some((key) =>
    viewedInfoModules.includes(key as InfoModule),
  );
  const budgetSubmitted =
    phase !== 'office' &&
    phase !== 'computer' &&
    phase !== 'infoReview' &&
    phase !== 'firstBudget';
  const completedTaskCount = [isReportTaskDone, hasViewedAnotherInfo, budgetSubmitted].filter(Boolean).length;

  return (
    <div className={styles.statusBar}>
      <div className={styles.statusBarLeft}>
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>已完成任务</span>
          <span className={styles.statusValue}>
            {completedTaskCount}/3
          </span>
        </div>
        <span className={styles.statusSep}>|</span>
        {phoneRinging && (
          <>
            <div className={`${styles.statusItem} ${styles.statusItemAlert}`}>
              <span className={`${styles.statusValue} ${styles.statusDanger}`}>📞 来电</span>
            </div>
            <span className={styles.statusSep}>|</span>
          </>
        )}
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>预算</span>
          <span className={`${styles.statusValue} ${remainingBudget < 20 ? styles.statusDanger : ''}`}>
            {remainingBudget}/{totalBudget}
          </span>
        </div>
        <span className={styles.statusSep}>|</span>
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>已获取信息</span>
          <span className={`${styles.statusValue} ${viewedCount >= minViewed ? styles.statusGood : styles.statusWarn}`}>
            {Math.min(viewedCount, minViewed)}/{minViewed}
          </span>
        </div>
        <span className={styles.statusSep}>|</span>
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>剩余临时调整次数</span>
          <span className={styles.statusValue}>{adjustmentRemaining}次</span>
        </div>
        <span className={styles.statusSep}>|</span>
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>信誉风险</span>
          <span className={`${styles.statusRiskValue} ${reputationRisk === 'low' ? styles.statusGood : reputationRisk === 'medium' ? styles.statusWarn : styles.statusDanger}`}>
            {riskLabel}
          </span>
        </div>
      </div>
      <div className={styles.statusBarRight}>
        <span className={styles.statusTipIcon}>💡</span>
        <span className={styles.statusTipText} title={tipText}>{tipText}</span>
      </div>
    </div>
  );
}

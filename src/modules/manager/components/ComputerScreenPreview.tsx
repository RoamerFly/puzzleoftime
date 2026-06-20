import type { ComputerTab, InfoModule, ReputationRisk } from '../data/managerState';
import { INDICATORS } from '../data/balanceData';
import styles from '../styles/manager.module.css';

/** 完整指标名 → 短标签映射 */
const SHORT_LABEL_MAP: Record<string, string> = {
  safety: '安全',
  dignity: '尊严',
  cost: '成本',
  staff: '压力',
  family: '家属',
};

interface ComputerScreenPreviewProps {
  activeTab: ComputerTab;
  remainingBudget: number;
  viewedInfoModules: InfoModule[];
  adjustmentRemaining: number;
  reputationRisk: ReputationRisk;
  currentIndicators?: Record<string, number>;
}

const MENU_ITEMS: { tab: ComputerTab; label: string }[] = [
  { tab: 'todo', label: '待办' },
  { tab: 'mail', label: '邮件' },
  { tab: 'report', label: '报表' },
  { tab: 'monitor', label: '监控' },
  { tab: 'notification', label: '通知' },
  { tab: 'budget', label: '预算' },
];

function PreviewHeader() {
  return (
    <div className={styles.computerScreenPreviewHeader}>
      <span className={styles.computerScreenPreviewHeaderDot} />
      <span className={styles.computerScreenPreviewHeaderTitle}>运营管理系统</span>
      <span className={styles.computerScreenPreviewHeaderUser}>院长</span>
    </div>
  );
}

function PreviewSidebar({ activeTab }: { activeTab: ComputerTab }) {
  return (
    <nav className={styles.computerScreenPreviewSidebar}>
      {MENU_ITEMS.map(item => (
        <div
          key={item.tab}
          className={`${styles.computerScreenPreviewMenuItem} ${
            activeTab === item.tab ? styles.computerScreenPreviewMenuItemActive : ''
          }`}
        >
          <span className={styles.computerScreenPreviewMenuItemText}>{item.label}</span>
        </div>
      ))}
    </nav>
  );
}

/* ==================== 各 Tab 缩略预览 ==================== */

function MiniDashboardPreview({
  remainingBudget,
  viewedInfoModules,
}: {
  remainingBudget: number;
  viewedInfoModules: InfoModule[];
}) {
  const viewedCount = viewedInfoModules.length;
  return (
    <div className={styles.computerScreenPreviewMain}>
      <div className={styles.previewSectionTitle}>工作台</div>
      <div className={styles.previewDashboardGrid}>
        <div className={styles.previewCard}>
          <span className={styles.previewCardValue}>60<span className={styles.previewCardUnit}>万</span></span>
          <span className={styles.previewCardLabel}>本月预算</span>
        </div>
        <div className={styles.previewCard}>
          <span className={styles.previewCardValue}>{remainingBudget}<span className={styles.previewCardUnit}>万</span></span>
          <span className={styles.previewCardLabel}>剩余预算</span>
        </div>
        <div className={styles.previewCard}>
          <span className={styles.previewCardValue}>6<span className={styles.previewCardUnit}>项</span></span>
          <span className={styles.previewCardLabel}>待办</span>
        </div>
        <div className={styles.previewCard}>
          <span className={styles.previewCardValue}>{viewedCount}<span className={styles.previewCardUnit}>/2</span></span>
          <span className={styles.previewCardLabel}>已查信息</span>
        </div>
      </div>
      <div className={styles.previewHintBar}>
        <span className={styles.previewHintText}>预算无法覆盖全部问题</span>
      </div>
    </div>
  );
}

function MiniMailPreview() {
  return (
    <div className={styles.computerScreenPreviewMain}>
      <div className={styles.previewSectionTitle}>邮件</div>
      <div className={styles.previewCardRow}>
        <div className={`${styles.previewCard} ${styles.previewCardStrong}`}>
          <span className={styles.previewCardValue}>4<span className={styles.previewCardUnit}>封</span></span>
          <span className={styles.previewCardLabel}>未读</span>
        </div>
      </div>
      <div className={styles.previewMailList}>
        <div className={`${styles.previewMailItem} ${styles.previewMailItemActive}`}>
          <span className={styles.previewMailTag}>家属</span>
          <span className={styles.previewMailSubject}>家属反馈</span>
        </div>
        <div className={styles.previewMailItem}>
          <span className={styles.previewMailTag}>人手</span>
          <span className={styles.previewMailSubject}>人手申请</span>
        </div>
        <div className={styles.previewMailItem}>
          <span className={styles.previewMailTag}>检查</span>
          <span className={styles.previewMailSubject}>检查通知</span>
        </div>
        <div className={styles.previewMailItem}>
          <span className={styles.previewMailTag}>预算</span>
          <span className={styles.previewMailSubject}>预算提醒</span>
        </div>
      </div>
    </div>
  );
}

function MiniReportPreview({
  currentIndicators,
}: {
  currentIndicators?: Record<string, number>;
}) {
  return (
    <div className={styles.computerScreenPreviewMain}>
      <div className={styles.previewSectionTitle}>运营报表</div>
      <div className={styles.previewMetricsList}>
        {INDICATORS.map(ind => {
          const val = currentIndicators?.[ind.id] ?? ind.initialValue;
          const clamped = Math.max(0, Math.min(100, val));
          const label = SHORT_LABEL_MAP[ind.id] ?? ind.name;
          return (
            <div key={ind.id} className={styles.previewMetricRow}>
              <span className={styles.previewMetricLabel}>{label}</span>
              <div className={styles.previewMetricBar}>
                <div
                  className={styles.previewMetricBarFill}
                  style={{ width: `${clamped}%` }}
                />
              </div>
              <span className={styles.previewMetricVal}>{clamped}</span>
            </div>
          );
        })}
      </div>
      <div className={styles.previewHintBar}>
        <span className={styles.previewHintText}>风险上升 需取舍</span>
      </div>
    </div>
  );
}

function MiniMonitorPreview() {
  return (
    <div className={styles.computerScreenPreviewMain}>
      <div className={styles.previewSectionTitle}>监控</div>
      <div className={styles.previewMonitorLayout}>
        <div className={styles.previewMonitorMain}>
          <div className={styles.previewMonitorFrame}>
            <span className={styles.previewMonitorCamId}>01 走廊</span>
          </div>
        </div>
        <div className={styles.previewMonitorSideList}>
          <div className={`${styles.previewMonitorSideCard} ${styles.previewMonitorSideCardActive}`}>
            <span className={styles.previewMonitorSideName}>走廊</span>
          </div>
          <div className={styles.previewMonitorSideCard}>
            <span className={styles.previewMonitorSideName}>餐厅</span>
          </div>
          <div className={styles.previewMonitorSideCard}>
            <span className={styles.previewMonitorSideName}>活动室</span>
          </div>
        </div>
      </div>
      <div className={styles.previewRiskTags}>
        <span className={styles.previewRiskTag}>风险 中</span>
        <span className={styles.previewRiskTag}>照明不足</span>
        <span className={styles.previewRiskTag}>跌倒风险</span>
      </div>
    </div>
  );
}

function MiniNotificationPreview() {
  return (
    <div className={styles.computerScreenPreviewMain}>
      <div className={styles.previewSectionTitle}>通知</div>
      <div className={styles.previewCardRow}>
        <div className={`${styles.previewCard} ${styles.previewCardStrong}`}>
          <span className={styles.previewCardValue}>3<span className={styles.previewCardUnit}>条</span></span>
          <span className={styles.previewCardLabel}>新通知</span>
        </div>
      </div>
      <div className={styles.previewNotificationList}>
        <div className={styles.previewNotificationItem}>
          <span className={`${styles.previewNotificationTag} ${styles.previewNotifTagFlow}`}>流程</span>
          <span className={styles.previewNotificationText}>流程提示</span>
        </div>
        <div className={styles.previewNotificationItem}>
          <span className={`${styles.previewNotificationTag} ${styles.previewNotifTagRisk}`}>风险</span>
          <span className={styles.previewNotificationText}>风险提醒</span>
        </div>
        <div className={styles.previewNotificationItem}>
          <span className={`${styles.previewNotificationTag} ${styles.previewNotifTagRisk}`}>事件</span>
          <span className={styles.previewNotificationText}>事件记录</span>
        </div>
      </div>
    </div>
  );
}

function MiniBudgetPreview({
  remainingBudget,
  viewedInfoModules,
  adjustmentRemaining,
  reputationRisk,
}: {
  remainingBudget: number;
  viewedInfoModules: InfoModule[];
  adjustmentRemaining: number;
  reputationRisk: ReputationRisk;
}) {
  const viewedCount = viewedInfoModules.length;
  const riskLabel = reputationRisk === 'low' ? '低' : reputationRisk === 'medium' ? '中' : '高';
  return (
    <div className={styles.computerScreenPreviewMain}>
      <div className={styles.previewSectionTitle}>预算审批</div>
      <div className={styles.previewDashboardGrid}>
        <div className={`${styles.previewCard} ${styles.previewCardStrong}`}>
          <span className={styles.previewCardValue}>{remainingBudget}<span className={styles.previewCardUnit}>万</span></span>
          <span className={styles.previewCardLabel}>剩余</span>
        </div>
        <div className={styles.previewCard}>
          <span className={styles.previewCardValue}>{viewedCount}<span className={styles.previewCardUnit}>/2</span></span>
          <span className={styles.previewCardLabel}>已查</span>
        </div>
        <div className={styles.previewCard}>
          <span className={styles.previewCardValue}>{adjustmentRemaining}<span className={styles.previewCardUnit}>次</span></span>
          <span className={styles.previewCardLabel}>调整</span>
        </div>
        <div className={styles.previewCard}>
          <span className={styles.previewCardValue}>{riskLabel}</span>
          <span className={styles.previewCardLabel}>风险</span>
        </div>
      </div>
      <div className={styles.previewBudgetProgress}>
        <div className={styles.previewBudgetProgressTrack}>
          <div
            className={styles.previewBudgetProgressFill}
            style={{ width: `${(remainingBudget / 60) * 100}%` }}
          />
        </div>
      </div>
      <div className={styles.previewHintBar}>
        <span className={styles.previewHintText}>本月预算审批中</span>
      </div>
    </div>
  );
}

/* ==================== 主组件 ==================== */

function renderPreviewByTab(props: ComputerScreenPreviewProps) {
  switch (props.activeTab) {
    case 'mail':
      return <MiniMailPreview />;
    case 'report':
      return <MiniReportPreview currentIndicators={props.currentIndicators} />;
    case 'monitor':
      return <MiniMonitorPreview />;
    case 'notification':
      return <MiniNotificationPreview />;
    case 'budget':
      return (
        <MiniBudgetPreview
          remainingBudget={props.remainingBudget}
          viewedInfoModules={props.viewedInfoModules}
          adjustmentRemaining={props.adjustmentRemaining}
          reputationRisk={props.reputationRisk}
        />
      );
    case 'todo':
    default:
      return (
        <MiniDashboardPreview
          remainingBudget={props.remainingBudget}
          viewedInfoModules={props.viewedInfoModules}
        />
      );
  }
}

export function ComputerScreenPreview(props: ComputerScreenPreviewProps) {
  return (
    <div className={styles.computerScreenPreview}>
      <PreviewHeader />
      <div className={styles.computerScreenPreviewBody}>
        <PreviewSidebar activeTab={props.activeTab} />
        {renderPreviewByTab(props)}
      </div>
    </div>
  );
}

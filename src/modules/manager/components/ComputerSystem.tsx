import type { ComputerTab, InfoModule, ManagerPhase, ReputationRisk } from '../data/managerState';
import type { BudgetChoice } from '../data/balanceData';
import type { WorkEvent } from '../data/eventData';
import { INDICATORS, TOTAL_BUDGET, getIndicatorLabel } from '../data/balanceData';
import { StatusBar } from './StatusBar';
import { MonitorPanel } from './MonitorPanel';
import { BudgetApprovalPanel } from './BudgetApprovalPanel';
import { useState } from 'react';
import styles from '../styles/manager.module.css';

interface ComputerSystemProps {
  currentTab: ComputerTab;
  onTabChange: (tab: ComputerTab) => void;
  onClose: () => void;
  remainingBudget: number;
  selectedChoices: string[];
  indicators: Record<string, number>;
  viewedInfoModules: InfoModule[];
  canSubmitBudget: boolean;
  submitBlockedReason: string;
  onChoiceToggle: (choice: BudgetChoice) => void;
  onConfirmComplete: () => void;
  adjustmentRemaining: number;
  reputationRisk: ReputationRisk;
  /** 预算审批模式 */
  budgetMode?: 'first' | 'adjustment';
  /** 调整模式专用 */
  committedChoiceIds?: string[];
  activeWorkEvents?: WorkEvent[];
  suggestedChoiceIds?: string[];
  onRevoke?: (choiceId: string) => ReputationRisk;
  onAddInAdjustment?: (choice: BudgetChoice) => void;
  /** 动态系统通知 */
  systemNotifications?: string[];
  /** 是否有电话在响起 */
  phoneRinging?: boolean;
  /** 阶段引导提示 */
  phaseHint?: string;
  /** 今日待办下一步文本 */
  nextActionText?: string;
  /** 嵌入模式：在显示器屏幕内渲染，不带外层容器 */
  embedded?: boolean;
  /** 当前阶段 */
  phase?: ManagerPhase;
  /** 游戏内时间显示文本 */
  gameTimeText?: string;
  /** 音频：播放音效 */
  playSfx?: (sfxKey: 'uiClick' | 'uiConfirm' | 'uiError' | 'notification' | 'reportGenerate' | 'computerPowerOn' | 'phoneRing' | 'phonePickup' | 'phoneHangup' | 'phoneDialing' | 'phoneConnected') => void;
}

const MENU_ITEMS: { tab: ComputerTab; label: string; icon: string }[] = [
  { tab: 'todo', label: '今日待办', icon: '📋' },
  { tab: 'mail', label: '邮件', icon: '✉️' },
  { tab: 'report', label: '运营报表', icon: '📊' },
  { tab: 'monitor', label: '监控', icon: '🖥️' },
  { tab: 'notification', label: '系统通知', icon: '🔔' },
  { tab: 'budget', label: '预算审批', icon: '🧾' },
];

export function ComputerSystem({
  currentTab,
  onTabChange,
  onClose,
  remainingBudget,
  selectedChoices,
  indicators,
  viewedInfoModules,
  canSubmitBudget,
  submitBlockedReason,
  onChoiceToggle,
  onConfirmComplete,
  adjustmentRemaining,
  reputationRisk,
  budgetMode = 'first',
  committedChoiceIds = [],
  activeWorkEvents = [],
  suggestedChoiceIds = [],
  onRevoke,
  onAddInAdjustment,
  systemNotifications = [],
  phoneRinging = false,
  phaseHint = '',
  nextActionText = '',
  embedded = false,
  phase = 'office',
  gameTimeText = '',
  playSfx,
}: ComputerSystemProps) {
  const viewedCount = viewedInfoModules.length;

  // 邮件已读状态：点击即已读
  const [readMailIds, setReadMailIds] = useState<string[]>([]);
  const allMailIds = ['mail-0', 'mail-1', 'mail-2', 'mail-3'];
  const unreadMailCount = allMailIds.filter((id) => !readMailIds.includes(id)).length;

  const riskLabel = reputationRisk === 'low' ? '低' : reputationRisk === 'medium' ? '中' : '高';
  const riskClass = reputationRisk === 'low' ? styles.riskBadgeLow
    : reputationRisk === 'medium' ? styles.riskBadgeMedium
    : styles.riskBadgeHigh;

  const systemContent = (
    <>
      {/* 窗口标题栏 */}
      <div className={styles.computerTitleBar}>
        <div className={styles.computerTitleLeft}>
          <span className={styles.computerTitleIcon}>◆</span>
          <span className={styles.computerTitleText}>养老院运营管理系统</span>
          <span className={styles.computerTitleSep}>|</span>
          <span className={styles.computerTitleSub}>院长工作台</span>
          {budgetMode === 'adjustment' ? (
            <>
              <span className={styles.computerTitleSep}>·</span>
              <span className={styles.computerTitleStatus}>预算调整中</span>
            </>
          ) : (
            <>
              <span className={styles.computerTitleSep}>·</span>
              <span className={styles.computerTitleStatus}>本月预算审批中</span>
            </>
          )}
          <span className={styles.computerTitleSep}>|</span>
          <span className={styles.computerTitleDate}>{gameTimeText || '2024-05-16 周四 10:24'}</span>
        </div>
        <div className={styles.windowActions}>
          <button
            type="button"
            className={styles.returnOfficeButton}
            onClick={onClose}
            aria-label="返回办公室"
            title="返回办公室"
          >
            <span className={styles.returnOfficeIcon} aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.5 2.5L2 7L6.5 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 7H14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                <rect x="9" y="1" width="5" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                <rect x="9" y="9" width="5" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
            </span>
            <span>返回办公室</span>
          </button>
        </div>
      </div>

      {/* 主体：左侧菜单 + 内容区 + 右侧摘要 */}
      <div className={styles.computerBody}>
        {/* 左侧模块导航 */}
        <nav className={styles.computerSidebar}>
          <div className={styles.sidebarNavGroup}>
            {MENU_ITEMS.map(item => (
              <button
                key={item.tab}
                className={`${styles.sidebarItem} ${currentTab === item.tab ? styles.sidebarItemActive : ''}`}
                onClick={() => { playSfx?.('uiClick'); onTabChange(item.tab); }}
              >
                <span className={styles.sidebarItemIcon}>{item.icon}</span>
                <span className={styles.sidebarItemLabel}>{item.label}</span>
                {item.tab === 'mail' && unreadMailCount > 0 && (
                  <span className={styles.notificationDot} />
                )}
                {item.tab === 'notification' && !viewedInfoModules.includes('notification') && (
                  <span className={styles.notificationDot} />
                )}
              </button>
            ))}
          </div>
          {/* 用户状态块 */}
          <div className={styles.sidebarUserBlock}>
            <span className={styles.sidebarUserDot} />
            <span className={styles.sidebarUserName}>院长</span>
            <span className={styles.sidebarUserStatus}>在线</span>
          </div>
        </nav>

        {/* 中间内容区 */}
        <div className={styles.computerContent}>
          {currentTab === 'todo' && (
            <TodoPanel
              onViewReport={() => onTabChange('report')}
              nextActionText={nextActionText}
              onNavigate={onTabChange}
              unreadMailCount={unreadMailCount}
              viewedInfoModules={viewedInfoModules}
              phase={phase}
            />
          )}
          {currentTab === 'mail' && (
            <MailPanel
              readMailIds={readMailIds}
              onReadChange={setReadMailIds}
              allMailIds={allMailIds}
            />
          )}
          {currentTab === 'report' && <ReportPanel indicators={indicators} />}
          {currentTab === 'monitor' && <MonitorPanel />}
          {currentTab === 'notification' && (
            <NotificationPanel
              systemNotifications={systemNotifications}
              phoneRinging={phoneRinging}
            />
          )}
          {currentTab === 'budget' && (
            <BudgetApprovalPanel
              selectedChoices={selectedChoices}
              remainingBudget={remainingBudget}
              indicators={indicators}
              canSubmit={canSubmitBudget}
              submitBlockedReason={submitBlockedReason}
              onChoiceToggle={onChoiceToggle}
              onConfirm={onConfirmComplete}
              mode={budgetMode}
              committedChoiceIds={committedChoiceIds}
              adjustmentRemaining={adjustmentRemaining}
              reputationRisk={reputationRisk}
              activeWorkEvents={activeWorkEvents}
              suggestedChoiceIds={suggestedChoiceIds}
              onRevoke={onRevoke}
              onAddInAdjustment={onAddInAdjustment}
              playSfx={playSfx}
            />
          )}
        </div>

        {/* 右侧摘要栏 */}
        <aside className={styles.computerRightSidebar}>
          {/* 预算总览 */}
          <div className={styles.rightSidebarCard}>
            <p className={styles.rightSidebarCardTitle}>💰 预算总览</p>
            <div className={styles.rightSidebarItem}>
              <span className={styles.rightSidebarLabel}>总预算</span>
              <span className={styles.rightSidebarValue}>{TOTAL_BUDGET} 万元</span>
            </div>
            <div className={styles.rightSidebarItem}>
              <span className={styles.rightSidebarLabel}>剩余</span>
              <span className={styles.rightSidebarValueHighlight}>{remainingBudget} 万元</span>
            </div>
            <div className={styles.rightSidebarProgressWrap}>
              <div className={styles.rightSidebarProgressTrack}>
                <div
                  className={styles.rightSidebarProgressFill}
                  style={{ width: `${Math.min(100, (remainingBudget / TOTAL_BUDGET) * 100)}%` }}
                />
              </div>
              <span className={styles.rightSidebarProgressLabel}>
                {Math.round((remainingBudget / TOTAL_BUDGET) * 100)}%
              </span>
            </div>
          </div>

          {/* 进度 */}
          <div className={styles.rightSidebarCard}>
            <p className={styles.rightSidebarCardTitle}>📊 进度</p>
            <div className={styles.rightSidebarItem}>
              <span className={styles.rightSidebarLabel}>已查看信息</span>
              <span className={`${styles.rightSidebarValue} ${viewedCount >= 2 ? styles.rightSidebarValueGood : styles.rightSidebarValueWarn}`}>
                {viewedCount}/2
              </span>
            </div>
            <div className={styles.rightSidebarItem}>
              <span className={styles.rightSidebarLabel}>剩余临时调整次数</span>
              <span className={styles.rightSidebarValue}>{adjustmentRemaining}</span>
            </div>
            <div className={styles.rightSidebarItem}>
              <span className={styles.rightSidebarLabel}>信誉风险</span>
              <span className={`${styles.rightSidebarRiskBadge} ${riskClass}`}>{riskLabel}</span>
            </div>
          </div>

          {phoneRinging && (
            <div className={`${styles.rightSidebarCard} ${styles.rightSidebarCardUrgent}`}>
              <p className={styles.rightSidebarCardTitle}>📞 电话</p>
              <p className={styles.rightSidebarPulseText}>正在响起...</p>
            </div>
          )}

          {/* 流程引导 */}
          <div className={styles.rightSidebarCard}>
            <p className={styles.rightSidebarCardTitle}>📖 流程引导</p>
            <p className={styles.rightSidebarHint}>
              {phaseHint || '查看运营报表后提交预算方案'}
            </p>
          </div>

          {/* 风险提醒 */}
          <div className={styles.rightSidebarCard}>
            <p className={styles.rightSidebarCardTitle}>⚠️ 风险提醒</p>
            <div className={styles.rightSidebarWarnTags}>
              <span className={styles.rightSidebarWarnTag}>夜间照明</span>
              <span className={styles.rightSidebarWarnTag}>护理人手</span>
              <span className={styles.rightSidebarWarnTag}>家属反馈</span>
              <span className={styles.rightSidebarWarnTag}>检查倒计时</span>
            </div>
          </div>
        </aside>
      </div>

      {/* 底部状态栏 */}
      <StatusBar
        currentPhase="computer"
        remainingBudget={remainingBudget}
        totalBudget={TOTAL_BUDGET}
        viewedInfoModules={viewedInfoModules}
        adjustmentRemaining={adjustmentRemaining}
        reputationRisk={reputationRisk}
        phoneRinging={phoneRinging}
        phaseHint={phaseHint}
        phase={phase}
      />
    </>
  );

  // 嵌入模式：内容直接填充显示器屏幕，外层由 ManagerScene 的 monitorScreen 容器提供
  if (embedded) {
    return (
      <div className={styles.computerEmbedded}>
        {systemContent}
      </div>
    );
  }

  // 独立模式（保留以备后用）
  return (
    <div className={styles.computerOverlay}>
      <div className={styles.computerScreen}>
        {systemContent}
      </div>
    </div>
  );
}

/* ==================== 子面板 ==================== */

function TodoPanel({
  onViewReport,
  nextActionText = '',
  onNavigate,
  unreadMailCount = 4,
  viewedInfoModules = [],
  phase = 'office',
}: {
  onViewReport: () => void;
  nextActionText?: string;
  onNavigate?: (tab: ComputerTab) => void;
  unreadMailCount?: number;
  viewedInfoModules?: InfoModule[];
  phase?: ManagerPhase;
}) {
  /** 根据按钮文本推断跳转目标 Tab */
  const getNextTab = (): ComputerTab | null => {
    if (!nextActionText) return 'report';
    if (nextActionText.includes('运营报表') || nextActionText.includes('报表')) return 'report';
    if (nextActionText.includes('邮件')) return 'mail';
    if (nextActionText.includes('监控')) return 'monitor';
    if (nextActionText.includes('通知')) return 'notification';
    if (nextActionText.includes('预算审批') || nextActionText.includes('预算')) return 'budget';
    // 默认跳运营报表
    return 'report';
  };

  const handleNextClick = () => {
    const targetTab = getNextTab();
    if (targetTab && onNavigate) {
      onNavigate(targetTab);
    } else {
      onViewReport();
    }
  };

  // 任务完成判断
  const isReportTaskDone = viewedInfoModules.includes('report');
  const hasViewedAnotherInfo = ['mail', 'monitor', 'notification', 'bulletin'].some((key) =>
    viewedInfoModules.includes(key as InfoModule),
  );
  // 第一轮预算已提交：phase 已进入 workEventCall 或之后
  const budgetSubmitted =
    phase !== 'office' &&
    phase !== 'computer' &&
    phase !== 'infoReview' &&
    phase !== 'firstBudget';

  interface TodoTask {
    id: string;
    index: number;
    label: string;
    done: boolean;
    required?: boolean;
  }

  const todoTasks: TodoTask[] = [
    {
      id: 'report',
      index: 1,
      label: '查看运营报表',
      done: isReportTaskDone,
      required: true,
    },
    {
      id: 'info',
      index: 2,
      label: '查看邮件、监控、系统通知或公告板中的任意一项',
      done: hasViewedAnotherInfo,
    },
    {
      id: 'budget',
      index: 3,
      label: '前往预算审批提交本月预算方案',
      done: budgetSubmitted,
    },
  ];

  // 第一个未完成任务即为"当前"任务
  const firstIncompleteId = todoTasks.find((task) => !task.done)?.id;

  return (
    <div className={styles.todoSection}>
      <h3 className={styles.todoSectionTitle}>工作台首页</h3>

      {/* 当前任务清单 */}
      <div className={styles.todoBlock}>
        <p className={styles.todoBlockTitle}>当前任务</p>
        <ul className={styles.todoTaskList}>
          {todoTasks.map((task) => {
            const isDone = task.done;
            const isCurrent = task.id === firstIncompleteId;

            return (
              <li
                key={task.id}
                className={`${styles.todoTaskItem} ${isDone ? styles.todoTaskCompleted : ''} ${isCurrent ? styles.todoTaskCurrent : ''}`}
              >
                <span className={`${styles.todoTaskNum} ${isDone ? styles.todoTaskNumDone : ''}`}>
                  {isDone ? '✓' : task.index}
                </span>
                <span className={styles.todoTaskLabel}>{task.label}</span>
                {isDone && <span className={styles.todoTaskDoneBadge}>已完成</span>}
                {isCurrent && !isDone && task.required && (
                  <span className={styles.todoTaskTag}>必看</span>
                )}
                {isCurrent && !isDone && !task.required && (
                  <span className={styles.todoTaskCurrentBadge}>当前</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* 运营摘要四宫格卡片 */}
      <div className={styles.todoBlock}>
        <p className={styles.todoBlockTitle}>运营摘要</p>
        <div className={styles.todoSummaryGrid}>
          <div className={styles.dashboardCard}>
            <div className={styles.dashboardCardIcon} style={{ background: 'rgba(112, 219, 214, 0.13)' }}>
              <span>💰</span>
            </div>
            <div className={styles.dashboardCardContent}>
              <span className={styles.dashboardCardValue}>60<span className={styles.dashboardCardUnit}> 万元</span></span>
              <span className={styles.dashboardCardLabel}>本月可用预算</span>
            </div>
          </div>
          <div className={styles.dashboardCard}>
            <div className={styles.dashboardCardIcon} style={{ background: 'rgba(218, 160, 64, 0.13)' }}>
              <span>📝</span>
            </div>
            <div className={styles.dashboardCardContent}>
              <span className={styles.dashboardCardValue}>6<span className={styles.dashboardCardUnit}> 项</span></span>
              <span className={styles.dashboardCardLabel}>待审批事项</span>
            </div>
          </div>
          <div className={styles.dashboardCard}>
            <div className={styles.dashboardCardIcon} style={{ background: 'rgba(114, 222, 216, 0.13)' }}>
              <span>✉️</span>
            </div>
            <div className={styles.dashboardCardContent}>
              <span className={styles.dashboardCardValue}>{unreadMailCount}<span className={styles.dashboardCardUnit}> 封</span></span>
              <span className={styles.dashboardCardLabel}>未读邮件</span>
            </div>
          </div>
          <div className={styles.dashboardCard}>
            <div className={styles.dashboardCardIcon} style={{ background: 'rgba(223, 128, 106, 0.13)' }}>
              <span>⚠️</span>
            </div>
            <div className={styles.dashboardCardContent}>
              <span className={styles.dashboardCardValueRisk}>2<span className={styles.dashboardCardUnit}> 项</span></span>
              <span className={styles.dashboardCardLabel}>风险提醒</span>
            </div>
          </div>
        </div>
      </div>

      {/* 风险标签 */}
      <div className={styles.todoRiskTags}>
        <span className={styles.todoRiskTag}>夜间照明</span>
        <span className={styles.todoRiskTag}>护理人手</span>
        <span className={styles.todoRiskTag}>家属反馈</span>
        <span className={styles.todoRiskTag}>检查倒计时</span>
      </div>

      {/* 下一步按钮 */}
      <div className={styles.todoNext}>
        <button className={styles.todoNextBtn} onClick={handleNextClick}>
          <span className={styles.todoNextBtnIcon}>📌</span>
          <span className={styles.todoNextBtnText}>
            {nextActionText || '下一步：查看运营报表'}
          </span>
          <span className={styles.todoNextBtnArrow}>▶</span>
        </button>
      </div>
    </div>
  );
}

interface MailPanelProps {
  readMailIds: string[];
  onReadChange: React.Dispatch<React.SetStateAction<string[]>>;
  allMailIds: string[];
}

const MAILS = [
  {
    id: 'mail-0',
    from: '家属 · 张爷爷的女儿',
    subject: '关于老人活动减少的反馈',
    summary: '活动室开放时间减少，老人需要社交和精神生活',
    body: '最近来探望爸爸，他说活动室开放的时间少了，大部分时间都在房间里看电视。希望能恢复一些活动安排，老人们也需要社交和精神生活。',
    related: ['老人尊严', '家属满意'],
    sourceLabel: '家属反馈',
    time: '今日 09:15',
    avatar: '👨‍👧',
  },
  {
    id: 'mail-1',
    from: '护理员 · 小刘',
    subject: '夜班人手不足申请',
    summary: '夜班巡护压力很大，走廊又暗',
    body: '院长好，最近夜班只有两人值班，走廊又暗，巡护压力很大。上周李大爷差点在走廊滑倒。希望能增加夜班人手或改善照明。',
    related: ['安全保障', '护理员压力'],
    sourceLabel: '护理员申请',
    time: '昨日 23:42',
    avatar: '👩‍⚕️',
  },
  {
    id: 'mail-2',
    from: '管理部门 · 区民政局',
    subject: '本月安全整改检查通知',
    summary: '检查组3天后到院，请提前准备相关材料',
    body: '根据年度计划，检查组将在3天后到贵院进行安全整改检查。请提前准备好消防设备、安全通道、护理记录等相关材料。',
    related: ['安全保障', '运营成本'],
    sourceLabel: '管理部门通知',
    time: '昨日 15:30',
    avatar: '🏛️',
  },
  {
    id: 'mail-3',
    from: '财务 · 王会计',
    subject: '本月预算压缩提醒',
    summary: '预算60分进一步收紧，优先安全合规',
    body: '本月可用预算为60分，较上月进一步收紧。请在提交方案时优先考虑安全与合规相关投入，暂缓非紧急改善项目。',
    related: ['运营成本'],
    sourceLabel: '财务提醒',
    time: '5月14日',
    avatar: '🧮',
  },
];

function MailPanel({ readMailIds, onReadChange, allMailIds }: MailPanelProps) {
  const [selectedMailId, setSelectedMailId] = useState(MAILS[0].id);
  const unreadCount = allMailIds.filter((id) => !readMailIds.includes(id)).length;
  const allRead = unreadCount === 0;

  const handleSelectMail = (mailId: string) => {
    setSelectedMailId(mailId);
    // 点击即已读
    onReadChange((prev) => (prev.includes(mailId) ? prev : [...prev, mailId]));
  };

  const handleMarkAllRead = () => {
    onReadChange([...allMailIds]);
  };

  const activeMail = MAILS.find((m) => m.id === selectedMailId) ?? MAILS[0];
  const isActiveRead = readMailIds.includes(activeMail.id);

  return (
    <div className={styles.mailContentArea}>
      {/* 标题 + 工具栏 */}
      <div className={styles.mailHeader}>
        <div className={styles.mailHeaderMain}>
          <span className={styles.mailHeaderIcon}>✉</span>
          <span className={styles.mailHeaderTitle}>院内邮箱</span>
          <span className={`${styles.mailUnreadSummary} ${allRead ? styles.mailUnreadSummaryClear : ''}`}>
            {allRead ? '全部已读' : `${unreadCount}封未读`}
          </span>
        </div>
        {!allRead && (
          <button
            type="button"
            className={styles.markAllReadButton}
            onClick={handleMarkAllRead}
          >
            <span className={styles.markAllReadIcon}>✓</span>
            全部标为已读
          </button>
        )}
      </div>

      <div className={styles.mailPanelWrapper}>
        {/* 左侧邮件列表面板 */}
        <div className={styles.mailListPanel}>
          <div className={styles.mailCards}>
            {MAILS.map((mail) => {
              const isRead = readMailIds.includes(mail.id);
              const isActive = mail.id === selectedMailId;
              return (
                <button
                  key={mail.id}
                  className={`${styles.mailCard} ${isRead ? styles.mailCardRead : styles.mailCardUnread} ${isActive ? styles.mailCardActive : ''}`}
                  onClick={() => handleSelectMail(mail.id)}
                >
                  <div className={styles.mailCardTop}>
                    <span className={styles.mailCardSender}>
                      {!isRead && <span className={styles.mailUnreadDot} />}
                      <span className={`${styles.mailCardSenderName} ${!isRead ? styles.mailCardSenderNameBold : ''}`}>{mail.from}</span>
                    </span>
                    <span className={styles.mailCardTime}>{mail.time}</span>
                  </div>
                  <span className={`${styles.mailCardSubject} ${!isRead ? styles.mailCardSubjectBold : ''}`}>{mail.subject}</span>
                  <span className={styles.mailCardPreview}>{mail.summary}</span>
                  <div className={styles.mailCardTags}>
                    {mail.related.map(tag => (
                      <span key={tag} className={styles.mailCardTag}>{tag}</span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 右侧邮件详情面板 */}
        <div className={styles.mailDetailPanel}>
          {/* 来源信息区 */}
          <div className={styles.mailDetailHeader}>
            <div className={styles.mailDetailIdentity}>
              <span className={styles.mailAvatar}>{activeMail.avatar}</span>
              <div className={styles.mailDetailIdentityInfo}>
                <span className={styles.mailDetailFromText}>{activeMail.from}</span>
                <span className={styles.mailDetailSourceRow}>
                  <span className={styles.mailTypeBadge}>{activeMail.sourceLabel}</span>
                </span>
              </div>
            </div>
            <span className={`${styles.mailReadBadge} ${isActiveRead ? styles.mailReadBadgeDone : ''}`}>
              {isActiveRead ? '已查阅' : '未读'}
            </span>
          </div>

          {/* 邮件标题 */}
          <h4 className={styles.mailDetailTitle}>{activeMail.subject}</h4>

          {/* 元信息区 */}
          <div className={styles.mailDetailMeta}>
            <span className={styles.mailDetailMetaItem}>
              <span className={styles.mailDetailMetaIcon}>🕐</span>
              <span className={styles.mailDetailMetaKey}>时间</span>
              <span className={styles.mailDetailMetaValue}>{activeMail.time}</span>
            </span>
            <span className={styles.mailDetailMetaSep} />
            <span className={styles.mailDetailMetaItem}>
              <span className={styles.mailDetailMetaIcon}>📂</span>
              <span className={styles.mailDetailMetaKey}>类型</span>
              <span className={styles.mailDetailMetaValue}>{activeMail.sourceLabel}</span>
            </span>
            <span className={styles.mailDetailMetaSep} />
            <span className={styles.mailDetailMetaItem}>
              <span className={styles.mailDetailMetaIcon}>⚡</span>
              <span className={styles.mailDetailMetaKey}>优先级</span>
              <span className={styles.mailDetailMetaValue}>普通</span>
            </span>
          </div>

          {/* 正文纸张面板 */}
          <div className={styles.mailBodyPaper}>
            <div className={styles.mailBodyPaperInner}>
              <p className={styles.mailBodyText}>{activeMail.body}</p>
            </div>
          </div>

          {/* 关联指标区 */}
          <div className={styles.mailMetricSection}>
            <span className={styles.mailMetricIcon}>📎</span>
            <span className={styles.mailMetricLabel}>关联指标</span>
            <div className={styles.mailMetricTags}>
              {activeMail.related.map(tag => (
                <span key={tag} className={styles.mailMetricTag}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportPanel({ indicators }: { indicators: Record<string, number> }) {
  const trendMap: Record<string, string> = {
    safety: '近两周夜间走廊风险上升',
    dignity: '活动室使用率下降，老人外出活动减少',
    cost: '本月预算空间继续收紧',
    staff: '夜班加班频率偏高',
    family: '探访反馈中"沟通不及时"增加',
  };

  const getLevelClass = (indId: string, val: number) => {
    const isReversed = indId === 'staff' || indId === 'cost';
    if (isReversed) {
      if (val < 40) return styles.reportLevelGood;
      if (val < 60) return styles.reportLevelWarn;
      return styles.reportLevelDanger;
    }
    if (val >= 75) return styles.reportLevelGood;
    if (val >= 40) return styles.reportLevelWarn;
    return styles.reportLevelDanger;
  };

  return (
    <div className={styles.infoPanel}>
      <h3 className={styles.sectionTitle}>月度运营诊断</h3>
      <p className={styles.reportSubtitle}>本月核心指标概览</p>
      <div className={styles.reportTable}>
        <div className={styles.reportHeader}>
          <span className={styles.reportCol}>指标</span>
          <span className={styles.reportCol}>当前值</span>
          <span className={styles.reportCol}>等级</span>
          <span className={styles.reportCol}>趋势说明</span>
        </div>
        {INDICATORS.map(ind => {
          const val = indicators[ind.id] ?? ind.initialValue;
          const label = getIndicatorLabel(ind.id, val);
          return (
            <div key={ind.id} className={styles.reportRow}>
              <span className={styles.reportCol}>
                {ind.icon} {ind.name}
              </span>
              <span className={`${styles.reportCol} ${styles.reportValue}`}>
                {val}
              </span>
              <span className={`${styles.reportCol} ${styles.reportLevel} ${getLevelClass(ind.id, val)}`}>
                {label}
              </span>
              <span className={`${styles.reportCol} ${styles.reportTrend}`}>
                {trendMap[ind.id] ?? '暂无数据'}
              </span>
            </div>
          );
        })}
      </div>

      {/* 系统研判 */}
      <div className={styles.reportDiagnosis}>
        <p className={styles.reportDiagnosisTitle}>系统研判</p>
        <p className={styles.reportDiagnosisItem}>
          安全整改和护理人手是本月压力点
        </p>
        <p className={styles.reportDiagnosisItem}>
          老人活动与家属沟通会影响投诉风险
        </p>
        <p className={styles.reportDiagnosisItem}>
          预算无法覆盖全部问题，需要做取舍
        </p>
      </div>
    </div>
  );
}

function NotificationPanel({
  systemNotifications = [],
  phoneRinging = false,
}: {
  systemNotifications?: string[];
  phoneRinging?: boolean;
}) {
  const staticNotifications = [
    {
      type: '流程提示',
      content: '请查看运营报表和任意一项信息后提交预算方案',
      tagClass: styles.notificationTagTypeFlow,
    },
    {
      type: '风险提醒',
      content: '民政安全检查将在3天后进行，请提前准备相关材料',
      tagClass: styles.notificationTagTypeRisk,
    },
    {
      type: '风险提醒',
      content: '夜班护理人手紧张，已连续两周超负荷排班',
      tagClass: styles.notificationTagTypeRisk,
    },
    {
      type: '流程提示',
      content: '预算审批页面已开放，请在查看运营报表后提交本月方案',
      tagClass: styles.notificationTagTypeFlow,
    },
  ];

  const allNotifications = [
    ...(phoneRinging ? [{
      type: '紧急',
      content: '电话正在响起，请先接听并处理突发事项',
      tagClass: styles.notificationTagTypeUrgent,
    }] : []),
    ...systemNotifications.map((content) => ({
      type: '事件记录',
      content,
      tagClass: styles.notificationTagTypeEvent,
    })),
    ...staticNotifications,
  ];

  return (
    <div className={styles.infoPanel}>
      <h3 className={styles.sectionTitle}>系统通知</h3>
      <p className={styles.reportSubtitle}>以下通知与当前审批流程和院内风险相关</p>
      <div className={styles.notificationList}>
        {allNotifications.map((n, i) => (
          <div key={i} className={styles.notificationItem}>
            <span className={`${styles.notificationTag} ${n.tagClass}`}>
              {n.type}
            </span>
            <p className={styles.notificationContent}>{n.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

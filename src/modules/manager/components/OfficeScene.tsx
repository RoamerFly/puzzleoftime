import { useState } from 'react';
import type { ComputerTab, InfoModule, ReputationRisk } from '../data/managerState';
import { ComputerScreenPreview } from './ComputerScreenPreview';
import { managerAssets } from '../assets/assets';
import styles from '../styles/manager.module.css';

interface OfficeSceneProps {
  onComputerClick: () => void;
  onPowerButtonClick: () => void;
  onPhoneClick: () => void;
  onBulletinClick: () => void;
  /** 当前阶段，用于决定是否显示提示 */
  currentPhase: string;
  /** 电话是否在响铃 */
  phoneRinging?: boolean;
  /** 是否为夜晚模式 */
  isNightMode?: boolean;
  /** 是否为最终夜晚收束模式（更暗） */
  isNightEnding?: boolean;
  /** 系统通知列表（用于在电话响起时在电脑上提示） */
  phoneCallNotification?: string;
  /** 是否已首次开机 */
  hasBootedComputer?: boolean;
  /** 最后停留的电脑Tab */
  lastComputerTab?: ComputerTab;
  /** 剩余预算 */
  remainingBudget?: number;
  /** 已查看信息模块 */
  viewedInfoModules?: InfoModule[];
  /** 剩余调整次数 */
  adjustmentRemaining?: number;
  /** 信誉风险 */
  reputationRisk?: ReputationRisk;
  /** 当前指标值 */
  currentIndicators?: Record<string, number>;
  /** 游戏内时间显示文本 */
  gameTimeText?: string;
  /** 家人电话后待处理临时调整 */
  pendingSecondAdjustment?: boolean;
}

export function OfficeScene({
  onComputerClick,
  onPowerButtonClick,
  onPhoneClick,
  onBulletinClick,
  phoneRinging = false,
  isNightMode = false,
  isNightEnding = false,
  phoneCallNotification,
  hasBootedComputer = false,
  lastComputerTab = 'todo',
  remainingBudget = 60,
  viewedInfoModules = [],
  adjustmentRemaining = 4,
  reputationRisk = 'low',
  currentIndicators,
  gameTimeText = '',
  pendingSecondAdjustment = false,
}: OfficeSceneProps) {
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null);

  const nightClass = isNightEnding ? styles.officeNightEnding : (isNightMode ? styles.officeNight : '');

  return (
    <div className={`${styles.officeScene} ${nightClass}`}>
      {/* 背景图容器 - 作为定位参考坐标系 */}
      <div className={styles.officeSceneInner}>
        {/* 可交互夜晚模式：白天图底层（低透明度提供轮廓） */}
        <img
          className={`${styles.officeImage} ${styles.officeImageFadeIn}`}
          src={managerAssets.officeDay}
          alt="院长办公室"
          draggable={false}
        />

        {/* 可交互夜晚模式：夜晚图上层（覆盖在白天图上） */}
        {(isNightMode || isNightEnding) && (
          <img
            className={`${styles.officeNightOverlay} ${styles.officeNightOverlayFadeIn}`}
            src={managerAssets.officeNight}
            alt=""
            draggable={false}
            aria-hidden="true"
          />
        )}

        {/* 夜晚渐变遮罩 */}
        {(isNightMode || isNightEnding) && <div className={styles.nightMask} />}

        {/* ── 夜晚灯光层（视觉装饰，不可交互）── */}
        {(isNightMode || isNightEnding) && (
          <>
            <div className={styles.nightLampGlow} />
            <div className={styles.nightMoonGlow} />
            <div className={styles.nightMonitorGlow} />
          </>
        )}

        {/* ── 电脑交互区域（白天和夜晚均可交互）── */}

        {/* 未开机时：显示右下角电源键热点 */}
        {!hasBootedComputer && (
          <button
            type="button"
            className={styles.powerButtonHotspot}
            onClick={onPowerButtonClick}
            onMouseEnter={() => setHoveredHotspot('power')}
            onMouseLeave={() => setHoveredHotspot(null)}
            aria-label="打开养老院管理系统"
          >
            {hoveredHotspot === 'power' && (
              <div className={styles.hotspotTooltip}>
                <span className={styles.hotspotTooltipIcon}>💻</span>
                <div className={styles.hotspotTooltipContent}>
                  <div className={styles.hotspotTooltipTitle}>打开养老院管理系统</div>
                  <div className={styles.hotspotTooltipSub}>{phoneCallNotification ?? '待审批事项：6项'}</div>
                </div>
              </div>
            )}
          </button>
        )}
        {/* 电脑屏幕区域游戏内时间显示（未开机时也在屏幕区域显示） */}
        {!hasBootedComputer && gameTimeText && (
          <div className={styles.officeScreenTime}>
            <span className={styles.officeScreenTimeText}>{gameTimeText}</span>
          </div>
        )}

        {/* 已开机时：显示待机信息看板 + 屏幕点击热点 + 绿色电源指示灯 */}
        {hasBootedComputer && (
          <>
            <div className={`${styles.officeComputerScreen} ${isNightMode ? styles.officeComputerScreenNight : ''}`}>
              <ComputerScreenPreview
                activeTab={lastComputerTab}
                remainingBudget={remainingBudget}
                viewedInfoModules={viewedInfoModules}
                adjustmentRemaining={adjustmentRemaining}
                reputationRisk={reputationRisk}
                currentIndicators={currentIndicators}
              />
              {/* 电脑屏幕上的时间显示 */}
              {gameTimeText && (
                <div className={styles.officeScreenTime}>
                  <span className={styles.officeScreenTimeText}>{gameTimeText}</span>
                </div>
              )}
              {/* 夜晚办公室电脑提示：临时调整待处理 */}
              {pendingSecondAdjustment && (
                <div className={styles.officeScreenAlert}>
                  <span className={styles.officeScreenAlertDot} />
                  <span className={styles.officeScreenAlertText}>临时调整待处理</span>
                </div>
              )}
            </div>

            {/* 开机后绿色常亮电源指示灯，纯视觉提示，不可点击 */}
            <div className={`${styles.powerButtonHotspot} ${styles.booted}`} aria-hidden="true" />

            <button
              type="button"
              className={styles.screenHotspot}
              onClick={onComputerClick}
              onMouseEnter={() => setHoveredHotspot('screen')}
              onMouseLeave={() => setHoveredHotspot(null)}
              aria-label={pendingSecondAdjustment ? '临时调整待处理 — 点击进入管理系统' : '进入养老院运营管理系统'}
            >
              {hoveredHotspot === 'screen' && (
                <div className={styles.hotspotTooltip}>
                  <span className={styles.hotspotTooltipIcon}>💻</span>
                  <div className={styles.hotspotTooltipContent}>
                    <div className={styles.hotspotTooltipTitle}>
                      {pendingSecondAdjustment ? '临时调整待处理' : '进入养老院运营管理系统'}
                    </div>
                    {pendingSecondAdjustment && (
                      <div className={styles.hotspotTooltipSub}>点击处理</div>
                    )}
                  </div>
                </div>
              )}
            </button>
          </>
        )}

        {/* ── 电话热点：电话机区域（白天和夜晚均可交互）── */}
        <button
          className={`${styles.hotspotArea} ${styles.hotspotAreaPhone} ${phoneRinging ? styles.hotspotAreaPhoneRinging : ''} ${hoveredHotspot === 'phone' ? styles.hotspotAreaHovered : ''}`}
          onClick={onPhoneClick}
          onMouseEnter={() => setHoveredHotspot('phone')}
          onMouseLeave={() => setHoveredHotspot(null)}
          aria-label={phoneRinging ? '电话正在响起，点击接听' : '查看值班电话记录'}
          tabIndex={0}
        >
          {/* 来电高亮光圈 */}
          {phoneRinging && (
            <>
              <div className={styles.phoneRingGlow} />
              <div className={styles.phoneRingPulse1} />
              <div className={styles.phoneRingPulse2} />
            </>
          )}
          {/* Hover 提示气泡 */}
          {hoveredHotspot === 'phone' && (
            <div className={`${styles.hotspotTooltip} ${phoneRinging ? styles.hotspotTooltipUrgent : ''}`}>
              <span className={styles.hotspotTooltipIcon}>{phoneRinging ? '📞' : '☎️'}</span>
              <div className={styles.hotspotTooltipContent}>
                <div className={styles.hotspotTooltipTitle}>
                  {phoneRinging ? '电话响起' : '电话'}
                </div>
                <div className={styles.hotspotTooltipSub}>
                  {phoneRinging ? '点击接听' : '查看值班电话记录'}
                </div>
              </div>
            </div>
          )}
        </button>

        {/* ── 公告板热点：公告板区域（白天和夜晚均可交互）── */}
        <button
          className={`${styles.hotspotArea} ${styles.hotspotAreaBulletin} ${hoveredHotspot === 'bulletin' ? styles.hotspotAreaHovered : ''}`}
          onClick={onBulletinClick}
          onMouseEnter={() => setHoveredHotspot('bulletin')}
          onMouseLeave={() => setHoveredHotspot(null)}
          aria-label="查看公告板"
        >
          {/* Hover 提示气泡 */}
          {hoveredHotspot === 'bulletin' && (
            <div className={styles.hotspotTooltip}>
              <span className={styles.hotspotTooltipIcon}>📋</span>
              <div className={styles.hotspotTooltipContent}>
                <div className={styles.hotspotTooltipTitle}>查看公告板</div>
                <div className={styles.hotspotTooltipSub}>查看院内通知与便签</div>
              </div>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { managerAssets } from '../assets/assets';
import styles from '../styles/manager.module.css';

interface CameraInfo {
  id: string;
  name: string;
  label: string;
  src: string;
  note: string;
  summary: string;
  riskTags: string[];
}

const CAMERAS: CameraInfo[] = [
  {
    id: 'cam01',
    name: '走廊',
    label: '01 走廊',
    src: managerAssets.monitorCorridor,
    note: '夜间照明偏暗',
    summary: '走廊夜间照明偏暗，转角处存在跌倒风险。近期连续阴雨，地面潮湿度增加。',
    riskTags: ['跌倒风险', '照明不足'],
  },
  {
    id: 'cam02',
    name: '餐厅',
    label: '02 餐厅',
    src: managerAssets.monitorDining,
    note: '排队等待较长',
    summary: '用餐高峰排队时间变长，护理员协助压力上升。部分老人进食速度慢，需要更长陪护时间。',
    riskTags: ['人手紧张', '等餐时长'],
  },
  {
    id: 'cam03',
    name: '活动室',
    label: '03 活动室',
    src: managerAssets.monitorActivityRoom,
    note: '活动参与下降',
    summary: '活动室开放次数减少，部分老人长时间独坐。本周仅开放3次，较上周减少2次。',
    riskTags: ['社交缺失', '开放不足'],
  },
];

export function MonitorPanel() {
  const [activeCam, setActiveCam] = useState(0);
  const cam = CAMERAS[activeCam];

  const riskLevelText = (tags: string[]) => {
    if (tags.some(t => t.includes('跌倒'))) return '中';
    if (tags.some(t => t.includes('人手'))) return '中';
    return '低';
  };

  return (
    <div className={styles.monitorPanel}>
      <h3 className={styles.sectionTitle}>院内监控中心</h3>
      <p className={styles.monitorHint}>
        实时监控 · 已做模糊处理以保护隐私
      </p>

      <div className={styles.monitorMainLayout}>
        {/* 主画面 */}
        <div className={styles.monitorMainView}>
          <div className={styles.monitorMainFrame}>
            <img
              src={cam.src}
              alt={cam.name}
              className={styles.monitorMainImage}
            />
            <div className={styles.monitorMainOverlay}>
              <span className={styles.monitorMainCamId}>{cam.label}</span>
              <span className={styles.monitorMainStatus}>{cam.note}</span>
              <span className={styles.monitorMainRiskLabel}>
                风险等级：{riskLevelText(cam.riskTags)}
              </span>
            </div>
          </div>

          {/* 观察摘要卡片 */}
          <div className={styles.monitorObservationCard}>
            <p className={styles.monitorObservationTitle}>观察摘要</p>
            <p className={styles.monitorObservationText}>{cam.summary}</p>
          </div>
        </div>

        {/* 侧边监控列表 */}
        <div className={styles.monitorSideList}>
          {CAMERAS.map((c, i) => (
            <div
              key={c.id}
              className={`${styles.monitorSideCard} ${activeCam === i ? styles.monitorSideCardActive : ''}`}
              onClick={() => setActiveCam(i)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') setActiveCam(i); }}
            >
              <div className={styles.monitorSideThumbWrap}>
                <img src={c.src} alt={c.name} className={styles.monitorSideThumb} />
              </div>
              <div className={styles.monitorSideInfo}>
                <div className={styles.monitorSideId}>{c.label}</div>
                <div className={styles.monitorSideName}>{c.name}</div>
                <div className={styles.monitorSideNote}>{c.note}</div>
                {c.riskTags.length > 0 && (
                  <div style={{ display: 'flex', gap: '2px', marginTop: '2px' }}>
                    {c.riskTags.map(tag => (
                      <span key={tag} className={styles.monitorSideRiskTag}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部风险摘要 */}
      <div className={styles.monitorSummaryFooter}>
        <span className={styles.monitorSummaryFooterLabel}>风险标签：</span>
        {cam.riskTags.map(tag => (
          <span key={tag} className={styles.monitorRiskTag}>{tag}</span>
        ))}
        <span className={styles.monitorBudgetHint}>
          关联预算建议：夜间防跌倒、护理员增援、活动支持
        </span>
      </div>
    </div>
  );
}

/* === 院长视角模块：值班电话记录面板 === */

import { useCallback } from 'react';
import type { PhoneRecord } from '../data/managerState';
import { formatCallDuration } from '../ManagerScene';
import styles from '../styles/manager.module.css';

interface PhoneRecordPanelProps {
  records: PhoneRecord[];
  onClose: () => void;
  onCallback: (record: PhoneRecord) => void;
  /** 当前是否允许回拨 */
  canCallback: boolean;
}

/** 角色标签映射 */
const roleLabelMap: Record<PhoneRecord['contactRole'], string> = {
  '护理站': '护理站',
  '家属': '家属',
  '管理部门': '管理部门',
  '消防/民政': '消防/民政',
  '孩子': '孩子',
  '爱人': '爱人',
  '值班电话': '值班电话',
};

/** 方向标签 */
function directionLabel(direction: PhoneRecord['direction']): string {
  return direction === 'incoming' ? '来电' : '去电';
}

/**
 * 格式化通话记录面板中显示的时间。
 * 输入 "2024-05-16 周四 16:01" → 输出 "2024-05-16 16:01"
 * 在桌面端显示完整年月日时分，小屏幕下显示 "05-16 16:01"
 */
function formatPhoneRecordDisplayTime(rawTime: string): string {
  // 去掉 " 周X" 部分
  const cleaned = rawTime.replace(/\s*周[一二三四五六日]/g, '');
  return cleaned;
}

export function PhoneRecordPanel({ records, onClose, onCallback, canCallback }: PhoneRecordPanelProps) {
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  return (
    <div className={styles.phoneRecordOverlay} onClick={handleBackdropClick}>
      <div className={styles.phoneRecordPanel}>
        {/* 顶部夹板标题栏 */}
        <div className={styles.phoneRecordHeader}>
          <div className={styles.phoneRecordHeaderLeft}>
            <span className={styles.phoneRecordHeaderIcon}>📒</span>
            <h2 className={styles.phoneRecordHeaderTitle}>值班电话记录</h2>
          </div>
          <button
            className={styles.phoneRecordCloseBtn}
            onClick={onClose}
            aria-label="关闭通话记录"
          >
            ✕
          </button>
        </div>

        {/* 记录表格 */}
        <div className={styles.phoneRecordBody}>
          {records.length === 0 ? (
            <div className={styles.phoneRecordEmpty}>
              <span className={styles.phoneRecordEmptyIcon}>📞</span>
              <p className={styles.phoneRecordEmptyText}>暂无新的通话记录。</p>
            </div>
          ) : (
            <div className={styles.phoneRecordTable}>
              {/* 表头 */}
              <div className={styles.phoneRecordRowHeader}>
                <span className={styles.phoneRecordColTime}>时间</span>
                <span className={styles.phoneRecordColDir}>方向</span>
                <span className={styles.phoneRecordColContact}>来源 / 对象</span>
                <span className={styles.phoneRecordColRole}>身份</span>
                <span className={styles.phoneRecordColResult}>结果</span>
                <span className={styles.phoneRecordColDuration}>时长</span>
                <span className={styles.phoneRecordColAction}></span>
              </div>

              {/* 记录行 */}
              {records.map(record => (
                <div
                  key={record.id}
                  className={`${styles.phoneRecordRow} ${record.direction === 'outgoing' ? styles.phoneRecordRowOutgoing : ''}`}
                >
                  <span className={styles.phoneRecordColTime}>{formatPhoneRecordDisplayTime(record.time)}</span>
                  <span className={styles.phoneRecordColDir}>
                    <span
                      className={
                        record.direction === 'incoming'
                          ? styles.phoneRecordDirIncoming
                          : styles.phoneRecordDirOutgoing
                      }
                    >
                      {directionLabel(record.direction)}
                    </span>
                  </span>
                  <span className={styles.phoneRecordColContact}>
                    {record.contactName}
                  </span>
                  <span className={styles.phoneRecordColRole}>
                    <span className={styles.phoneRecordRoleTag}>
                      {roleLabelMap[record.contactRole]}
                    </span>
                  </span>
                  <span className={styles.phoneRecordColResult}>
                    <span
                      className={`${styles.phoneRecordResultBadge} ${
                        record.result === '已接通' || record.result === '已回拨'
                          ? styles.phoneRecordResultDone
                          : record.result === '已拒接' || record.result === '未接来电'
                            ? styles.phoneRecordResultMissed
                            : styles.phoneRecordResultPending
                      }`}
                    >
                      {record.result}
                    </span>
                  </span>
                  <span className={styles.phoneRecordColDuration}>
                    {record.durationSeconds !== undefined
                      ? formatCallDuration(record.durationSeconds)
                      : '—'}
                  </span>
                  <span className={styles.phoneRecordColAction}>
                    {canCallback ? (
                      <button
                        className={styles.phoneRecordCallbackBtn}
                        onClick={() => onCallback(record)}
                      >
                        回拨
                      </button>
                    ) : (
                      <span className={styles.phoneRecordCallbackDisabled} title="当前正在处理事务，稍后可回拨。">
                        回拨
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部条 */}
        <div className={styles.phoneRecordFooter}>
          <span className={styles.phoneRecordFooterNote}>
            共 {records.length} 条记录
          </span>
        </div>
      </div>
    </div>
  );
}

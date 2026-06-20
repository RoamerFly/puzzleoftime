/**
 * === 交接记录面板（Batch 6: 打开书本视觉效果 + 翻页） ===
 *
 * - 记录卡片使用打开书本📖视觉样式（左右两页展开）
 * - 第1页"看见没说出口的..." → 第2页记录文本
 * - 翻页按钮支持向下翻页浏览
 * - 打字机逐字浮现 + 印章动画
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AutoRecord, AutoRecordV2 } from '../logic/recordRules';
import styles from '../styles/caregiver.module.css';

interface EventRecordPanelProps {
  /** @deprecated 旧版记录，Batch 4 后请使用 autoRecordV2 */
  autoRecord?: AutoRecord;
  /** Batch 4: 新版三级记录 */
  autoRecordV2?: AutoRecordV2;
  elderName: string;
  eventTitle: string;
  onContinue: () => void;
}

export function EventRecordPanel({
  autoRecord,
  autoRecordV2,
  eventTitle,
  onContinue,
}: EventRecordPanelProps) {
  const v2 = autoRecordV2;
  const fullText = v2?.text ?? autoRecord?.text ?? `${eventTitle}已完成。`;

  const recordHint = `交接记录已生成。`;

  // 翻页状态：0 = 提示页（看见没说出口的...），1 = 记录文本页
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = 2;

  // P1-C: 打字机状态（仅在第2页打字）
  const [visibleChars, setVisibleChars] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const [stamped, setStamped] = useState(false);
  const submittedRef = useRef(false);

  // 打字机逐字推进（仅在第2页显示时生效）
  useEffect(() => {
    if (currentPage < 1) return;
    if (skipped) return;
    if (visibleChars >= fullText.length) {
      const t = setTimeout(() => setStamped(true), 300);
      return () => clearTimeout(t);
    }
    const timer = setTimeout(() => {
      setVisibleChars((n) => n + 1);
    }, 35);
    return () => clearTimeout(timer);
  }, [visibleChars, fullText.length, skipped, currentPage]);

  // 点击跳过
  const handleSkip = useCallback(() => {
    if (skipped) return;
    setSkipped(true);
    setVisibleChars(fullText.length);
    setStamped(true);
  }, [fullText.length, skipped]);

  // 翻页到下一页
  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((p) => p + 1);
    }
  }, [currentPage, totalPages]);

  // 翻页到上一页（可选：上翻）
  const handlePrevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage((p) => p - 1);
      setSkipped(false);
      setVisibleChars(0);
      setStamped(false);
    }
  }, [currentPage]);

  const handleContinue = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    onContinue();
  }, [onContinue]);

  const displayText = skipped ? fullText : fullText.slice(0, visibleChars);

  return (
    <div
      className={styles.phasePanel}
      onClick={currentPage === 1 && !stamped ? handleSkip : undefined}
      style={currentPage === 1 && !stamped ? { cursor: 'pointer' } : undefined}
    >
      {/* 护士站交接本标题 */}
      <h2 className={styles.phaseTitle}>
        <span className={styles.recordBookIcon}>📋</span>
        护士站 · 交接记录
      </h2>

      {/* 打开书本记录卡片 */}
      <div className={styles.recordChoiceGroup}>
        <div className={styles.recordChoice}>
          {/* 书本内页展开 */}
          <div className={styles.bookPageSpread}>
            {/* 左页：记录标签 + 线索提示（翻页项） */}
            <div className={styles.bookPageLeft}>
              <div className={styles.recordChoiceLabel}>📖</div>
              {currentPage === 0 ? (
                <>
                  <p className={styles.recordChoicePreview}>
                    {recordHint}
                  </p>
                  <div className={styles.bookPageFooter}>第 1 页</div>
                </>
              ) : (
                <>
                  <p className={styles.recordChoicePreview}>
                    {recordHint.length > 60
                      ? recordHint.slice(0, 60) + '…'
                      : recordHint}
                  </p>
                  <div className={styles.bookPageFooter}>摘要</div>
                </>
              )}
            </div>

            {/* 右页：记录正文（第2页时显示打字机效果） */}
            <div className={styles.bookPageRight}>
              {currentPage >= 1 ? (
                <>
                  <div className={styles.recordChoiceLabel}>
                    📝 交接正文
                  </div>
                  <p className={styles.recordChoicePreview}>
                    {displayText}
                    {!skipped && visibleChars < fullText.length && (
                      <span className={styles.recordCursor}>|</span>
                    )}
                  </p>
                  <div className={styles.bookPageFooter}>第 2 页</div>
                </>
              ) : (
                <>
                  <div className={styles.recordChoiceLabel}>
                    📝 交接正文
                  </div>
                  <p className={styles.recordChoicePreview} style={{ color: 'rgba(160,140,110,0.3)' }}>
                    （翻页查看完整记录）
                  </p>
                  <div className={styles.bookPageFooter}>第 2 页</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 翻页按钮组 —— 不透明底条遮住背景文字 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '14px',
          marginTop: '18px',
          padding: '14px 0',
          position: 'relative',
          zIndex: 10,
          background: '#EDE0CC',
        }}>
          {currentPage > 0 && (
            <button className={styles.bookPageFlipBtn} onClick={handlePrevPage}>
              <span style={{ transform: 'rotate(180deg)', display: 'inline-block' }}>▲</span>
              <span>上一页</span>
            </button>
          )}
          {currentPage < totalPages - 1 && (
            <button className={styles.bookPageFlipBtn} onClick={handleNextPage}>
              <span>翻开下一页</span>
              <span className={styles.bookPageFlipArrow}>▼</span>
            </button>
          )}
        </div>
      </div>

      {/* 未打字时提示可跳过翻页动画 */}
      {currentPage === 1 && !stamped && (
        <p className={styles.recordSkipHint}>点击任意位置可跳过打字动画</p>
      )}

      {/* P1-C: 护士站印章（打字完成后方显示） */}
      <div
        className={[
          styles.recordStamp,
          stamped && currentPage >= 1 ? styles.recordStampOn : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <span className={styles.recordStampText}>已记录</span>
        <span className={styles.recordStampTime}>
          {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* 继续按钮：盖章后出现 */}
      {stamped && currentPage >= 1 && (
        <button
          className={styles.confirmBtn}
          onClick={handleContinue}
          style={{ marginTop: 'var(--spacing-md)' }}
        >
          翻页，继续巡房
        </button>
      )}
    </div>
  );
}

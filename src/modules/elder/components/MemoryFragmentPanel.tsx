/* === 回忆碎片面板（v4-rebuilt 更新版） ===
 *
 * 展示收集到的回忆碎片，优先使用生成的复古绘本风图片。
 * 支持原有 6 个碎片 + 新增 12 张特殊场景碎片。
 *
 * 碎片图片位于 public/assets/elder/generated/memory_fragments/
 * 未收集碎片不显示（或可配置为模糊锁定状态）
 */

import { MEMORY_FRAGMENTS } from '../data/memoryFragments';
import { getAssetPath, FRAGMENT_PLACEHOLDER_COLORS } from '../data/generatedAssets';

interface MemoryFragmentPanelProps {
  collectedFragments: string[];
  gameHour: number;
}

export function MemoryFragmentPanel({ collectedFragments, gameHour }: MemoryFragmentPanelProps) {
  if (collectedFragments.length === 0) return null;

  // 晚上（19:00以后）或碎片≥3时显示面板
  if (gameHour < 19 && collectedFragments.length < 3) return null;

  return (
    <div style={{
      width: '100%',
      maxWidth: '700px',
      padding: '16px',
      backgroundColor: 'var(--color-bg-secondary)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-paper)',
    }}>
      <h4 style={{
        margin: '0 0 14px 0',
        fontFamily: 'var(--font-family-title)',
        fontSize: '1.05rem',
        color: 'var(--color-text-primary)',
        textAlign: 'center',
        letterSpacing: '0.05em',
      }}>
        收集到的回忆碎片 ({collectedFragments.length})
      </h4>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        {collectedFragments.map(fragId => {
          const frag = MEMORY_FRAGMENTS[fragId];
          if (!frag) return null;
          const imgPath = getAssetPath(frag.imageKey);
          const hasImage = !!imgPath;
          const placeholderBg = FRAGMENT_PLACEHOLDER_COLORS[frag.imageKey]
            || 'var(--color-bg-primary)';

          return (
            <div key={fragId} style={{
              display: 'flex',
              gap: '14px',
              padding: '12px',
              backgroundColor: 'rgba(245, 230, 200, 0.3)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              alignItems: 'flex-start',
            }}>
              {/* 碎片图片 - 保持 16:10 比例，避免拉伸 */}
              <div style={{
                width: '96px',
                height: '60px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: placeholderBg,
                backgroundImage: hasImage ? `url(${imgPath})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                flexShrink: 0,
                border: `2px solid ${hasImage ? 'rgba(180, 150, 110, 0.6)' : 'var(--color-border)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative',
              }}>
                {!hasImage && (
                  <span style={{ fontSize: '1.2rem', opacity: 0.3 }}>📷</span>
                )}
                {/* 旧照片边框效果 */}
                {hasImage && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    border: '1px solid rgba(180, 150, 110, 0.3)',
                    borderRadius: 'inherit',
                    pointerEvents: 'none',
                    boxShadow: 'inset 0 0 8px rgba(120, 90, 50, 0.15)',
                  }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h5 style={{
                  margin: '0 0 4px 0',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                }}>
                  {frag.title}
                </h5>
                <p style={{
                  margin: 0,
                  fontSize: '0.76rem',
                  color: 'var(--color-text-secondary)',
                  fontStyle: 'italic',
                  lineHeight: 1.6,
                }}>
                  {frag.memoryText}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

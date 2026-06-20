/* === 老人篇结算页面（v6.4 多结局版） ===
 *
 * v6.4: 支持主结局 + 次级结局印记双层展示
 * - 主结局：大图 CG + 完整正文
 * - 次级印记：卡片式展示（最多3个）
 */

import type { ElderGameState, ElderEndingResult } from '../types';
import type { EndingDisplay } from '../data/endingConfig';
import { MEMORY_FRAGMENTS } from '../data/memoryFragments';
import { getAssetPath, SCENE_PLACEHOLDER_COLORS, FRAGMENT_PLACEHOLDER_COLORS } from '../data/generatedAssets';

interface ElderEndingProps {
  state: ElderGameState;
  endingDisplay: EndingDisplay;
  endingResult?: ElderEndingResult | null;
  onRestart: () => void;
  onNextChapter: () => void;
  onBackToMenu: () => void;
}

export function ElderEnding({ state, endingDisplay, endingResult, onRestart, onNextChapter, onBackToMenu }: ElderEndingProps) {
  const fragments = state.collectedFragments.map(id => MEMORY_FRAGMENTS[id]).filter(Boolean);

  // CG 图片路径：优先 endingConfig 选择的 CG，回退到 quiet_ending_cg
  const cgImagePath = getAssetPath(endingDisplay.cgKey) ?? getAssetPath('quiet_ending_cg');
  const hasCgImage = !!cgImagePath;

  return (
    <div className="elder-ending">
      {/* ── 结局 CG 卡 ── */}
      <div className="elder-ending__hero">
        <div
          className="elder-ending__hero-bg"
          style={{
            backgroundImage: hasCgImage
              ? `url(${cgImagePath})`
              : SCENE_PLACEHOLDER_COLORS.elder_room,
          }}
        />
        <div className="elder-ending__hero-overlay" />
        <div className="elder-ending__hero-text">
          <h3 className="elder-ending__title">{endingDisplay.title}</h3>
          <p className="elder-ending__subtitle">{endingDisplay.subtitle}</p>
        </div>
      </div>

      {/* ── 统计 ── */}
      <div className="elder-ending__card">
        <div className="elder-ending__stats">
          <div className="elder-ending__stat">
            <div className="elder-ending__stat-label">到达地点</div>
            <div className="elder-ending__stat-value">{state.visitedLocations.length}个</div>
          </div>
          <div className="elder-ending__stat">
            <div className="elder-ending__stat-label">完成活动</div>
            <div className="elder-ending__stat-value">{state.completedActions.length}个</div>
          </div>
          <div className="elder-ending__stat">
            <div className="elder-ending__stat-label">收集碎片</div>
            <div className="elder-ending__stat-value">{state.collectedFragments.length}个</div>
          </div>
        </div>
        <div className="elder-ending__stats" style={{ marginTop: '10px' }}>
          <div className="elder-ending__stat">
            <div className="elder-ending__stat-label">最终体力</div>
            <div className="elder-ending__stat-value">{state.status.energy}</div>
          </div>
          <div className="elder-ending__stat">
            <div className="elder-ending__stat-label">最终心情</div>
            <div className="elder-ending__stat-value">{state.status.mood}</div>
          </div>
          <div className="elder-ending__stat">
            <div className="elder-ending__stat-label">最终健康</div>
            <div className="elder-ending__stat-value">{state.status.health}</div>
          </div>
        </div>
      </div>

      {/* ── 结局文字 ── */}
      <div className="elder-ending__card">
        <p className="elder-ending__message">{endingDisplay.message}</p>
      </div>

      {/* ── v6.4: 这一天留下的印记（次级结局） ── */}
      {endingResult && endingResult.secondaryEndings.length > 0 && (
        <div className="elder-ending__card">
          <h4 className="elder-ending__fragments-title">
            这一天留下的印记
          </h4>
          <div className="elder-ending__secondary-list">
            {endingResult.secondaryEndings.map((se, idx) => (
              <div key={idx} className="elder-ending__secondary-item">
                <div className="elder-ending__secondary-title">
                  {se.secondaryTitle || se.title}
                </div>
                <div className="elder-ending__secondary-subtitle">
                  {se.secondarySubtitle || se.subtitle}
                </div>
                <div className="elder-ending__secondary-body">
                  {se.secondaryBody || se.body.substring(0, 80)}…
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 回忆碎片回顾 ── */}
      {fragments.length > 0 && (
        <div className="elder-ending__card">
          <h4 className="elder-ending__fragments-title">
            今天记起的往事
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: fragments.length >= 3
              ? 'repeat(auto-fill, minmax(240px, 1fr))'
              : '1fr',
            gap: '12px',
          }}>
            {fragments.map(frag => {
              const imgPath = getAssetPath(frag.imageKey);
              const placeholderBg = FRAGMENT_PLACEHOLDER_COLORS[frag.imageKey]
                || 'rgba(80, 60, 40, 0.3)';
              return (
                <div key={frag.id} className="elder-ending__fragment">
                  <div
                    className="elder-ending__fragment-img"
                    style={imgPath
                      ? { backgroundImage: `url(${imgPath})` }
                      : { background: placeholderBg }
                    }
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="elder-ending__fragment-title">{frag.title}</div>
                    <p className="elder-ending__fragment-text">{frag.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 操作按钮 ── */}
      <div className="elder-ending__buttons">
        <button className="elder-ending__btn-primary" onClick={onRestart}>
          重新体验老人篇
        </button>
        <button className="elder-ending__btn-secondary" onClick={onNextChapter}>
          进入下一章
        </button>
        <button className="elder-ending__btn-ghost" onClick={onBackToMenu}>
          返回主菜单
        </button>
      </div>
    </div>
  );
}

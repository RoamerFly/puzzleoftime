import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../core/GameContext';
import { GameLayout } from '../components/layout/GameLayout';
import { NarrativeOverlay } from '../components/shared/NarrativeOverlay';
import { ChapterComplete } from '../components/shared/ChapterComplete';
import { ChapterTitle } from '../components/ui/ChapterTitle';
import { getNextChapter, getTotalChapters } from '../core/chapterRegistry';
import type { ChapterConfig } from '../core/chapterRegistry';

/**
 * 角色标签映射（一日时间线）
 */
const ROLE_LABELS: Record<number, string> = {
  1: '角色一 · 老人的一日',
  2: '角色二 · 护理员的一日',
  3: '角色三 · 管理者的一日',
};

/** 完成弹窗"下一角色"按钮文字 */
const NEXT_LABELS: Record<number, string> = {
  1: '成为护理员',
  2: '成为管理者',
  3: '看看这一天',
};

interface ChapterWrapperProps {
  config: ChapterConfig;
}

/**
 * 章节通用包装器
 * 统一管理：前导旁白 → 游戏内容 → 完成弹窗 → 暂停菜单
 */
export function ChapterWrapper({ config }: ChapterWrapperProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { completeChapter, startChapter, setFontSize, state } = useGame();

  // 恢复进度：从 location state 中读取
  const isResuming = !!(location.state as { resume?: boolean } | null)?.resume;
  const savedState = isResuming ? state.progress.chapters[config.chapterId] : undefined;

  const [showNarrative, setShowNarrative] = useState(!isResuming);
  const [isComplete, setIsComplete] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const ChapterComponent = config.component;
  const roleLabel = ROLE_LABELS[config.order] || `第${config.order}章 · ${config.perspective}`;
  const nextLabel = NEXT_LABELS[config.order];

  // 暂停时禁止 body 滚动
  useEffect(() => {
    if (isPaused) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isPaused]);

  // 键盘 Esc 暂停/继续
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showNarrative && !isComplete) {
        setIsPaused(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showNarrative, isComplete]);

  // 旁白结束
  const handleNarrativeComplete = useCallback(() => {
    setShowNarrative(false);
  }, []);

  // 章节完成
  const handleSceneComplete = useCallback(() => {
    setIsComplete(true);
  }, []);

  // 点击"继续前行"
  const handleComplete = useCallback(() => {
    completeChapter(config.chapterId);
    const next = getNextChapter(config.chapterId);
    if (next) {
      startChapter(next.chapterId);
      navigate(`/chapter/${next.chapterId}`);
    } else {
      navigate('/epilogue');
    }
  }, [config.chapterId, completeChapter, startChapter, navigate]);

  // 返回主菜单（暂停菜单中）
  const handleBackToMenu = useCallback(() => {
    setIsPaused(false);
    navigate('/');
  }, [navigate]);

  // 完成弹窗 - 返回主菜单（先进入终章）
  const handleBackToMenuFromComplete = useCallback(() => {
    completeChapter(config.chapterId);
    navigate('/epilogue');
  }, [config.chapterId, completeChapter, navigate]);

  // 进入终章
  const handleEpilogue = useCallback(() => {
    completeChapter(config.chapterId);
    navigate('/epilogue');
  }, [config.chapterId, completeChapter, navigate]);

  return (
    <GameLayout chapterOrder={config.order} totalChapters={getTotalChapters()} showProgress={false}>
      {/* 前导旁白 */}
      {showNarrative && (
        <NarrativeOverlay
          texts={config.narrativeBefore}
          onComplete={handleNarrativeComplete}
          singlePage
        />
      )}

      {/* 游戏内容 */}
      {!showNarrative && !isComplete && (
        <div style={{ position: 'relative' }}>
          <ChapterTitle
            chapterOrder={config.order}
            title={config.title}
            subtitle={config.subtitle}
            perspective={config.perspective}
            icon={config.icon}
            label={roleLabel}
          />
          <ChapterComponent
            onComplete={handleSceneComplete}
            onNavigateNext={handleComplete}
            onNavigateMenu={handleBackToMenu}
            isPaused={isPaused}
            initialState={savedState}
          />

          {/* ── 暂停按钮 ── */}
          <button
            className="pause-button"
            onClick={() => setIsPaused(true)}
            title="暂停 (Esc)"
            style={{
              position: 'fixed',
              top: '50%',
              right: '10px',
              transform: 'translateY(-50%)',
              zIndex: 50,
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: '1px solid rgba(180, 150, 110, 0.4)',
              background: 'rgba(42, 30, 18, 0.55)',
              color: '#ffebc8',
              fontSize: '1.1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(6px)',
              transition: 'background 0.2s',
            }}
          >
            ⏸
          </button>
        </div>
      )}

      {/* 完成弹窗 */}
      {isComplete && (
        <ChapterComplete
          chapterOrder={config.order}
          title={config.title}
          message={config.narrativeAfter.join(' ')}
          nextLabel={nextLabel}
          onNext={handleComplete}
          onBackToMenu={handleBackToMenuFromComplete}
          onEpilogue={handleEpilogue}
        />
      )}

      {/* ── 暂停遮罩 ── */}
      {isPaused && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(30, 20, 10, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          <h2 style={{
            fontFamily: 'var(--font-family-title)',
            fontSize: '1.6rem',
            color: '#fff7e6',
            letterSpacing: '0.1em',
            margin: 0,
          }}>
            游戏暂停
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '220px' }}>
            <button
              onClick={() => setIsPaused(false)}
              style={{
                padding: '13px 24px',
                fontSize: '1rem',
                border: 'none',
                borderRadius: '12px',
                background: 'rgba(220, 180, 120, 0.9)',
                color: '#3e2c1c',
                cursor: 'pointer',
                fontWeight: 600,
                letterSpacing: '0.05em',
                transition: 'background 0.2s',
              }}
            >
              ▶ 继续游戏
            </button>
            {/* ── 内联设置 ── */}
            <div style={{
              display: 'flex', gap: '10px', justifyContent: 'center',
              padding: '8px 0',
            }}>
              {(['normal', 'large', 'xlarge'] as const).map(size => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  style={{
                    padding: '8px 16px',
                    fontSize: size === 'normal' ? '0.85rem' : size === 'large' ? '1.1rem' : '1.35rem',
                    border: state.settings.fontSize === size
                      ? '2px solid rgba(220, 180, 120, 0.9)'
                      : '1px solid rgba(255, 235, 200, 0.25)',
                    borderRadius: '10px',
                    background: state.settings.fontSize === size
                      ? 'rgba(220, 180, 120, 0.25)'
                      : 'rgba(255, 248, 235, 0.08)',
                    color: state.settings.fontSize === size ? '#ffebc8' : '#b8a080',
                    cursor: 'pointer',
                    fontWeight: state.settings.fontSize === size ? 600 : 400,
                    transition: 'all 0.2s',
                    minWidth: '60px',
                  }}
                >
                  {size === 'normal' ? '标准' : size === 'large' ? '大字' : '特大'}
                </button>
              ))}
            </div>
            <button
              onClick={handleBackToMenu}
              style={{
                padding: '13px 24px',
                fontSize: '0.95rem',
                border: '1px solid rgba(255, 235, 200, 0.3)',
                borderRadius: '12px',
                background: 'rgba(255, 248, 235, 0.1)',
                color: '#ccb896',
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'background 0.2s',
              }}
            >
              🏠 返回主页
            </button>
          </div>
          <p style={{
            fontSize: '0.75rem',
            color: 'rgba(255, 235, 200, 0.5)',
            margin: '4px 0 0',
          }}>
            按 Esc 继续
          </p>
        </div>
      )}
    </GameLayout>
  );
}

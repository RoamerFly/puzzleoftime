import { useNavigate } from 'react-router-dom';
import { useGame } from '../core/GameContext';
import { Button } from '../components/ui/Button';
import { PageTransition } from '../components/layout/PageTransition';
import styles from './Settings.module.css';
import type { FontSize } from '../core/types';

export function Settings() {
  const navigate = useNavigate();
  const { state, setFontSize, toggleVisualEffects, setBgmVolume, setSfxVolume, resetGame } = useGame();
  const { settings } = state;

  const fontSizes: { value: FontSize; label: string }[] = [
    { value: 'normal', label: '标准' },
    { value: 'large', label: '大字' },
    { value: 'xlarge', label: '特大字' },
  ];

  return (
    <PageTransition>
      <div className={styles.container}>
        <header className={styles.header}>
          <Button variant="ghost" size="small" onClick={() => navigate(-1)}>
            ← 返回
          </Button>
          <h2 className={styles.title}>⚙ 设置</h2>
          <div style={{ width: 60 }} /> {/* 占位对齐 */}
        </header>

        <div className={styles.content}>
          {/* 字体大小 */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>字体大小</h3>
            <div className={styles.optionGroup}>
              {fontSizes.map(({ value, label }) => (
                <button
                  key={value}
                  className={`${styles.optionBtn} ${settings.fontSize === value ? styles.active : ''}`}
                  onClick={() => setFontSize(value)}
                >
                  <span className={styles.optionPreview} style={
                    value === 'large' ? { fontSize: '22px' } :
                    value === 'xlarge' ? { fontSize: '26px' } : {}
                  }>Aa</span>
                  <span className={styles.optionLabel}>{label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* 视觉干扰效果 */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>视觉干扰效果</h3>
            <p className={styles.sectionDesc}>
              关闭后，将移除模拟衰老体验的模糊、延迟等效果
            </p>
            <div className={styles.toggleRow}>
              <span className={styles.toggleLabel}>
                {settings.disableVisualEffects ? '已关闭' : '已开启'}
              </span>
              <button
                className={`${styles.toggle} ${settings.disableVisualEffects ? styles.toggleOff : styles.toggleOn}`}
                onClick={toggleVisualEffects}
                role="switch"
                aria-checked={!settings.disableVisualEffects}
              >
                <span className={styles.toggleKnob} />
              </button>
            </div>
          </section>

          {/* 音量控制 */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>音量控制</h3>
            <div className={styles.volumeRow}>
              <label className={styles.volumeLabel}>🎵 背景音乐</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.bgmVolume}
                onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                className={styles.slider}
              />
            </div>
            <div className={styles.volumeRow}>
              <label className={styles.volumeLabel}>🔊 音效</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.sfxVolume}
                onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                className={styles.slider}
              />
            </div>
          </section>

          {/* 重置 */}
          <section className={styles.section}>
            <Button variant="ghost" size="medium" onClick={() => {
              if (window.confirm('确定要重置所有游戏进度吗？此操作不可撤销。')) {
                resetGame();
                navigate('/');
              }
            }}>
              🔄 重置游戏进度
            </Button>
          </section>
        </div>
      </div>
    </PageTransition>
  );
}

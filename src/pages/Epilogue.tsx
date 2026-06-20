import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { PageTransition } from '../components/layout/PageTransition';
import { EPILOGUE_NARRATIVE, EPILOGUE_FACTS, EPILOGUE_CALL_TO_ACTION, PHOTO_DESCRIPTION } from './data/narrativeData';
import finalPng from '../modules/elder/assets/final.png';
import styles from './Epilogue.module.css';

export function Epilogue() {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className={styles.container}>
        {/* 拼回的照片 */}
        <div className={styles.photoSection}>
          <img
            className={styles.completedPhoto}
            src={finalPng}
            alt="岁月拼图 · 终章"
          />
          <p className={styles.photoDescription}>{PHOTO_DESCRIPTION}</p>
        </div>

        {/* 过渡旁白 */}
        <div className={styles.narrativeSection}>
          {EPILOGUE_NARRATIVE.map((text, i) => (
            <p key={i} className={styles.narrativeText} style={{ animationDelay: `${i * 0.3}s` }}>
              {text}
            </p>
          ))}
        </div>

        {/* 公益数据 */}
        <div className={styles.factsSection}>
          <h3 className={styles.factsTitle}>📊 这些数字，值得被看见</h3>
          <div className={styles.factsGrid}>
            {EPILOGUE_FACTS.map((fact, i) => (
              <div key={i} className={styles.factCard}>
                <p className={styles.factText}>{fact}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 呼吁 */}
        <div className={styles.callSection}>
          {EPILOGUE_CALL_TO_ACTION.map((text, i) => (
            <p key={i} className={`${styles.callText} ${text === '' ? styles.spacer : ''}`}>
              {text}
            </p>
          ))}
        </div>

        {/* 操作 */}
        <div className={styles.actions}>
          <Button variant="primary" size="large" onClick={() => navigate('/')}>
            返回主菜单
          </Button>
        </div>

        <footer className={styles.footer}>
          <p>《岁月拼图》— 适老化关怀公益互动体验</p>
          <p className={styles.footerSub}>理解他们，就是理解将来的自己</p>
        </footer>
      </div>
    </PageTransition>
  );
}

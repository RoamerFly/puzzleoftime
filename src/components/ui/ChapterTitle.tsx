import { useEffect, useState } from 'react';
import styles from './ChapterTitle.module.css';

interface ChapterTitleProps {
  chapterOrder: number;
  title: string;
  subtitle: string;
  perspective: string;
  icon: string;
  /** 自定义标签，覆盖默认的"第X章 · perspective" */
  label?: string;
}

export function ChapterTitle({ chapterOrder, title, subtitle, perspective, icon, label }: ChapterTitleProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`${styles.container} ${visible ? styles.visible : ''}`}>
      <span className={styles.icon}>{icon}</span>
      <span className={styles.label}>{label ?? `第${chapterOrder}章 · ${perspective}`}</span>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.subtitle}>{subtitle}</p>
    </div>
  );
}

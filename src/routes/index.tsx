import { createBrowserRouter, Navigate } from 'react-router-dom';
import { getAllChapters } from '../core/chapterRegistry';
import { MainMenu } from '../pages/MainMenu';
import { Settings } from '../pages/Settings';
import { Epilogue } from '../pages/Epilogue';
import { ChapterWrapper } from './ChapterWrapper';

/**
 * 动态创建路由
 * 章节路由从 chapterRegistry 动态生成，无需手动添加
 * 体验流程为线性：首页 → 角色一(elder) → 角色二(caregiver) → 角色三(manager) → 终章
 */
export function createRouter() {
  const chapters = getAllChapters();

  const chapterRoutes = chapters.map(config => ({
    path: `/chapter/${config.chapterId}`,
    element: <ChapterWrapper key={config.chapterId} config={config} />,
  }));

  return createBrowserRouter([
    { path: '/', element: <MainMenu /> },
    { path: '/settings', element: <Settings /> },
    ...chapterRoutes,
    { path: '/epilogue', element: <Epilogue /> },
    { path: '*', element: <Navigate to="/" replace /> },
  ]);
}

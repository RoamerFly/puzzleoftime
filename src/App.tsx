import { RouterProvider } from 'react-router-dom';
import { GameProvider } from './core/GameContext';
import { registerAllChapters } from './modules/register';
import { createRouter } from './routes';

// 全局样式导入
import './styles/global.css';
import './styles/typography.css';
import './styles/animations.css';
import './styles/aging-effects.css';

// 注册所有章节模块
registerAllChapters();

// 创建路由（章节路由从 registry 动态生成）
const router = createRouter();

function App() {
  return (
    <GameProvider>
      <RouterProvider router={router} />
    </GameProvider>
  );
}

export default App;

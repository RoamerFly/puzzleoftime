import { writeFileSync } from 'fs';

const content = `/* === 地点数据（v5.1 - 精准热点匹配·资源包校准） ===
 *
 * v5.1 改动（基于 years_puzzle_elder_assets_v4_rebuilt 重新校准）：
 *   - 全部热点和出口坐标从 v5 资源包 hotspot_coordinates.json 导入
 *   - 每个热点贴近图片中的实际物体位置
 *   - 出口按钮位于场景中的门/走廊方向位置
 *   - DEBUG_HOTSPOTS=true 时在 ElderScene.tsx 中可点击场景输出坐标

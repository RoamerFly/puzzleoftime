/**
 * === 护理员模块统一调试开关 · debug.ts ===
 *
 * 仅用于开发阶段可视化辅助，正式模式不渲染任何调试元素。
 * 不允许通过业务存档开启。
 */

export const CAREGIVER_DEBUG: Record<string, boolean> = {
  /** 显示线索热点范围（rect，半透明色块） */
  hotspots: false,

  /** 显示行动点中心 + 命中圆 */
  actionTargets: false,

  /** 显示微动画 overlayRect */
  animationRects: false,

  /** 在场景角落显示当前点击坐标百分比 */
  clickCoordinates: false,
};

export type DebugKey = keyof typeof CAREGIVER_DEBUG;

/**
 * 安全读取调试开关（运行时无额外开销）
 * 仅在开发环境且对应 key 为 true 时返回 true
 */
export function isDebugEnabled(key: DebugKey): boolean {
  return CAREGIVER_DEBUG[key] === true;
}

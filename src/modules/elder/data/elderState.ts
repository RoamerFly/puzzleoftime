/* === 老人视角模块：私有状态定义 ===
 *
 * 保留旧类型以保持向后兼容。
 * 新玩法状态详见 types.ts 中的 ElderGameState。
 */

/** @deprecated 旧版拼图玩法状态，保留以兼容存档迁移 */
export interface ElderState {
  photoIndex: number;
  completed: boolean;
}

export const ELDER_INITIAL_STATE: ElderState = {
  photoIndex: 0,
  completed: false,
};

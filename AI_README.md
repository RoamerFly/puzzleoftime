# AI_README.md

> 文档用途：给完全不了解本项目的 AI 或开发者快速接手用。它不是用户手册，而是“先读哪里、改哪里、注意什么”的工程导览。
> 更新基准：2026-06-17，根据当前仓库结构、源码、配置和资源目录重写。
> 重要提醒：当前仓库中大量中文注释、UI 文案和历史 Markdown 已出现 mojibake 乱码。修改用户可见文案时，应优先修复编码和文案，不要继续复制乱码内容。

---

## 1. 项目一句话

《岁月拼图》（Puzzle of Time）是一个以“适老化关怀”为主题的公益互动网页应用。玩家从老人、护理员、管理者三个视角体验养老院中的一天，理解衰老、照护压力、资源分配和家庭陪伴。

当前项目是纯前端 SPA，没有后端服务。核心体验由 React 组件、CSS 动画和本地静态图片组成，存档使用浏览器 localStorage。

---

## 2. 技术栈

| 类别 | 当前选择 | 主要文件 |
| --- | --- | --- |
| 前端框架 | React 19 | `package.json` |
| 构建工具 | Vite 8 | `package.json`, `vite.config.ts` |
| 语言 | TypeScript 6 | `tsconfig*.json` |
| 路由 | react-router-dom 7 | `src/routes/index.tsx` |
| 全局状态 | React Context + useReducer | `src/core/GameContext.tsx`, `src/core/gameReducer.ts` |
| 章节私有状态 | `progress.chapters[chapterId]`, 部分章节本地 `useState` | `src/core/hooks/useChapterState.ts`, 各模块 Scene |
| 样式 | CSS Modules + 全局 CSS 变量/动画 | `src/styles/`, `src/modules/**/styles/` |
| 存档 | localStorage | key: `puzzle-of-time-save` |
| 后端 | 无 | 纯前端 |
| 自动化测试 | 无 | `package.json` 没有 test 脚本 |

---

## 3. 常用命令

```bash
npm install
npm run dev
npm run build
npm run lint
npm run preview
npm run check:modules
npm run generate:elder-assets
npm run regenerate:elder-assets
```

说明：

- `npm run build` 会先执行 `tsc -b`，再执行 `vite build`。
- `npm run lint` 执行 ESLint。
- `npm run check:modules` 执行 `scripts/check-modules.mjs`，检查模块隔离、资源混用和 CSS 污染。
- `generate:elder-assets` / `regenerate:elder-assets` 调用 `src/modules/elder/tools/generate-elder-assets.mjs`，依赖外部 ComfyUI 工作流环境。
- 当前没有单元测试或端到端测试命令。

---

## 4. 顶层目录

```text
.
├─ index.html
├─ package.json
├─ vite.config.ts
├─ eslint.config.js
├─ README.md
├─ AI_README.md
├─ MODULE_ISOLATION_REPORT.md
├─ scripts/
├─ public/
│  ├─ assets/
│  ├─ favicon.svg
│  └─ icons.svg
├─ src/
│  ├─ App.tsx
│  ├─ main.tsx
│  ├─ core/
│  ├─ routes/
│  ├─ modules/
│  ├─ pages/
│  ├─ components/
│  ├─ hooks/
│  └─ styles/
└─ years_puzzle_elder_assets_v5_rebuilt/
```

`years_puzzle_elder_assets_v5_rebuilt/` 是老人篇重建资源包，含图片、热点坐标和映射参考。运行时主要使用 `public/assets/elder/generated/` 以及 `src/modules/elder/data/generatedAssets.ts` 中的路径映射。

---

## 5. 启动链路和路由

启动链路：

```text
src/main.tsx
  -> src/App.tsx
  -> registerAllChapters()
  -> createRouter()
  -> GameProvider
  -> RouterProvider
```

真实路由由 `src/routes/index.tsx` 定义。章节路由来自 `chapterRegistry` 动态生成：

| 路径 | 页面/组件 | 说明 |
| --- | --- | --- |
| `/` | `MainMenu` | 主菜单、角色选择、历史记录、报告弹窗 |
| `/settings` | `Settings` | 字体、视觉效果、音量、重置进度 |
| `/chapter/elder` | `ChapterWrapper` + `ElderScene` | 老人视角 |
| `/chapter/caregiver` | `ChapterWrapper` + `CaregiverScene` | 护理员视角 |
| `/chapter/manager` | `ChapterWrapper` + `ManagerScene` | 管理者视角 |
| `/epilogue` | `Epilogue` | 终章 |
| `*` | `Navigate` 到 `/` | 兜底 |

注意：`src/pages/ChapterSelect.tsx` 存在，但当前没有注册 `/chapters` 路由。主菜单使用角色选择弹窗直接进入 `/chapter/:chapterId`。

---

## 6. 核心架构

### 6.1 章节注册

章节由 `src/core/chapterRegistry.ts` 管理。每个模块在自己的 `index.ts` 导出 `ChapterConfig`，再由 `src/modules/register.ts` 统一注册。

当前注册顺序：

1. `elder`
2. `caregiver`
3. `manager`

核心 API：

| API | 作用 |
| --- | --- |
| `registerChapter(config)` | 注册章节 |
| `getAllChapters()` | 按 `order` 获取所有章节 |
| `getChapter(chapterId)` | 获取单个章节 |
| `isChapterUnlocked(chapterId, completedChapters)` | 判断解锁 |
| `getNextChapter(chapterId)` | 获取下一章 |
| `getTotalChapters()` | 获取章节总数 |

### 6.2 章节包装器

`src/routes/ChapterWrapper.tsx` 统一处理章节通用流程：

```text
NarrativeOverlay 前导旁白
  -> ChapterTitle
  -> 章节 Scene
  -> Scene 调用 onComplete()
  -> ChapterComplete 完成弹窗
  -> 下一章或 /epilogue
```

它还负责：

- Esc 暂停/继续。
- 暂停层中的字体大小设置。
- 从 `location.state.resume` 判断是否恢复进度。
- 将 `initialState` 传给章节 Scene。

注意：该文件中用户可见中文也有乱码，若修改暂停层、按钮或章节标签，应同步修复文案。

### 6.3 全局状态和存档

全局状态类型在 `src/core/types.ts`：

```ts
interface GameState {
  settings: SettingsState;
  progress: ProgressState;
  narrative: NarrativeState;
}
```

`GameProvider` 会把完整 `GameState` 自动写入 localStorage：

```text
localStorage key: puzzle-of-time-save
```

章节私有状态存放在：

```text
state.progress.chapters[chapterId]
```

当前使用方式：

- Elder：主流程使用组件内 `useState`，在关键时机 dispatch `UPDATE_CHAPTER_STATE` 持久化。
- Caregiver：使用 `useChapterState<CaregiverState>('caregiver', ...)`，带 `flowVersion` 和 normalize。
- Manager：定义了 `MANAGER_INITIAL_STATE`，但 `ManagerScene` 当前主要用本地 `useState`，没有完整接入 `progress.chapters.manager` 持久化。

`migrateLegacyState()` 负责把早期数字章节 ID 和 `chapter1/2/3` 存档迁移到当前 `elder/caregiver/manager` 结构。

---

## 7. 三个章节现状

### 7.1 第一章：老人视角

入口文件：

- `src/modules/elder/index.ts`
- `src/modules/elder/ElderScene.tsx`

核心数据：

- `src/modules/elder/types.ts`
- `src/modules/elder/data/locations.ts`
- `src/modules/elder/data/actions.ts`
- `src/modules/elder/data/schedule.ts`
- `src/modules/elder/data/randomEvents.ts`
- `src/modules/elder/data/memoryFragments.ts`
- `src/modules/elder/data/generatedAssets.ts`
- `src/modules/elder/data/hotspotCoordinates.ts`
- `src/modules/elder/data/endingConfig.ts`
- `src/modules/elder/data/fragmentResolver.ts`
- `src/modules/elder/data/albumResolver.ts`
- `src/modules/elder/data/actionResultResolver.ts`
- `src/modules/elder/data/incomingCallResolver.ts`

当前玩法：

- 从 06:00 到次日 06:00 的 24 小时模拟，`TOTAL_GAME_MINUTES = 1440`。
- 玩家在 8 个主要地点间移动：房间、走廊、餐厅、活动室、花园、医务室、护理站、电话角。
- 地点使用背景图 + 百分比坐标热点。
- 状态维度：体力、心情、饥饿、健康、孤独。
- 支持老花镜模糊、时段滤镜、行动耗时、夜间关闭区域、低体力移动惩罚、随机事件、久坐惩罚。
- 回忆碎片通过动作、相册、组合条件和事件触发，弹窗展示图文。
- 有用餐邀请、护理员对话、主动拨号、被动来电、晕厥救助、迷路/认知混乱等机制。
- 多结局由 `endingConfig.ts` 计算，使用 `public/assets/elder/generated/endings/` 下的 CG。

资源状态：

- 映射文件：`src/modules/elder/data/generatedAssets.ts`
- 运行图片：`public/assets/elder/generated/`
- 备份图片：`public/assets/elder/generated_backup/`
- 外部重建包：`years_puzzle_elder_assets_v5_rebuilt/`
- 如果某个图片 key 取不到，运行时会降级为 CSS 渐变占位。
- 热点坐标与 16:9 场景图强绑定。替换图片后必须重新校准 `locations.ts` / `hotspotCoordinates.ts`。

主要组件：

- `components/ElderHUD.tsx`
- `components/ElderHotspotLayer.tsx`
- `components/ElderNarrationBox.tsx`
- `components/ElderOpeningOverlay.tsx`
- `components/ElderEnding.tsx`
- `components/ElderMapMini.tsx`
- `components/MemoryFragmentPanel.tsx`
- `components/MemoryFragmentToast.tsx`
- `components/MealInvitationDialog.tsx`
- `components/CaregiverDialog.tsx`

### 7.2 第二章：护理员视角

入口文件：

- `src/modules/caregiver/index.ts`
- `src/modules/caregiver/CaregiverScene.tsx`

核心数据：

- `src/modules/caregiver/data/caregiverState.ts`
- `src/modules/caregiver/data/eventData.ts`
- `src/modules/caregiver/data/chapter2Data.ts`
- `src/modules/caregiver/data/taskData.ts`
- `src/modules/caregiver/logic/summaryRules.ts`
- `src/modules/caregiver/logic/scheduleRules.ts`
- `src/modules/caregiver/assets/assets.ts`

当前真实流程：

```text
intro
  -> shift-timeline
  -> event-scene
      -> intro
      -> observe
      -> guess
      -> intervene
      -> outcome
      -> record
  -> 重复下一个事件
  -> summary
```

注意：

- 当前主流程是线性照护事件解谜，不是旧文档里“拖拽 8 小时排班”的主流程。
- `CHAPTER2_FLOW_VERSION = 'chapter2-linear-v1'`。
- 旧存档或版本不匹配会被 `normalizeCaregiverState()` 重置为初始状态。
- 事件结果记录 `guessedCorrectly`、干预选择、后果和交接记录类型。
- `chapter2Data.ts` 和 `taskData.ts` 仍保留旧排程兼容数据，改主流程时以 `CaregiverScene.tsx` 和 `eventData.ts` 为准。

主要组件：

- `components/ShiftTimelineScene.tsx`
- `components/EventScene.tsx`
- `components/ObservationOverlay.tsx`
- `components/ClueHotspotLayer.tsx`
- `components/GuessPanel.tsx`
- `components/InterventionPanel.tsx`
- `components/EventRecordPanel.tsx`
- `components/Chapter2SummaryPanel.tsx`
- `components/TimeBar.tsx`

### 7.3 第三章：管理者视角

入口文件：

- `src/modules/manager/index.ts`
- `src/modules/manager/ManagerScene.tsx`

核心数据：

- `src/modules/manager/data/managerState.ts`
- `src/modules/manager/data/balanceData.ts`
- `src/modules/manager/data/eventData.ts`
- `src/modules/manager/assets/assets.ts`

当前流程：

```text
office
  -> computer / 信息查看
  -> firstBudget
  -> workEventCall
  -> workEventHandling
  -> familyCall
  -> secondAdjustment
  -> finalReport
  -> nightEnding
  -> completed
```

核心机制：

- 总预算 `TOTAL_BUDGET = 60`。
- 5 个指标：安全保障、老人尊严、运营成本、护理员压力、家属满意。
- 6 个可选预算项，另有 2 个长期锁定展示项。
- 提交第一轮预算前，需要至少查看运营报告和另一类信息。
- 第一轮后触发工作突发事件，事件根据指标和已选预算动态挑选。
- 家庭来电不改变机构指标，但影响最终报告叙事。
- 第二轮可调整 2 次；撤销承诺项会提高信誉风险，也可新增项目。
- 最后生成决策报告和夜晚收束面板。

注意：

- `MANAGER_INITIAL_STATE` 定义了完整状态结构，但当前 `ManagerScene` 没有使用 `useChapterState` 完整持久化。
- 改第三章恢复进度时，优先把 `ManagerScene` 的本地状态收敛到 `ManagerState`，再接入 `UPDATE_CHAPTER_STATE`。

主要组件：

- `components/OfficeScene.tsx`
- `components/ComputerSystem.tsx`
- `components/BulletinBoard.tsx`
- `components/BudgetApprovalPanel.tsx`
- `components/EventCallPanel.tsx`
- `components/FamilyCallPanel.tsx`
- `components/FinalReportPanel.tsx`
- `components/NightEndingPanel.tsx`
- `components/StatusBar.tsx`

---

## 8. 页面和公共组件

页面：

| 文件 | 作用 |
| --- | --- |
| `src/pages/MainMenu.tsx` | 主菜单、角色选择弹窗、历史体验面板、报告弹窗 |
| `src/pages/Settings.tsx` | 字体大小、视觉效果开关、音量滑块、重置进度 |
| `src/pages/Epilogue.tsx` | 终章照片、公益数据和呼吁文案 |
| `src/pages/ChapterSelect.tsx` | 章节选择/调试入口，当前未接路由 |
| `src/pages/data/narrativeData.ts` | 终章叙事、公益数据等页面数据 |

公共组件：

| 目录 | 作用 |
| --- | --- |
| `src/components/layout/` | 页面过渡、游戏布局 |
| `src/components/shared/` | 旁白遮罩、章节完成弹窗 |
| `src/components/ui/` | Button、Dialog、ChapterTitle、NarrativeText、ProgressBar |
| `src/hooks/` | 通用 hooks：动效偏好、拖拽、打字机 |

---

## 9. 样式系统

全局样式：

- `src/styles/variables.css`：主题色、字体、间距、圆角、阴影、动画变量。
- `src/styles/global.css`：reset、基础背景、滚动条、焦点样式。
- `src/styles/typography.css`：标题、正文、旁白等排版。
- `src/styles/animations.css`：通用动画。
- `src/styles/aging-effects.css`：衰老模拟相关效果，由 `data-disable-effects` 控制。

模块样式：

- Elder 使用 `src/modules/elder/styles/elder.css`，纯 CSS，类名前缀大量使用 `elder-`。
- Caregiver 使用 `src/modules/caregiver/styles/caregiver.module.css`，并引入 `tokens.css`、`keyframes.css`。
- Manager 使用 `src/modules/manager/styles/manager.module.css`，包含办公室、电脑系统、预算面板、报告等样式。

修改样式时：

- 模块内样式优先只改本模块目录。
- 公共主题才改 `src/styles/variables.css`。
- 不要随意把运行时依赖状态的 inline style 移到 CSS。
- 改纯 CSS 模块时运行 `npm run check:modules`，避免类名污染。

---

## 10. 资源系统

老人篇图片：

- 映射文件：`src/modules/elder/data/generatedAssets.ts`
- 运行路径：`public/assets/elder/generated/`
- 备份路径：`public/assets/elder/generated_backup/`
- 外部重建资源：`years_puzzle_elder_assets_v5_rebuilt/`

护理员篇图片：

- 映射文件：`src/modules/caregiver/assets/assets.ts`
- 图片目录：`src/modules/caregiver/assets/images/`
- 包含 Scenes、Objects、ActionBeats 素材。

管理者篇图片：

- 映射文件：`src/modules/manager/assets/assets.ts`
- 图片目录：`src/modules/manager/assets/`
- 包含办公室日/夜、电脑聚焦、监控画面等。

终章照片：

- `public/assets/images/photo-elderly/family-dinner.png`
- `src/modules/elder/data/puzzleData.ts` 导出 `PUZZLE_PHOTOS`，`Epilogue.tsx` 间接使用。

---

## 11. 修改入口速查

| 想改什么 | 优先看哪里 |
| --- | --- |
| 新增/调整章节注册 | `src/modules/register.ts`, `src/core/chapterRegistry.ts` |
| 调整路由 | `src/routes/index.tsx` |
| 修改章节通用流程、暂停层、完成弹窗 | `src/routes/ChapterWrapper.tsx` |
| 修改存档、设置、全局状态 | `src/core/GameContext.tsx`, `src/core/types.ts`, `src/core/gameReducer.ts` |
| 修改主页角色选择/历史记录/报告 | `src/pages/MainMenu.tsx`, `src/pages/MainMenu.module.css` |
| 修改设置页 | `src/pages/Settings.tsx`, `src/pages/Settings.module.css` |
| 修改终章 | `src/pages/Epilogue.tsx`, `src/pages/data/narrativeData.ts` |
| 修改老人地点/热点/移动 | `src/modules/elder/data/locations.ts`, `hotspotCoordinates.ts`, `ElderHotspotLayer.tsx` |
| 修改老人动作和状态影响 | `src/modules/elder/data/actions.ts`, `actionResultResolver.ts`, `useElderState.ts` |
| 修改老人时间流逝 | `src/modules/elder/hooks/useElderTime.ts`, `src/modules/elder/types.ts` |
| 修改老人回忆碎片 | `src/modules/elder/data/memoryFragments.ts`, `fragmentResolver.ts`, `MemoryFragmentPanel.tsx` |
| 修改老人电话/来电 | `src/modules/elder/data/incomingCallResolver.ts`, `ElderScene.tsx` |
| 修改老人结局 | `src/modules/elder/data/endingConfig.ts`, `ElderEnding.tsx` |
| 替换老人图片 | `public/assets/elder/generated/`, `src/modules/elder/data/generatedAssets.ts` |
| 修改护理员事件 | `src/modules/caregiver/data/eventData.ts`, `EventScene.tsx` |
| 修改护理员状态/存档兼容 | `src/modules/caregiver/data/caregiverState.ts` |
| 修改护理员总结规则 | `src/modules/caregiver/logic/summaryRules.ts` |
| 修改护理员素材映射 | `src/modules/caregiver/assets/assets.ts` |
| 修改管理者预算项/指标 | `src/modules/manager/data/balanceData.ts`, `BudgetApprovalPanel.tsx` |
| 修改管理者突发事件/家庭来电 | `src/modules/manager/data/eventData.ts`, `EventCallPanel.tsx`, `FamilyCallPanel.tsx` |
| 修改管理者电脑系统 | `src/modules/manager/components/ComputerSystem.tsx` |
| 修改管理者最终报告 | `src/modules/manager/components/FinalReportPanel.tsx`, `NightEndingPanel.tsx` |
| 修复中文乱码 | 优先从 `index.html`, `src/pages/**`, `src/routes/ChapterWrapper.tsx`, `src/modules/**/index.ts`, `src/modules/**/data/**` 开始 |

---

## 12. 模块隔离约定

仓库提供 `scripts/check-modules.mjs`，规则大意：

1. 禁止模块互相深度 import 内部文件。
2. 跨模块共享能力应放到 `src/core/` 或 `src/components/`。
3. 模块资源不应被其他模块或公共层硬编码引用。
4. 纯 CSS 文件应使用模块前缀，例如 `elder-`、`caregiver-`、`manager-`。
5. `src/modules/register.ts` 是少数允许统一 import 各模块入口的地方。

新增模块时：

1. 在 `src/modules/新模块/` 创建模块目录。
2. 在模块 `index.ts` 导出 `ChapterConfig`。
3. 在 `src/modules/register.ts` 注册。
4. 避免从其他模块内部文件 import，只通过公共层或目标模块 `index.ts` 暴露的 API 交互。

---

## 13. 已知问题和风险

| 问题 | 影响 | 建议 |
| --- | --- | --- |
| 中文文案/注释大量乱码 | 用户界面、文档和维护体验受影响 | P0，优先修复用户可见文案和核心文档 |
| `ChapterSelect.tsx` 未接路由 | 旧说明中的 `/chapters` 不可访问 | 需要调试入口时再显式注册路由 |
| Manager 运行时状态未完整持久化 | 刷新或中途退出后第三章不能可靠恢复 | 接入 `useChapterState` 或阶段性持久化 |
| 音量设置没有实际音频系统 | 设置页 BGM/SFX 滑块目前只是状态 | 接入音频服务或标注未启用 |
| 自动化测试缺失 | 修改后主要依赖 lint/build 和手动验证 | 补 reducer、registry、关键规则测试 |
| 历史 Markdown 与当前实现不一致 | 后续 AI 可能被旧文档误导 | 以源码和本文件为准，必要时同步重写 README |
| `README.md`、`MODULE_ISOLATION_REPORT.md` 等也可能乱码 | 对外展示和协作说明不可直接使用 | 后续统一重写或修复编码 |

---

## 14. 开发注意事项

1. 不要让三个业务模块互相 import 内部文件。跨模块共享能力先放到 `src/core/` 或 `src/components/`。
2. 修改 `src/core/` 会影响所有章节，先用 `rg` 查调用点。
3. 修改存档结构时，同步考虑 `migrateLegacyState()` 或模块自己的 normalize 函数。
4. 老人篇热点坐标与图片强绑定，换图后必须重新校准坐标。
5. 护理员篇当前是线性事件流程，不要按旧排程玩法直接改主流程，除非明确要恢复排程版。
6. 管理者篇预算设计意图是“没有完美方案”，不要通过简单提高总预算或降低全部成本破坏取舍。
7. 处理中文文案前先确认编码，避免继续提交 mojibake。
8. 修改交互或样式后，至少手动跑一遍对应章节关键路径。

---

## 15. 建议下一步

P0：

- 修复用户可见中文乱码：`index.html`、`src/pages/**`、`src/routes/ChapterWrapper.tsx`、三个模块 `index.ts`、事件数据、终章文案。
- 跑 `npm run build`、`npm run lint`、`npm run check:modules`，记录当前基线。
- 决定是否恢复 `/chapters` 路由；如果不恢复，清理旧文档里的章节选择说明。

P1：

- 给 Manager 接入章节状态持久化。
- 给 `chapterRegistry`、`gameReducer`、Caregiver normalize、Manager budget/event 规则补测试。
- 重写 `README.md`，让对外说明和 `AI_README.md` 保持一致。

P2：

- 接入真实音频系统，或移除暂不可用的音量设置。
- 增强移动端适配、键盘可访问性和屏幕阅读器支持。
- 清理历史兼容数据、未使用旧文件和重复资源。

---

## 16. 接手清单

- [ ] 先读本文件。
- [ ] 读 `package.json`，确认命令和依赖。
- [ ] 读 `src/App.tsx`、`src/routes/index.tsx`、`src/routes/ChapterWrapper.tsx`。
- [ ] 读 `src/core/GameContext.tsx`、`src/core/types.ts`、`src/core/gameReducer.ts`。
- [ ] 读目标模块的 `index.ts`、主 Scene、`data/`、`components/` 和 `styles/`。
- [ ] 修改前用 `rg` 搜索目标标识符，确认影响范围。
- [ ] 修改后至少运行 `npm run build`；若涉及模块边界，再运行 `npm run check:modules`。
- [ ] 如果改了 UI、动效、热点或流程，启动本地开发服务并手动走一遍相关章节。
- [ ] 如果处理中文文案，先修复编码，不要复制仓库里的乱码句子。

# 护理员模块 · 旧分支清理台账

> 建立日期：2026-06-19
> 用途：跟踪所有旧状态字段、旧组件、旧数据字段和旧资源的清理进度。
> 规则：每项必须有替代来源或明确删除理由，不允许无限期"兼容保留"。

## 状态枚举

```
待确认     — 尚未决定如何处理
仍在运行   — 当前生产链路中活跃
兼容保留   — 仍需保留但已标记，必须写明阻塞原因
已停用     — 新链路不再写入但旧读取逻辑仍存在
可删除     — 零引用，等待下一批删除
已删除     — 已从代码中移除
```

---

## S: 状态字段

| ID | 文件 | 字段 | 当前用途 | 替代来源 | 删除前置 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| S-01 | caregiverState.ts | `EventStep = 'intervene'` | 旧的独立干预阶段 | 直接 'observe' -> 'outcome' | Batch 3 通过 | 已删除 |
| S-02 | caregiverState.ts | `observeProgress` | 旧观察推进计数 | `resolveInsightLevel` | Batch 3 通过 | 已停用 |
| S-03 | caregiverState.ts | `elderOpenTriggered` | 防止老人主动开口动画重复 | 无，产品取消 | Batch 3 通过 | 已停用 |
| S-04 | caregiverState.ts | `peekedClueIds` | 旧查看痕迹 | 无，产品取消 | Batch 7 通过 | 仍在运行 |
| S-05 | caregiverState.ts | `discoveredClueIds` (顶层) | 全局已发现线索 | `EventInteractionState.recordedClueIds` | Batch 7 通过 | 仍在运行 |
| S-06 | caregiverState.ts | `timeline` | 旧时间线数组 | 无 | Batch 7 通过 | 兼容保留 |
| S-07 | caregiverState.ts | `observedClueIds` | 旧观察列表 | 无 | Batch 7 通过 | 兼容保留 |
| S-08 | caregiverState.ts | `EventResult.recordType` | 二元记录类型 | 三级 `insightLevel` 快照 | Batch 4 通过 | 兼容保留 |
| S-09 | caregiverState.ts | `EventResult.discoveredClueIds` | 事件内已发现线索 | `EventInteractionState.recordedClueIds` | Batch 7 通过 | 仍在运行 |
| S-10 | caregiverState.ts | `EventResult.observeDepth` | 观察深度 | 无，产品取消 | Batch 4 通过 | 已停用 |
| S-11 | caregiverState.ts | `EventInteractionState.insightLevelSnapshot` | 执行时固化的理解等级快照 | 新增字段 | Batch 1 通过 | 已实现 |
| S-12 | caregiverState.ts | `EventInteractionState.peekedClueIds` | 旧查看痕迹 | 无 | Batch 7 通过 | 仍在运行 |

---

## D: 数据字段（事件配置）

| ID | 文件 | 字段 | 当前用途 | 替代来源 | 删除前置 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| D-01 | eventData.ts | `EventClue` 接口 (clues 数组) | 旧线索真源 | `clueRegistry.ts` | 零引用 | 仍在运行 |
| D-02 | eventData.ts | `recordTemplate.surface` | 二元表面记录 | 三级 `insight0/1/2` 模板 | Batch 4 通过 | 仍在运行 |
| D-03 | eventData.ts | `recordTemplate.understanding` | 二元理解记录 | 三级 `insight0/1/2` 模板 | Batch 4 通过 | 仍在运行 |
| D-04 | eventData.ts | `requiredKeyCluesToUnderstand` | 旧关键线索阈值 | `UnifiedCareEventScene.keyClueThreshold` | 零引用 | 仍在运行 |
| D-05 | eventData.ts | `coreNeed` | 老人核心需求说明 | 无，仅文档 | 零引用 | 仍在运行 |
| D-06 | eventData.ts | `elderOpenAction` | 老人主动开口旁白 | 无，产品取消 | Batch 3 通过 | 仍在运行 |
| D-07 | eventData.ts | `spatialPosition` | 旧干预空间位置 | `InterventionHotspot.anchor` | Batch 2 通过 | 仍在运行 |
| D-08 | eventData.ts | `spatialSize` | 旧干预空间尺寸 | `InterventionHotspot.hitRadius` | Batch 2 通过 | 仍在运行 |
| D-09 | eventData.ts | `hoverThought` | 旧悬停护工独白 | `InsightCopy.thought` | Batch 2 通过 | 仍在运行 |
| D-10 | eventData.ts | `label` (InterventionOption) | 旧行动标签 | `InsightCopy.label` | Batch 2 通过 | 仍在运行 |
| D-11 | eventData.ts | `actionText` | 旧行动描述 | 结果旁白已足够 | Batch 2 通过 | 仍在运行 |
| D-12 | eventData.ts | `feedback` (InterventionOption) | 旧老人反应 | 结果 CG 旁白 | Batch 4 通过 | 仍在运行 |
| D-13 | eventData.ts | `hasEnoughKeyClues()` | 旧关键线索判定 | `resolveInsightLevel` | Batch 1 通过 | 仍在运行 |
| D-14 | unifiedSceneData.ts | `InterventionHotspot` (旧接口) | labelLowInsight/labelHighInsight/thoughtLowInsight/thoughtHighInsight | 三级 `copy.insight0/1/2` | Batch 2 通过 | 仍在运行 |
| D-15 | unifiedSceneData.ts | `actionImage` | ACT_* 过渡图 | 结果 CG 直接进入 | Batch 5 通过 | 仍在运行 |
| D-16 | unifiedSceneData.ts | `shape` / `targets` (旧圆点) | 多圆形入口 | 单小圆点 `anchor` | Batch 2 通过 | 仍在运行 |

---

## C: 组件

| ID | 文件 | 当前用途 | 替代来源 | 删除前置 | 状态 |
| --- | --- | --- | --- | --- | --- |
| C-01 | components/unified/ActionTransitionOverlay.tsx | 旧 ACT_* 行动过渡叠层 | 直接进入结果 CG | Batch 5 通过 | 仍在运行 |
| C-02 | components/unified/AnimationOverlay.tsx | 旧全屏动画播放 | `ClueFeedbackOverlay` (local micro-animation) | Batch 6 通过 | 仍在运行 |
| C-03 | components/SceneEnvironment.tsx | 旧 CSS 绘制场景物品 | 主背景图 + 热点层 | 零引用 | 仍在运行 |
| C-04 | components/ElderVisual.tsx | 旧 SVG 老人视觉层 | 背景图中的老人形象 | 零引用 | 仍在运行 |
| C-05 | components/Chapter2SummaryPanel.tsx | 旧结算面板（已废弃） | `CorridorBreath` + `CaregiverEnding` | 零引用 | 待确认 |
| C-06 | data/chapter2Data.ts | 旧结局配置 | `caregiverEndingData.ts` | 零引用 | 仍在运行 |
| C-07 | logic/summaryRules.ts | 旧结算规则（已废弃） | `caregiverEndingData.ts` | 零引用 | 待确认 |
| C-08 | data/eventData.ts `EventClue` | 旧线索接口（组件直接引用 eventData.clues） | `clueRegistry` | 零引用 | 仍在运行 |
| C-09 | logic/recordRules.ts `getAutoRecordType` | 二元记录判定(surface/understanding) | 三级 insightLevel 快照判定 | Batch 4 通过 | 仍在运行 |

---

## A: 资源

| ID | 文件/目录 | 当前用途 | 替代来源 | 删除前置 | 状态 |
| --- | --- | --- | --- | --- | --- |
| A-01 | assets/images/UnifiedScenes/ | 重复场景资源目录 | `caregiver_assets` | 零引用 | 待确认 |
| A-02 | assets/assets.ts `ACT_*` 注册 | ACT 过渡图（9张） | `SCN_*` 结果 CG | Batch 5 通过 | 仍在运行 |
| A-03 | assets/assets.ts `ANM_*` 全屏动画帧 | 旧全屏动画（34帧） | 局部补丁动画或降级 | Batch 6 通过 | 仍在运行 |
| A-04 | eventData.ts 旧线索数据 | 旧线索配置（32条） | `clueRegistry.ts` | 零引用 | 仍在运行 |

---

## 空间位置元素（需删除的 CSS 类）

| ID | CSS 类 | 文件 | 用途 | 删除前置 | 状态 |
| --- | --- | --- | --- | --- | --- |
| CSS-01 | `interveneGhost` | UnifiedCareScene.module.css | 行动区域幽灵状态 | Batch 2 通过 | 仍在运行 |
| CSS-02 | `interveneActive` | UnifiedCareScene.module.css | 行动区域激活状态 | Batch 2 通过 | 仍在运行 |
| CSS-03 | `hotspotInsightBadge` | UnifiedCareScene.module.css | 理解徽章样式 | Batch 2 通过 | 仍在运行 |
| CSS-04 | `animFrame` (全屏) | UnifiedCareScene.module.css | 全屏动画帧样式 | Batch 6 通过 | 仍在运行 |
| CSS-05 | `peeked` 相关样式 | UnifiedCareScene.module.css | 查看但未记录样式 | Batch 7 通过 | 仍在运行 |

---

## 清理日志

| 日期 | Batch | 操作 | 涉及 ID | 说明 |
| --- | --- | --- | --- | --- |
| 2026-06-19 | 0 | 建立台账 | 全部 | 初始化清理台账，记录当前基线 |
| 2026-06-19 | 1 | 新增类型和选择器 | S-11, D-14, D-15, D-16 | insightRules.ts创建, InsightLevel/InsightCopy/copy/outcomeFeedback/recordTemplates定义 |
| 2026-06-19 | 2 | 行动点圆点化 | C-09, CSS-01~03, D-07~10, D-14 | 创建ActionPoint/ActionPreviewCard/ActionTargetGuide, 9个行动点anchor/hitRadius/targetGroup/cardAnchor, 三级copy文案补全 |
| 2026-06-19 | 3 | 删除intervene+固化insightLevel | S-01~03, S-05~06 | EventStep移除intervene, v4版本号, insightLevelSnapshot固化 |
| 2026-06-19 | 4 | 三级结果旁白与记录 | S-08~10, D-02~03, D-12, C-09 | 9×3三级outcomeFeedback+recordTemplates补全, EventRecordPanel三级显示 |
| 2026-06-19 | 5 | 结果CG改造 | C-01, D-15, A-02 | OutcomeImagePanel独立化+fade+误触保护, ActionTransitionOverlay.tsx删除, actionImage标记deprecated |
| 2026-06-19 | 6 | 统一线索反馈容器 | C-02, A-03, C-09 | ClueFeedbackOverlay创建(微动画/特写/高亮), 首轮动画降级, AnimationOverlay.tsx退出运行链 |
| 2026-06-19 | 7 | 移除peeked+全局线索 | S-04~05, S-12 | handleCluePeek停写, discoveredClueIds停写, getClueState不检查peeked |
| 2026-06-19 | 8 | 最终总结输入升级 | — | caregiverEndingData使用新EventResult字段(insightLevel) |
| 2026-06-19 | 9 | 台账终态更新 | C-01~02, C-05~07, A-01~04 | 标记ActionTransitionOverlay/AnimationOverlay旧组件为已删除, 标记已停用CSS类 |

/**
 * === 第二章线性事件数据 ===
 * 每个事件按班次时间线排列，玩家按顺序经历。
 * UI 组件从数据配置渲染，不硬编码文案。
 */

// ============================================================
// 类型定义
// ============================================================

export type ClueType = 'action' | 'object' | 'language' | 'contradiction' | 'environment';

/** 场景物品ID —— 用于映射可交互场景物品到具体线索 */
export type SceneItemId =
  | 'chopsticks'   // 筷子/碗
  | 'plate'        // 餐盘
  | 'medicine'     // 药瓶
  | 'cup'          // 水杯
  | 'cane'         // 拐杖
  | 'corridor'     // 走廊
  | 'album'        // 相册
  | 'glucose'      // 血糖仪/记录本
  | 'phone'        // 手机
  | 'sweater'      // 毛衣
  | 'watch'        // 手表
  | 'elder_hand'   // 老人的手
  | 'elder_gaze'   // 老人的视线
  | 'window'       // 窗台/窗户
  | 'photo_frame'  // 相框
  | 'porridge'     // 粥碗（区别于 plate）
  | 'clock'        // 墙上的钟
  | 'shoe'         // 鞋
  | 'calendar'     // 日历
  | 'handrail'     // 扶手
  | 'footstep'     // 脚印
  | 'fruit'        // 水果
  | 'curtain'      // 窗帘
  | 'medicine_box' // 药盒
  | 'pen';         // 笔

/** 单条可观察线索 */
export interface EventClue {
  id: string;
  type: ClueType;
  /** 热点短标签（悬停时显示） */
  label: string;
  /** 点击后的观察描述（不直接给答案） */
  observation: string;
  /** 是否关键线索 */
  isKey: boolean;
  /** 画布热点定位 */
  position: { top: string; left: string };
  /** 关联的场景物品ID（点击场景物品可触发此线索） */
  sceneItemId?: SceneItemId;
  /** P0-C: 是否触发老人身体反应。默认 true，environment 类型应设为 false */
  triggersReaction?: boolean;
  /** P2-A: 迁移条件 —— 需要从指定前置事件中发现指定线索 */
  requiresClueFromEvent?: {
    eventId: string;
    clueId: string;
  };
  /** P2-A: 满足迁移条件时显示的额外旁白（叠加在 observation 之后） */
  migrationText?: string;
}

// P0-A: NeedGuessOption 已删除，guessOptions 已迁移至 requiredKeyCluesToUnderstand

/** 干预分支选项 */
export interface InterventionOption {
  id: string;
  /** 分支标签 */
  label: string;
  /** 护工行动描述 */
  actionText: string;
  /** 后果级别 */
  consequence: 'success' | 'partial' | 'failure';
  /** 老人反应描述 */
  feedback: string;
  /** 交接记录模板（旧二元，Batch 4 后将删除 surface/understanding） */
  recordTemplate: {
    surface: string;
    understanding: string;
  };
  /** Batch 1: 三级结果旁白。按 insightLevel 选择对应文案 */
  outcomeFeedback?: {
    insight0: string;
    insight1: string;
    insight2: string;
  };
  /** Batch 1: 三级记录模板。按 insightLevel 选择对应文案 */
  recordTemplates?: {
    insight0: string;
    insight1: string;
    insight2: string;
  };
  /** P1-A: 干预选项的空间位置（百分比，相对场景容器） */
  spatialPosition: { top: string; left: string };
  /** P1-A: 空间热点的可视尺寸 */
  spatialSize: { width: string; height: string };
  /** P1-A: 悬停时的护工内心独白 */
  hoverThought?: string;
}

/** 单个照护事件完整配置 */
export interface CareEvent {
  id: string;
  /** 触发时间 */
  time: string;
  /** 地点 */
  location: string;
  /** 老人ID */
  elderId: string;
  /** 老人姓名 */
  elderName: string;
  /** 场景入场描述 */
  introText: string;
  /** 可点击线索列表 */
  clues: EventClue[];
  /** P0-A: 最少需要发现几条关键线索才能理解老人核心需求（原 guessOptions.minKeyCluesRequired） */
  requiredKeyCluesToUnderstand: number;
  /** P0-A: 老人的核心需求说明（不作状态推进，仅说明文本） */
  coreNeed: string;
  /** P0-D: observe 进度满时老人的主动动作旁白（触发 observe→intervene 转折） */
  elderOpenAction: string;
  /** 干预分支列表 */
  interventionOptions: InterventionOption[];
  /** 事件标题（时间轴显示用） */
  title: string;
}

// ============================================================
// 王奶奶饭点拒食（08:10）
// ============================================================

const EVENT_WANG_MEAL: CareEvent = {
  id: 'event_wang_meal_0810',
  time: '08:10',
  location: '301 · 王奶奶房间',
  elderId: 'wang',
  elderName: '王奶奶',
  title: '饭点拒食',
  introText:
    '早饭时间到了。王奶奶坐在桌前，餐盘里的粥和菜摆得整整齐齐。她抬头看了你一眼，轻轻摆了摆手："我不饿，你去忙吧。"但餐盘几乎没动过——筷子还搭在碗沿上，微微发颤。',

  clues: [
    {
      id: 'wang_clue_withdraw',
      type: 'action',
      label: '缩回的手',
      observation:
        '她试了一下，筷子碰了碰碗沿又放下。最后把手慢慢缩回被子下面——不是因为冷，是因为不想让旁边的人看到自己拿不稳的样子。',
      isKey: true,
      position: { top: '48%', left: '30%' },
      triggersReaction: true,
    },
    {
      id: 'wang_clue_chopsticks',
      type: 'action',
      label: '拿起又放下的筷子',
      observation:
        '筷子被轻轻碰开后没有再扶正——不像是没注意到，更像是知道再试也拿不稳。勺子还在够得到却不好握的位置。',
      isKey: false,
      position: { top: '62%', left: '42%' },
      sceneItemId: 'chopsticks',
      triggersReaction: true,
    },
    {
      id: 'wang_clue_plate',
      type: 'object',
      label: '几乎未动的餐盘',
      observation:
        '米饭只少了一个角。菜的表面还泛着油光，筷子印只有浅浅两道。汤勺在餐盘最远的一角，勺子背面是干的。',
      isKey: true,
      position: { top: '55%', left: '58%' },
      sceneItemId: 'plate',
      triggersReaction: true,
    },
    {
      id: 'wang_clue_medicine',
      type: 'object',
      label: '打开但未服用的药瓶',
      observation:
        '药瓶被转了半圈——她反复侧过头凑近了看，最后还是放下了。标签上的字印得太小。水杯和药盒就放在旁边，三样东西她都备齐了，只差确认标签上那几个字。',
      isKey: true,
      position: { top: '32%', left: '50%' },
      sceneItemId: 'medicine',
      triggersReaction: true,
    },
    {
      id: 'wang_clue_gaze',
      type: 'language',
      label: '落在药瓶上的视线',
      observation:
        '她说话时目光不在你身上。她的视线两次落在药瓶标签上——每次停留一两秒，又很快移开，回到桌面上。',
      isKey: false,
      position: { top: '28%', left: '55%' },
      triggersReaction: true,
    },
    {
      id: 'wang_clue_porridge',
      type: 'object',
      label: '碗里的粥',
      observation:
        '碗里的粥表面结了一层薄薄的膜——放了一段时间了。粥还是温的，但已经不烫了。碗的内壁上有一圈痕迹，说明之前粥是满的。',
      isKey: true,
      position: { top: '58%', left: '48%' },
      sceneItemId: 'porridge',
      triggersReaction: true,
    },
    {
      id: 'wang_clue_photo',
      type: 'object',
      label: '床头的全家福',
      observation:
        '床头柜上摆着一张全家福，玻璃面有一道裂痕——从边上裂到中间。照片里的人笑着，但相框上积了一层薄薄的灰。旁边放着一块干抹布。',
      isKey: false,
      position: { top: '38%', left: '18%' },
      sceneItemId: 'photo_frame',
      triggersReaction: true,
    },
    {
      id: 'wang_clue_clock',
      type: 'environment',
      label: '墙上的钟',
      observation:
        '墙上的钟指向 8:10。钟下面贴着一张纸条，用铅笔写着"早餐 7:30"——字迹歪歪扭扭的。纸条的角翘了起来，背面胶已经不太粘了。',
      isKey: true,
      position: { top: '15%', left: '45%' },
      sceneItemId: 'clock',
      triggersReaction: false,
    },
    {
      id: 'wang_clue_cup',
      type: 'object',
      label: '药瓶旁的水杯',
      observation:
        '水杯放在药瓶旁边，杯子里还有半杯水。药片、水杯、药盒——三样东西她都准备好了。唯一还没准备好的是该怎么开口问。',
      isKey: false,
      position: { top: '40%', left: '65%' },
      triggersReaction: true,
    },
    {
      id: 'wang_clue_door',
      type: 'environment',
      label: '右侧房门',
      observation:
        '门虚掩着。走廊里偶尔有脚步声经过——每一道脚步声经过，她的筷子就在半空中停一下。她不想让人看到自己连碗都端不稳。',
      isKey: false,
      position: { top: '24%', left: '75%' },
      triggersReaction: false,
    },
  ],

  // P0-A: 原 guessOptions 阈值已迁移
  requiredKeyCluesToUnderstand: 2,
  coreNeed: '她想吃，但手抖不方便；药也看不清，怕吃错。',
  elderOpenAction: '她慢慢把药瓶推向你这边。',

  interventionOptions: [
    {
      id: 'wang_intervene_leave',
      label: '问一句就离开',
      actionText: '既然她说不用管，你就先去忙别的了。',
      consequence: 'failure',
      feedback:
        '后来，你在护士站接到呼叫——王奶奶胃痛，血糖偏低。护长找到你："早餐为什么不确认进食情况？她说不用管你就真不管了？"你这时候才想起那盘几乎没动的饭菜。',
      recordTemplate: {
        surface: '08:10 王奶奶表示不饿，暂未进食。',
        understanding:
          '08:10 她说"我不饿"。我只是问了问，她没有回应我就离开了。后来才知道她手抖夹不起菜，药也没敢吃。我今天学到一件事："你去忙吧"有时候是最响的求救。',
      },
      outcomeFeedback: {
        insight0: '后来，你在护士站接到呼叫——王奶奶胃痛，血糖偏低。护长找到你："她说不用管你就真不管了？"你这时候才想起那盘几乎没动的饭菜。',
        insight1: '后来，你在护士站接到呼叫——王奶奶胃痛，血糖偏低。你记得看到饭菜没动，但当时没有多停一步。',
        insight2: '后来，你在护士站接到呼叫。你记得那盘几乎没动的饭菜、颤抖的手和没吃的药——你看见了这一切，只是选择了离开。',
      },
      recordTemplates: {
        insight0: '08:10 王奶奶表示不饿，暂未进食。',
        insight1: '08:10 她说"我不饿"。我注意到饭菜几乎没动、手在抖，但没有多停一步就离开了。',
        insight2: '08:10 她说"我不饿"。我看见饭菜没动、手在抖、药瓶标签看不清——但我选择了离开。今天学到一件事："你去忙吧"有时候是最响的求救。',
      },
      // P1-A: 空间位置 — 门口方向（与 unifiedSceneData 对齐）
      spatialPosition: { top: '16%', left: '82%' },
      spatialSize: { width: '11%', height: '38%' },
      hoverThought: '先去忙别的吧……',
    },
    {
      id: 'wang_intervene_command',
      label: '站着催她吃',
      actionText: '"王奶奶，您必须吃。不吃身体会出问题的。"',
      consequence: 'partial',
      feedback:
        '王奶奶沉默了一下，把手从桌下拿出来——还在抖。她勉强拿起筷子，但只夹了一下又放下。"我知道要吃的。"她的声音很低，脸上有一种被命令后的委屈。你帮她夹了菜，但她吃得很少。药瓶的事，她还是没说。',
      recordTemplate: {
        surface: '08:10 协助王奶奶进食，进食量约一半。',
        understanding:
          '08:10 进食协助。我用"必须"催她吃，她配合了但情绪很低。后来我发现药瓶还开着——她手抖看不清标签，但不愿告诉我。下次我会先帮她看药，再帮她把菜夹到碗里。她需要的不是催，是帮忙。',
      },
      outcomeFeedback: {
        insight0: '王奶奶拿起筷子又放下。"我知道要吃的。"她的声音很低。你帮她夹了菜，但她吃得很少。',
        insight1: '她配合了，但情绪很低。你注意到她的手还在抖——药瓶也还开着，但你没问。',
        insight2: '她配合了，但情绪很低。我帮她夹了菜，但没问药的事——她的手还在抖，药瓶开着。我看见了，却只做了流程里的事。下次我会先帮她看药。',
      },
      recordTemplates: {
        insight0: '08:10 协助王奶奶进食，进食量约一半。',
        insight1: '08:10 进食协助。她配合了但情绪很低，手抖的情况未缓解。',
        insight2: '08:10 进食协助。她配合了但情绪很低。药瓶还开着——她手抖看不清标签，但没告诉我。下次我会先帮她看药，再帮她把菜夹到碗里。她需要的不是催，是帮忙。',
      },
      // P1-A: 空间位置 — 餐桌区域（与 unifiedSceneData 对齐）
      spatialPosition: { top: '50%', left: '38%' },
      spatialSize: { width: '23%', height: '26%' },
      hoverThought: '"您必须吃"',
    },
    {
      id: 'wang_intervene_gentle',
      label: '坐下，帮她夹一口菜',
      actionText:
        '你拉开椅子坐在她旁边，先帮她把餐盘里的菜轻轻夹到碗边："今天的粥很软，试试看我帮你拌一下？药我也帮你对一下标签。"',
      consequence: 'success',
      feedback:
        '王奶奶的肩膀慢慢放松了。你帮她辨认了药瓶上的标签，把要吃的药分出来放在小碟里。"姑娘，"她忽然开口，"你这孩子比我儿子来得还多。"她拿起筷子，虽然手还在微微颤着，但这一次——她开始吃了。',
      recordTemplate: {
        surface: '08:10 协助王奶奶完成早餐及服药。',
        understanding:
          '08:10 进食协助。她说了三次"不用管我"。手抖得厉害，药瓶标签小到看不清——她不是不饿，是怕麻烦我。我帮她辨认了药片、拌了粥。她最后告诉我"你比我儿子来得还多"。这句话我记下了——有些老人需要的不是流程，是有人坐下来看她一眼。',
      },
      outcomeFeedback: {
        insight0: '王奶奶的肩膀慢慢放松了。你帮她夹了菜，她开始吃了。',
        insight1: '你帮她辨认了药瓶上的标签，把要吃的药分出来放在小碟里。"姑娘，"她忽然开口，"你这孩子比我儿子来得还多。"',
        insight2: '你帮她辨认了药瓶上的标签，把要吃的药分出来放在小碟里。"姑娘，"她忽然开口，"你这孩子比我儿子来得还多。"她拿起筷子，虽然手还在微微颤着，但这一次——她开始吃了。',
      },
      recordTemplates: {
        insight0: '08:10 协助王奶奶完成早餐及服药。',
        insight1: '08:10 进食协助。她手抖得厉害，药瓶标签小到看不清——她不是不饿，是怕麻烦我。我帮她辨认了药片、拌了粥。',
        insight2: '08:10 进食协助。她说了三次"不用管我"。手抖得厉害，药瓶标签小到看不清——她不是不饿，是怕麻烦我。我帮她辨认了药片、拌了粥。她最后告诉我"你比我儿子来得还多"。这句话我记下了——有些老人需要的不是流程，是有人坐下来看她一眼。',
      },
      // P1-A: 空间位置 — 药瓶/水杯区域（与 unifiedSceneData 对齐）
      spatialPosition: { top: '48%', left: '63%' },
      spatialSize: { width: '23%', height: '25%' },
      hoverThought: '坐下来……帮她夹一口菜',
    },
  ],
};

// ============================================================
// 李爷爷拉铃/走廊险些跌倒（09:20）
// ============================================================

const EVENT_LI_CALL: CareEvent = {
  id: 'event_li_call_0920',
  time: '09:20',
  location: '302 · 李爷爷房间 / 走廊',
  elderId: 'li',
  elderName: '李爷爷',
  title: '康复缺席',
  introText:
    '你路过走廊时，看到李爷爷扶着墙，脚步有些不稳。他看见你，立刻把手从墙上拿开，站直了身体。"没事没事，就是脚滑了一下。"他避开你的视线，往自己房间走去。你知道——今天上午有集体康复训练，他没去。',

  clues: [
    {
      id: 'li_clue_room_photo',
      type: 'object',
      label: '床头小照片',
      observation:
        '透过半开的门缝，房间里隐约能看到床头柜上的一张小照片。即便是从这个角度——隔着门和走廊——它仍然是被刻意摆正了的。',
      isKey: true,
      position: { top: '39%', left: '85%' },
      sceneItemId: 'album',
      triggersReaction: true,
    },
    {
      id: 'li_clue_cane',
      type: 'contradiction',
      label: '靠墙很远的拐杖',
      observation:
        '拐杖靠在房门边，离他的手有几步远——要够到它，他必须先不靠拐杖走出这几步。把手处却很干净，没有落灰。他平时常用，只是不想被别人看见。',
      isKey: false,
      position: { top: '65%', left: '25%' },
      sceneItemId: 'cane',
      triggersReaction: true,
    },
    {
      id: 'li_clue_gaze',
      type: 'language',
      label: '避开的视线',
      observation:
        '他说话的时候，目光先往走廊两边各扫了一眼——确认没人经过，才落在你身上。他不是不敢看你，是不习惯被人看。',
      isKey: false,
      position: { top: '35%', left: '38%' },
      sceneItemId: 'corridor',
      triggersReaction: true,
      // P2-A: 如果曾发现王奶奶的"落在药瓶上的视线"
      requiresClueFromEvent: { eventId: 'event_wang_meal_0810', clueId: 'wang_clue_gaze' },
      migrationText: '你突然想起王奶奶——她也这样避开你的目光。两次了，同一天。不说话的方式比说话更重要。',
    },
    {
      id: 'li_clue_calendar',
      type: 'object',
      label: '日历上的圈',
      observation:
        '墙上的日历翻到这一页就没有再撕了。今天的日期被红笔圈了起来，旁边写着一个名字。红笔印在纸背上透了过去——写字的人按得很用力。',
      isKey: true,
      position: { top: '22%', left: '42%' },
      sceneItemId: 'calendar',
      triggersReaction: true,
    },
    {
      id: 'li_clue_shoe',
      type: 'object',
      label: '门口的鞋',
      observation:
        '门口放着一双布鞋，鞋底的纹路快磨平了。鞋带系得很紧——打了双结。鞋里面有一张叠好的纸条，露了一角。',
      isKey: false,
      position: { top: '78%', left: '30%' },
      sceneItemId: 'shoe',
      triggersReaction: true,
    },
    {
      id: 'li_clue_handrail',
      type: 'environment',
      label: '磨损的扶手',
      observation:
        '走廊扶手有一小段漆面被磨得发亮——刚好是手掌反复抓握的位置。瓷砖墙面上还有几道浅浅的手掌印，位置比扶手低一些，像是够不着扶手时留下的。',
      isKey: true,
      position: { top: '52%', left: '35%' },
      sceneItemId: 'handrail',
      triggersReaction: false,
    },
    {
      id: 'li_clue_footstep',
      type: 'environment',
      label: '地上的脚印',
      observation:
        '地板上有几处不规则的摩擦印，间距越来越小。从房间门口一直延伸到走廊中间——然后转向，往窗边的方向去了。',
      isKey: true,
      position: { top: '70%', left: '50%' },
      sceneItemId: 'footstep',
      triggersReaction: false,
    },
    {
      id: 'li_clue_window',
      type: 'environment',
      label: '窗外康复人群',
      observation:
        '窗外院子里，一群人在做集体康复。有人在笑，有人在喊口令。他看了一眼——就一眼——然后把视线收回来，收得特别快。像是不想被那边的人注意到自己也在看。',
      isKey: false,
      position: { top: '17%', left: '49%' },
      sceneItemId: 'window',
      triggersReaction: false,
    },
    {
      id: 'li_clue_callbell',
      type: 'environment',
      label: '呼叫铃',
      observation:
        '房门右侧的呼叫铃亮着微弱的光。上一次有人按它是什么时候？他一定知道这个东西——但他从来没按过。如果他摔倒了，他会按吗？',
      isKey: false,
      position: { top: '21%', left: '84%' },
      triggersReaction: false,
    },
    {
      id: 'li_clue_door',
      type: 'environment',
      label: '半掩的房门',
      observation:
        '房门是半开着的。他站在走廊里——明明可以退回去，却没有。他在等什么？等自己下定决心，还是在等一个可以光明正大走进去的理由。',
      isKey: false,
      position: { top: '40%', left: '72%' },
      triggersReaction: false,
    },
  ],

  // P0-A: 原 guessOptions 阈值已迁移
  requiredKeyCluesToUnderstand: 2,
  coreNeed: '他害怕在别人面前一瘸一拐——他不想丢脸，但心里有事想自己去完成。',
  elderOpenAction: '他把视线从窗外收回来，看着你。',

  interventionOptions: [
    {
      id: 'li_intervene_scold',
      label: '直接批评',
      actionText: '"李爷爷，您不参加康复怎么能恢复？这对您身体很不好。"',
      consequence: 'failure',
      feedback:
        '李爷爷沉默了很久。他走到床边坐下，把枕头往康复安排表上挪了挪——像是要把它藏得更深。"知道了。"他声音很低，但你听出了一种灰心。后面的巡房，他再也没主动跟你说过话。',
      recordTemplate: {
        surface: '09:20 检查李爷爷身体状况，无外伤。已提醒参加康复训练。',
        understanding:
          '09:20 他在走廊险些跌倒。我批评了他不参加康复的事，他沉默了。后来我看到枕头下的康复安排表——他不是不知道，是不敢去。我的话可能让他更难开口了。下次我不会先说"不对"，我会先问他"为什么"。',
      },
      outcomeFeedback: {
        insight0: '李爷爷沉默了很久。"知道了。"他的声音很低，但你听出了一种灰心。后面的巡房，他再也没主动跟你说过话。',
        insight1: '他沉默了。枕头下压着康复安排表——他不是不知道，是不敢去。但我先说了"不对"。',
        insight2: '他沉默了。我看到枕头下的康复安排表——他不是不知道，是不敢去。我的话可能让他更难开口了。下次我不会先说"不对"，我会先问他"为什么"。',
      },
      recordTemplates: {
        insight0: '09:20 检查李爷爷身体状况，无外伤。已提醒参加康复训练。',
        insight1: '09:20 他在走廊险些跌倒。我提醒了他参加康复训练，他沉默了。',
        insight2: '09:20 他在走廊险些跌倒。我批评了他不参加康复的事，他沉默了。后来我看到枕头下的康复安排表——他不是不知道，是不敢去。我的话可能让他更难开口了。下次我不会先说"不对"。',
      },
      // P1-A: 空间位置 — 走廊左侧（与 unifiedSceneData 对齐）
      spatialPosition: { top: '25%', left: '8%' },
      spatialSize: { width: '18%', height: '48%' },
      hoverThought: '"您不参加康复怎么能恢复？"',
    },
    {
      id: 'li_intervene_check_only',
      label: '只检查身体后离开',
      actionText: '你确认他没有外伤，告诉他注意安全，然后继续巡房。',
      consequence: 'partial',
      feedback:
        '李爷爷说"好"。你走了几步回头看，他又扶着墙往走廊尽头走了两步——然后又停下来，转过身，慢慢地回了房间。你完成了检查流程，但你知道有什么事你没问出来。',
      recordTemplate: {
        surface: '09:20 李爷爷走廊险些跌倒，检查无外伤，已返回房间。',
        understanding:
          '09:20 走廊滑了一下，无外伤。但我走的时候他又往走廊尽头走——那里有今天最好的光线。我隐约觉得他有什么事没告诉我。下次巡房我会多停留几分钟。有些事不是问出来的，是等出来的。',
      },
      outcomeFeedback: {
        insight0: '李爷爷说"好"。检查流程完成了，但你走了几步回头看，他又扶着墙往走廊尽头走了两步——然后停了下来。',
        insight1: '检查流程完成了。但你走的时候他又往走廊尽头走——那里有今天最好的光线。我隐约觉得他有什么事没告诉我。',
        insight2: '检查流程完成了。但我走的时候他又往走廊尽头走——那里有今天最好的光线。我隐约觉得他有什么事没告诉我。下次巡房我会多停留几分钟。有些事不是问出来的，是等出来的。',
      },
      recordTemplates: {
        insight0: '09:20 李爷爷走廊险些跌倒，检查无外伤，已返回房间。',
        insight1: '09:20 走廊滑了一下，无外伤。但我走的时候他又往走廊尽头走了。',
        insight2: '09:20 走廊滑了一下，无外伤。但我走的时候他又往走廊尽头走——那里有今天最好的光线。我隐约觉得他有什么事没告诉我。下次巡房我会多停留几分钟。',
      },
      // P1-A: 空间位置 — 走廊中段（与 unifiedSceneData 对齐）
      spatialPosition: { top: '12%', left: '25%' },
      spatialSize: { width: '18%', height: '68%' },
      hoverThought: '检查完就走……',
    },
    {
      id: 'li_intervene_respect',
      label: '尊重式引导',
      actionText:
        '"李爷爷，我先陪您在扶手边试几步。等会儿人少的时候，我们再继续。"',
      consequence: 'success',
      feedback:
        '李爷爷没有看你。他把头转向窗外，过了一会才开口："今天是她生日……我不想让别人看见我那样。"你把门虚掩上，站在扶手边——刚好留出一个他可以自己走的空间。"等会儿走廊安静下来，我陪您在扶手区域练几步。"他点了点头，很轻。然后他的手终于放在了扶手上。',
      recordTemplate: {
        surface: '09:20 李爷爷在走廊活动时重心不稳，检查无外伤。已陪同返回房间。已交接午班：建议下午人少时进行步行练习。',
        understanding:
          '09:20 李爷爷表示不愿在人多时进行康复训练。已改为人少时在扶手区域陪同练习，并交接注意步态不稳及走廊末端缺少扶手。床头摆放了一张旧照片——他今天似乎有格外在意的事。',
      },
      outcomeFeedback: {
        insight0: '李爷爷点了点头，手终于放在了扶手上。',
        insight1: '"今天是她生日……我不想让别人看见我那样。"你把门虚掩上，站在扶手边——刚好留出一个他可以自己走的空间。"等会儿走廊安静下来。"',
        insight2: '"今天是她生日……我不想让别人看见我那样。"你把门虚掩上，站在扶手边——刚好留出一个他可以自己走的空间。"等会儿走廊安静下来，我陪您在扶手区域练几步。"他点了点头，很轻。然后他的手终于放在了扶手上。',
      },
      recordTemplates: {
        insight0: '09:20 李爷爷在走廊活动时重心不稳，检查无外伤。已陪同返回房间。已交接午班：建议下午人少时进行步行练习。',
        insight1: '09:20 李爷爷表示不愿在人多时进行康复训练。已改为人少时在扶手区域陪同练习，并交接注意步态不稳。',
        insight2: '09:20 李爷爷表示不愿在人多时进行康复训练。已改为人少时在扶手区域陪同练习，并交接注意步态不稳及走廊末端缺少扶手。床头摆放了一张旧照片——他今天似乎有格外在意的事。',
      },
      // P1-A: 空间位置 — 扶手区域（与 unifiedSceneData 对齐）
      spatialPosition: { top: '35%', left: '19%' },
      spatialSize: { width: '13%', height: '25%' },
      hoverThought: '先陪他在扶手边试几步',
    },
  ],
};

// ============================================================
// 陈阿姨血糖复查（10:40）
// ============================================================

const EVENT_CHEN_GLUCOSE: CareEvent = {
  id: 'event_chen_glucose_1040',
  time: '10:40',
  location: '305 · 陈阿姨房间',
  elderId: 'chen',
  elderName: '陈阿姨',
  title: '血糖复查',
  introText:
    '血糖仪显示数值偏高——这是今天的复测。陈阿姨坐在床边，伸出手指配合检测，熟练得像做过一百次。"规矩我都懂，血糖高了就要复测。"她的语气很平静，但她的眼睛不在血糖仪上——她在看手机。',

  clues: [
    {
      id: 'chen_clue_record_book',
      type: 'object',
      label: '记录本与笔',
      observation:
        '血糖仪旁边放着一本手写小本子，字迹整齐——像备课本上的板书。最后一页记着今天的日期，旁边有一行备注。备注栏是空的，只在第一个格子里点了一个墨印。一支笔靠在本子旁边，笔帽上有好几道咬痕。你往前翻了几页——她之前的饮食记录都很规律，每餐都有标注。但昨晚那一行格外短，只写了"胃口不好，喝了碗汤"。',
      isKey: true,
      position: { top: '38%', left: '55%' },
      sceneItemId: 'glucose',
      triggersReaction: true,
    },
    {
      id: 'chen_clue_phone',
      type: 'action',
      label: '亮起又失望的手机',
      observation:
        '就在你测血糖的时候，她的手机屏幕亮了一下。她立刻转头去看——然后表情恢复了平静。她把手机轻轻翻过来，屏幕朝下放在床上。',
      isKey: true,
      position: { top: '52%', left: '60%' },
      sceneItemId: 'phone',
      triggersReaction: true,
      // P2-A: 如果曾发现李爷爷的相册 —— 两件事都关于等待
      requiresClueFromEvent: { eventId: 'event_li_call_0920', clueId: 'li_clue_room_photo' },
      migrationText: '李爷爷床头那本相册浮上心头——他也在想念一个人。陈阿姨的手机屏幕还暗着。养老院里，有些等待比走廊还长。',
    },
    {
      id: 'chen_clue_sweater',
      type: 'object',
      label: '织了一半的毛衣',
      observation:
        '床边搭着一件还没织完的毛衣。针脚细密，颜色是深蓝色。毛线团滚到了床底下，线还连着——像是织到一半被放下的。',
      isKey: false,
      position: { top: '48%', left: '28%' },
      sceneItemId: 'sweater',
      triggersReaction: true,
    },
    {
      id: 'chen_clue_hand',
      type: 'action',
      label: '靠近毛线的右手',
      observation:
        '她的手指停在毛线与手机之间，来回摩挲着毛衣边缘。不是在摸线头——是在等一个迟迟没有出现的消息。',
      isKey: false,
      position: { top: '48%', left: '61%' },
      sceneItemId: 'elder_hand',
      triggersReaction: true,
    },
    {
      id: 'chen_clue_medicine_box',
      type: 'object',
      label: '分格药盒',
      observation:
        '床头柜上有一个分格药盒，每天一格。今天的格子是空的——但昨天的格子里还有两粒。药盒盖子没盖紧，像是最后一次取药之后没有关好。',
      isKey: true,
      position: { top: '30%', left: '18%' },
      sceneItemId: 'medicine_box',
      triggersReaction: true,
      // P2-A: 如果曾发现王奶奶的药瓶
      requiresClueFromEvent: { eventId: 'event_wang_meal_0810', clueId: 'wang_clue_medicine' },
      migrationText: '王奶奶的药瓶还开着。这里的分格药盒也关不紧。你今天看到的药，不是在桌上就是在盒里——但都没被吃进去。',
    },
    {
      id: 'chen_clue_fruit',
      type: 'object',
      label: '桌上的水果',
      observation:
        '桌上放着一个苹果，表皮有些发皱。旁边是一张超市小票，最上面一行是今天的日期。小票上的东西不多——几样低糖食品，没有别的。',
      isKey: false,
      position: { top: '55%', left: '68%' },
      sceneItemId: 'fruit',
      triggersReaction: true,
    },

    {
      id: 'chen_clue_glucose_meter',
      type: 'object',
      label: '血糖仪',
      observation:
        '血糖仪放在桌上，屏幕还亮着上午空腹的记录。数字比正常值高了一截——昨晚几乎没吃东西，药也没按时吃，空腹血糖反而因为身体应激升上去了。',
      isKey: true,
      position: { top: '57%', left: '22%' },
      sceneItemId: 'glucose',
      triggersReaction: true,
    },
    {
      id: 'chen_clue_test_strips',
      type: 'object',
      label: '散放的试纸',
      observation:
        '几片血糖试纸散落在血糖仪旁边。用完的、还没收的——不是做事马虎的人会留下的痕迹。她只是今天不想收。',
      isKey: false,
      position: { top: '63%', left: '34%' },
      triggersReaction: true,
    },
    {
      id: 'chen_clue_calendar',
      type: 'environment',
      label: '圈日期的日历',
      observation:
        '墙面日历上，今天的日期被圈了起来。旁边有一行小字，像是家庭医生复诊的提醒——也可能不是。总之，今天对她很重要。',
      isKey: false,
      position: { top: '18%', left: '32%' },
      sceneItemId: 'calendar',
      triggersReaction: false,
    },
    {
      id: 'chen_clue_medicine_bottle',
      type: 'object',
      label: '桌面小药瓶',
      observation:
        '桌上还有一个小药瓶，标签朝向血糖仪。她每天早上都要看这个——但今天只是看了一眼，没有打开。',
      isKey: false,
      position: { top: '53%', left: '29%' },
      sceneItemId: 'medicine_box',
      triggersReaction: true,
    },
    {
      id: 'chen_clue_door',
      type: 'environment',
      label: '左侧房门',
      observation:
        '房门是关着的。她的房间很少关门。今天这一个动作——关门——不是不想见人，是不想让别人看到她今天的状态。',
      isKey: false,
      position: { top: '35%', left: '18%' },
      triggersReaction: false,
    },
    {
      id: 'chen_clue_family_photo',
      type: 'object',
      label: '柜面全家福',
      observation:
        '柜面上放着一张全家福。照片里的三个人——她、丈夫和一个十几岁的男孩——在一棵梧桐树下面。照片的玻璃擦得很干净。她每天都会擦。',
      isKey: false,
      position: { top: '20%', left: '29%' },
      sceneItemId: 'photo_frame',
      triggersReaction: true,
    },
  ],

  // P0-A: 原 guessOptions 阈值已迁移
  requiredKeyCluesToUnderstand: 2,
  coreNeed: '她刻意改变饮食想让家人放心——血糖数字不是健康问题，是她想让儿子看到的"我很好"。',
  elderOpenAction: '她把手机翻过来，屏幕朝上。',

  interventionOptions: [
    {
      id: 'chen_intervene_rules_only',
      label: '只提醒规则',
      actionText: '"血糖高就不能乱吃。您得按规矩来，不然身体会出问题。"',
      consequence: 'failure',
      feedback:
        '陈阿姨点了点头："我知道的。"她的声音很平静，但你看到她拿起手机翻了一下——还是没有新消息。她把毛衣往旁边推了推，没有再织的意思。她说"知道了"，但你知道她还在等。',
      recordTemplate: {
        surface: '10:40 血糖复查，已提醒饮食管理。',
        understanding:
          '10:40 复测血糖偏高。我提醒了规则，她说了"知道"。但我看到她手机——没有新消息。那件毛衣还搭在床边。有些"知道"是一个结束，有些是一个开始。今天我的"提醒"是前者。',
      },
      outcomeFeedback: {
        insight0: '陈阿姨点了点头："我知道的。"她拿起手机翻了一下——还是没有新消息。她把毛衣往旁边推了推，没有再织的意思。',
        insight1: '她说了"知道"。但我看到她手机——没有新消息。那件毛衣还搭在床边。我说了规则，但她需要的不是规则。',
        insight2: '她说了"知道"。但我看到她手机——没有新消息。那件毛衣还搭在床边。有些"知道"是一个结束，有些是一个开始。今天我的"提醒"是前者。',
      },
      recordTemplates: {
        insight0: '10:40 血糖复查，已提醒饮食管理。',
        insight1: '10:40 复测血糖偏高。我提醒了规则，她说了"知道"。但她手机没有新消息，毛衣还搭在床边。',
        insight2: '10:40 复测血糖偏高。我提醒了规则，她说了"知道"。但我看到她手机——没有新消息。那件毛衣还搭在床边。有些"知道"是一个结束，有些是一个开始。今天我的"提醒"是前者。',
      },
      // P1-A: 空间位置 — 左侧房门方向（与 unifiedSceneData 对齐）
      spatialPosition: { top: '20%', left: '2%' },
      spatialSize: { width: '14%', height: '54%' },
      hoverThought: '提醒规则就够了',
    },
    {
      id: 'chen_intervene_retest_only',
      label: '只做复测',
      actionText: '你按照流程完成复测和记录，没有多说什么。',
      consequence: 'partial',
      feedback:
        '复测完成，数据记录在案。但你的交接记录上只留下了数字。你走的时候，陈阿姨拿起毛衣又放下，拿起手机又放下——她的问题不在血糖仪里。你做了该做的事，但你知道有什么事没做完。',
      recordTemplate: {
        surface: '10:40 血糖复测完成，已通知护士。',
        understanding:
          '10:40 血糖仍偏高。本子上记着她昨晚刻意少吃了——儿子说要来。复测做完了，数字也记了。但她的"高"不只是在血液里——也在那个没响的电话和织了一半的毛衣里。下次我会多坐一会。',
      },
      outcomeFeedback: {
        insight0: '复测完成，数据记录在案。你做了该做的事。',
        insight1: '复测完成了。交接记录上只留下了数字。她拿起毛衣又放下——她的问题不在血糖仪里。',
        insight2: '本子上记着她昨晚刻意少吃了——儿子说要来。复测做完了，数字也记了。但她的"高"不只是在血液里——也在那个没响的电话和织了一半的毛衣里。下次我会多坐一会。',
      },
      recordTemplates: {
        insight0: '10:40 血糖复测完成，已通知护士。',
        insight1: '10:40 血糖仍偏高。本子上记着她昨晚刻意少吃了。复测做完了，数字也记了。但她的问题不在血糖仪里。',
        insight2: '10:40 血糖仍偏高。本子上记着她昨晚刻意少吃了——儿子说要来。复测做完了，数字也记了。但她的"高"不只是在血液里——也在那个没响的电话和织了一半的毛衣里。下次我会多坐一会。',
      },
      // P1-A: 空间位置 — 血糖仪区域（与 unifiedSceneData 对齐）
      spatialPosition: { top: '66%', left: '25%' },
      spatialSize: { width: '16%', height: '25%' },
      hoverThought: '做完复测就走',
    },
    {
      id: 'chen_intervene_emotion',
      label: '情绪与护理结合',
      actionText:
        '"我先帮您把数据记好，也给您拿一份低糖水果。等会儿如果电话来了，您可以告诉他今天吃得很稳。"',
      consequence: 'success',
      feedback:
        '陈阿姨愣了一下。她低头看了看血糖本，又抬头看着你。"你看到了？"她问——声音没有刚才那么平稳了。你从餐厅拿了一份低糖水果放在她桌上，告诉她不算热量。她拿起毛衣，织了两针，又停下来。但这一次，她把毛衣放在腿上——没有推开。',
      recordTemplate: {
        surface: '10:40 血糖复测完成，已提供低糖饮食建议。',
        understanding:
          '10:40 血糖偏高。本子上记着昨晚刻意少吃——儿子说要来。对她来说，血糖数字不只是健康指标，是给儿子看的"我很好"。我从餐厅拿了低糖水果放她桌上，告诉她不算热量。她问了一句"你看到了"——我看到了。有些数字背后是没有说出口的等待。慢病管理不能只看血糖。',
      },
      outcomeFeedback: {
        insight0: '陈阿姨愣了一下。"你看到了？"她问。你从餐厅拿了一份低糖水果放在她桌上。她拿起毛衣，织了两针——没有推开。',
        insight1: '"你看到了？"她问——声音没有刚才那么平稳了。你从餐厅拿了一份低糖水果放在她桌上，告诉她不算热量。她拿起毛衣，织了两针，又停下来。但这一次——没有推开。',
        insight2: '陈阿姨愣了一下。"你看到了？"她问——声音没有刚才那么平稳了。你从餐厅拿了一份低糖水果放在她桌上，告诉她不算热量。她拿起毛衣，织了两针，又停下来。但这一次，她把毛衣放在腿上——没有推开。',
      },
      recordTemplates: {
        insight0: '10:40 血糖复测完成，已提供低糖饮食建议。',
        insight1: '10:40 血糖偏高。本子上记着昨晚刻意少吃——儿子说要来。我从餐厅拿了低糖水果放她桌上，告诉她不算热量。她问了一句"你看到了"。',
        insight2: '10:40 血糖偏高。本子上记着昨晚刻意少吃——儿子说要来。对她来说，血糖数字不只是健康指标，是给儿子看的"我很好"。我从餐厅拿了低糖水果放她桌上，告诉她不算热量。她问了一句"你看到了"——我看到了。有些数字背后是没有说出口的等待。慢病管理不能只看血糖。',
      },
      // P1-A: 空间位置 — 毛衣/手机区域（与 unifiedSceneData 对齐）
      spatialPosition: { top: '57%', left: '55%' },
      spatialSize: { width: '27%', height: '32%' },
      hoverThought: '先坐下来……',
    },
  ],
};

// ============================================================
// 事件列表（按时间线排列）
// ============================================================

/** 所有事件按班次时间线顺序排列 */
export const CHAPTER2_EVENTS: CareEvent[] = [
  EVENT_WANG_MEAL,
  EVENT_LI_CALL,
  EVENT_CHEN_GLUCOSE,
];

/** 空闲槽位常量（汇总用） */
export const CHAPTER2_EVENT_COUNT = CHAPTER2_EVENTS.length;

// ============================================================
// 工具函数
// ============================================================

/** 根据事件ID获取事件配置 */
export function getEventById(eventId: string): CareEvent | undefined {
  return CHAPTER2_EVENTS.find((e) => e.id === eventId);
}

/**
 * @deprecated Batch 7: 已被 resolveInsightLevel 替代，零引用。
 * 使用 recordedClueIds 而非 discoveredClueIds 计算理解等级。
 */
export function hasEnoughKeyClues(
  recordIds: string[],
  event: CareEvent,
  required: number,
): boolean {
  const keyClueIds = event.clues.filter((c) => c.isKey).map((c) => c.id);
  const found = recordIds.filter((id) => keyClueIds.includes(id));
  return found.length >= required;
}

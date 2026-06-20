/* === 老人篇结局 CG 判定配置（v6.4 多结局版） ===
 *
 * v6.4 架构变更：
 * - 从"单一结局"改为"主结局 + 次级结局印记"双层判定
 * - evaluateEndingCandidates(): 评估全部14个结局，返回候选列表
 * - resolveEndingSet(): 选择主结局 + 最多3个次级印记
 * - 叙事分组: crisis/regret/family/care/health/routine/memory/nature/summary/quiet
 * - 硬互斥规则 + 软共存规则
 * - 次级印记短文本
 */

import type { ElderGameState, EndingCandidate, ElderEndingResult, EndingCategory } from '../types';

/** 结局 CG 键 */
export type EndingCgKey =
  | 'family_visit_ending_cg'
  | 'caregiver_companion_ending_cg'
  | 'sunset_garden_ending_cg'
  | 'warm_ending_cg'
  | 'long_ending_cg'
  | 'quiet_ending_cg'
  | 'fainting_rescue_ending_cg'
  | 'lost_and_found_ending_cg'
  | 'phone_unanswered_ending_cg'
  | 'caregiver_escort_ending_cg'
  | 'health_recovery_ending_cg'
  | 'regular_meal_ending_cg'
  | 'album_memories_ending_cg'
  | 'morning_after_quiet_ending_cg';

export interface EndingDisplay {
  cgKey: EndingCgKey;
  title: string;
  subtitle: string;
  message: string;
}

/** 最大次级印记数 */
const MAX_SECONDARY = 3;

/** 硬互斥: 主结局A命中时B不能作为次级 */
const HARD_CONFLICTS: Partial<Record<EndingCgKey, EndingCgKey[]>> = {
  warm_ending_cg: ['phone_unanswered_ending_cg', 'fainting_rescue_ending_cg', 'lost_and_found_ending_cg'],
  quiet_ending_cg: ['family_visit_ending_cg', 'caregiver_escort_ending_cg', 'caregiver_companion_ending_cg',
    'sunset_garden_ending_cg', 'warm_ending_cg', 'health_recovery_ending_cg', 'regular_meal_ending_cg',
    'album_memories_ending_cg', 'fainting_rescue_ending_cg', 'lost_and_found_ending_cg',
    'phone_unanswered_ending_cg', 'morning_after_quiet_ending_cg'],
  morning_after_quiet_ending_cg: [/* 仅无候选时兜底，有主结局就不显示 */],
};

/** 负向结局 */
const NEGATIVE_ENDINGS: EndingCgKey[] = [
  'fainting_rescue_ending_cg', 'lost_and_found_ending_cg',
  'phone_unanswered_ending_cg', 'long_ending_cg',
];

// ══════════════════════════════
// 结局展示文本
// ══════════════════════════════

const ENDING_DISPLAYS: Record<EndingCgKey, Omit<EndingDisplay, 'cgKey'> & {
  secondaryTitle?: string;
  secondarySubtitle?: string;
  secondaryBody?: string;
}> = {
  fainting_rescue_ending_cg: {
    title: '被及时接住',
    subtitle: '在最需要的时候，有人伸手扶住了你。',
    message: '今天你的身体发出了很清楚的求救信号。饥饿、发虚、站不稳，这些不是小事。好在护工及时发现，端来温热的粥，护士也赶来检查。衰老有时不是突然倒下，而是一次饭没吃、一次水没喝、一次呼叫没被听见，慢慢累积成危险。被及时接住，本身就是照护的意义。',
    secondaryTitle: '身体发出了信号',
    secondarySubtitle: '饥饿不是忍一忍就能过去的事。',
    secondaryBody: '今天你的身体一度发出了求救——饥饿、发虚、站不稳。护工赶来了，粥端来了。被及时接住，已是最重要的照护。',
  },
  lost_and_found_ending_cg: {
    title: '走廊尽头的灯',
    subtitle: '迷路的时候，总有一盏灯为你亮在最熟悉的走廊尽头。',
    message: '今天你在走廊里迷了好几次路。房间号、扶手、墙上的画，明明都见过，却忽然变得陌生。你站在原地，不知道该往哪边走。好在灯亮了起来，有人叫你的名字，慢慢把你带回房间。记忆会模糊，方向感会减弱，但被及时发现，才让这条走廊重新变得安全。',
    secondaryTitle: '在走廊里迷失了几步',
    secondarySubtitle: '方向感会减弱，但有人带路就还是能回家。',
    secondaryBody: '今天你在走廊里停了一会儿，分不清哪个门是自己的。护工走过来，轻轻带你回去了。迷失不是终点，被找到才是。',
  },
  phone_unanswered_ending_cg: {
    title: '没接通的电话',
    subtitle: '等了一天的电话，最终只有忙音。',
    message: '你今天等过电话，也拨过电话。铃声响过，忙音也响过，可真正说上话的时间没有到来。电话旁的照片还亮着，里面的人笑得很近，可今天的声音很远。很多时候，老人缺的不是一句隆重的承诺，而是一次能被及时接起的普通问候。',
    secondaryTitle: '错过的一通电话',
    secondarySubtitle: '有些铃声，只差几步就能接到。',
    secondaryBody: '今天你也错过了一通电话。铃声停下的时候，电话角又安静了下来。幸好这一天并不只有错过，但那几声铃声，还是留在了心里。',
  },
  family_visit_ending_cg: {
    title: '亲情的温度',
    subtitle: '家人的牵挂，是养老院里最暖的光。',
    message: '今天你不只是拨出了电话，也真的听见了回应。那头问你吃饭没有，问你睡得好不好，都是再普通不过的话。可对住在养老院里的人来说，被这样问起，就像房间里的灯亮了一会儿。距离没有消失，但至少今天，你不是一个人把话说完。',
    secondaryTitle: '亲情的温度',
    secondarySubtitle: '今天有一次真正的联系。',
    secondaryBody: '电话那头传来了熟悉的声音。问了吃饭、问了睡觉——都是最普通的话，却让房间亮了一会儿。',
  },
  caregiver_escort_ending_cg: {
    title: '有人陪着走',
    subtitle: '这一次，不必一个人慢慢走过走廊。',
    message: '今天你按了呼叫铃，有人来了。护工陪你慢慢穿过走廊，走到花园，也走到活动室。你走得不快，对方也没有催。被照护不是失去自由，而是有人愿意用你的速度陪你走。那条长长的走廊，今天好像没那么长了。',
    secondaryTitle: '有人陪着走了一段',
    secondarySubtitle: '被照护不是失去自由，而是有人用你的速度陪你。',
    secondaryBody: '今天护工陪着你走了一段路。你没有说太多话，但有人走在旁边，走廊就没那么长了。',
  },
  caregiver_companion_ending_cg: {
    title: '守护者的陪伴',
    subtitle: '有人记得你的习惯，也愿意听你慢慢说。',
    message: '按时吃药、等护工帮忙、接受送来的饭——这些看似琐碎的事，却是养老院里最真实的日常。护工们忙得脚不沾地，但他们记得你的药、你的习惯、你的脾气。照护不是一句温暖的话，而是一次次按时出现。',
    secondaryTitle: '日常的照护',
    secondarySubtitle: '每一次按时出现在你身边的人，都是守护。',
    secondaryBody: '吃药、量血压、聊了几句——护工今天来过的次数，你都记得。照护不是什么大事，而是一次次小小的出现。',
  },
  health_recovery_ending_cg: {
    title: '慢慢好起来',
    subtitle: '每一步都很慢，但每一步都算数。',
    message: '今天你扶着复健杆，慢慢练了几步。膝盖有点僵，手心也出了汗，但你没有停下。护士在旁边轻轻扶着你，等你站稳了，才笑着点点头。老了以后，进步不是跑得多快——能多走一步，能自己站起来，就是胜利。',
    secondaryTitle: '为身体做了一些事',
    secondarySubtitle: '复健、吃药、测血压——每一件都算数。',
    secondaryBody: '今天你为身体做了几件事。虽然慢，但做完了。医生点点头，你也在心里点了点头。',
  },
  regular_meal_ending_cg: {
    title: '三餐有暖',
    subtitle: '按时吃下的每一餐，都是对自己的照顾。',
    message: '今天你没有错过饭点。热粥、米饭、汤和软烂的菜，一样一样摆到面前。护工把汤碗往你手边推了推，旁边的人也给你留了位置。饭菜不一定丰盛，但它们把一天稳稳托住了。好好吃饭，本身就是一种力量。',
    secondaryTitle: '今天吃的几顿饭',
    secondarySubtitle: '饭菜把日子稳稳托住了。',
    secondaryBody: '今天的饭菜热了又热，但你至少坐下来吃了几顿。碗筷的声音、热汤的白气，让这一天有了着落。',
  },
  sunset_garden_ending_cg: {
    title: '暮色花园',
    subtitle: '夕阳下的散步，是最安静的陪伴。',
    message: '你在花园里慢慢走了一圈。桂花树下的影子被夕阳拉得很长，月季在花坛边静静开着。老了以后，脚步慢了，反而能看清从前匆匆错过的东西。风从亭子那边吹过来，带着一点花香，一切都安静得刚刚好。',
    secondaryTitle: '花园里的片刻',
    secondarySubtitle: '花开了，你看着它们，自己也安静了下来。',
    secondaryBody: '今天你在花园里待了一会儿。风吹过来，桂花还没全开，但月季开得正好。安静本身就是一种陪伴。',
  },
  album_memories_ending_cg: {
    title: '满册旧时光',
    subtitle: '今天你翻到相册深处，那些旧时光又亮了起来。',
    message: '今天你把相册翻了很久。婚照、车票、同学、孩子小时候的脸，一页一页从塑料膜下面亮起来。那些人和事都没有真正回来，但它们证明你曾经认真地生活过。回忆不是逃回过去，而是在提醒后来的人：眼前这位老人，也曾有过很长、很热烈的一生。',
    secondaryTitle: '翻过的几页相册',
    secondarySubtitle: '照片里的人都在，旧时光亮了一会儿。',
    secondaryBody: '相册翻过几页，塑料膜轻轻响着。照片里的人都还年轻，而你看着他们，目光比任何时候都温柔。',
  },
  warm_ending_cg: {
    title: '温暖的一天',
    subtitle: '你度过了充实而温柔的一天。',
    message: '今天的阳光很好，电话那头也传来了熟悉的笑声。花园、饭菜、相册、问候——这些寻常的小事拼在一起，像岁月拼图里最亮的几块。每一个普通日子，都值得被认真对待。',
  },
  long_ending_cg: {
    title: '漫长的一天',
    subtitle: '这一天有些漫长。',
    message: '这一天过得很慢。有些事情没能赶上，有些话没能说出口，电话没有等来，走廊比早晨更长。你并不是没有努力，只是有些事，一个人很难撑过去。老人需要的不只是安全的床位，也需要被提醒、被回应、被看见。也许明天，只要有人多问一句，这一天就会不同。',
    secondaryTitle: '慢下来的片段',
    secondarySubtitle: '有些事没能赶上，但这一天你一直在。',
    secondaryBody: '这一天有些片段过得特别慢。走廊比早晨长，等待比下午久。你一直在那里，这本身就值得被看见。',
  },
  morning_after_quiet_ending_cg: {
    title: '清晨仍会到来',
    subtitle: '普通的一天，也会在晨光里安稳落下。',
    message: '没有特别热闹，也没有特别难过。被子叠好，相册合上，水杯放在桌边，生活还会慢慢继续。吃饭、吃药、散步、休息，这些平平常常的事，就是一天的骨架。不是每一天都会被记住，但每一天都在真实地消耗一个人的力气。清晨还会到来，只是希望明天有人来得更早一点。',
  },
  quiet_ending_cg: {
    title: '安静的一天',
    subtitle: '普通但踏实的一天结束了。',
    message: '生活就是这样的——吃饭、吃药、散步、休息。没有惊天动地的事，但每一步都是真实的。不是每一天都闪闪发光，但这些安静的日子，同样是生命的一部分。',
  },
};

// ══════════════════════════════
// 辅助函数
// ══════════════════════════════

function healthManagementCount(state: ElderGameState): number {
  return ['take_medicine', 'morning_rehab', 'measure_bp', 'exercise_bike']
    .filter(id => state.completedActions.includes(id)).length;
}

/** v6.6: 计算未接遗憾分（视频未接权重低于电话未接） */
function getMissedContactScore(state: ElderGameState): number {
  const ps = state.phoneStats;
  return (
    (ps?.unanswered ?? 0) * 1.0 +
    (ps?.incomingMissed ?? 0) * 1.25 +
    (ps?.videoUnanswered ?? 0) * 0.6 +
    (ps?.videoFailedBySignal ?? 0) * 0.3
  );
}

/** v6.6: 是否已有成功亲情联系（电话/来电/视频至少一次成功） */
function hasRecoveredContact(state: ElderGameState): boolean {
  const ps = state.phoneStats;
  return (
    (ps?.answered ?? 0) > 0 ||
    (ps?.incomingAnswered ?? 0) > 0 ||
    (ps?.videoAnswered ?? 0) > 0 ||
    (ps?.meaningfulContacts ?? 0) > 0
  );
}

/** v6.6: 护工照护分（含 video 帮助） */
function getCaregiverCareScore(state: ElderGameState): number {
  return (
    (state.caregiverStats?.mealInvitationsAccepted ?? 0) * 1.0 +
    (state.caregiverStats?.bellCalls ?? 0) * 0.5 +
    (state.caregiverStats?.escorts ?? 0) * 1.5 +
    (state.caregiverStats?.comfortTalks ?? 0) * 1.0 +
    (state.caregiverStats?.healthChecks ?? 0) * 1.5 +
    (state.caregiverStats?.emergencyFeeds ?? 0) * 1.5 +
    (state.caregiverStats?.helpedVideoCall ?? 0) * 1.0 +
    (state.completedActions.includes('take_medicine') ? 1 : 0) +
    (state.completedActions.includes('morning_rehab') ? 1 : 0) +
    (state.completedActions.includes('caregiver_meal') ? 1.5 : 0)
  );
}

/** v6.6: 亲情证据（含视频成功） */
function hasFamilyEvidence(state: ElderGameState): boolean {
  const ps = state.phoneStats;
  const fragments = state.collectedFragments;
  return (
    (ps?.answered ?? 0) > 0 ||
    (ps?.incomingAnswered ?? 0) > 0 ||
    (ps?.videoAnswered ?? 0) > 0 ||
    state.completedActions.includes('answer_incoming_call') ||
    state.triggeredRandomEvents.includes('family_calls_room_bell') ||
    fragments.includes('memory_phone_call') ||
    fragments.includes('memory_family_visit') ||
    fragments.includes('memory_home_reunion_scene')
  );
}

/** v6.6: 是否曾尝试联系家人 */
function hasAttemptedContact(state: ElderGameState): boolean {
  const ps = state.phoneStats;
  return (
    (ps?.callsMade ?? 0) > 0 ||
    (ps?.incoming ?? 0) > 0 ||
    (ps?.videoCallsMade ?? 0) > 0
  );
}

function makeCandidate(
  cgKey: EndingCgKey,
  category: EndingCategory,
  mainPriority: number,
  secondaryPriority: number,
  mainEligible: boolean,
  secondaryEligible: boolean,
  score: number,
  evidence: string[],
  conflictsWith?: string[],
): EndingCandidate {
  const display = ENDING_DISPLAYS[cgKey];
  return {
    cgKey, category, mainPriority, secondaryPriority,
    mainEligible, secondaryEligible, score, evidence,
    title: display.title,
    subtitle: display.subtitle,
    body: display.message,
    secondaryTitle: display.secondaryTitle || display.title,
    secondarySubtitle: display.secondarySubtitle || display.subtitle,
    secondaryBody: display.secondaryBody || display.message,
    conflictsWith,
  };
}

// ══════════════════════════════
// 14 个结局评估函数
// ══════════════════════════════

function evaluateFaintingRescue(state: ElderGameState): EndingCandidate | null {
  const s = state.status;
  // v6.6: 主结局只由真危机触发（饿晕/强制喂饭/营养液/健康跌到危险）
  const isCrisis =
    state.completedActions.includes('force_feed') ||
    state.completedActions.includes('iv_nutrition') ||
    (state.maxHungerReached ?? s.hunger) >= 95 ||
    (state.minHealthReached ?? s.health) <= 25;

  // emergencyFeeds>0 只作为子CG，不直接触发主结局
  const isSevere =
    (state.caregiverStats?.emergencyFeeds ?? 0) > 0 ||
    (state.maxHungerReached ?? s.hunger) >= 85 ||
    state.missedMeals >= 2;

  const evidence: string[] = [];
  if ((state.maxHungerReached ?? s.hunger) >= 95) evidence.push('饥饿达到危险水平');
  if (state.completedActions.includes('force_feed')) evidence.push('接受了紧急喂饭');
  if (state.completedActions.includes('iv_nutrition')) evidence.push('打了营养液');
  if ((state.minHealthReached ?? s.health) <= 25) evidence.push('健康跌至极低');
  if ((state.caregiverStats?.emergencyFeeds ?? 0) > 0) evidence.push('护工紧急送食');

  return makeCandidate('fainting_rescue_ending_cg', 'crisis', 1000, 900,
    isCrisis, isSevere,
    isCrisis ? 100 : (isSevere ? 60 : 0),
    evidence,
  );
}

function evaluateLostAndFound(state: ElderGameState): EndingCandidate | null {
  const ds = state.disorientationStats;
  // v6.6: 加权严重度 = 系统迷路×2 + 走错房间×2 + 被找回×1.5 + min(主动点击,2)
  const disorientationSeverity =
    (ds?.randomLostCount ?? 0) * 2 +
    (ds?.wrongRoomCount ?? 0) * 2 +
    (ds?.helpedBackCount ?? 0) * 1.5 +
    Math.min(ds?.getLostActionCount ?? 0, 2);

  const isSevere =
    disorientationSeverity >= 4 &&
    ((state.maxLonelinessReached ?? state.status.loneliness) >= 60 ||
     (state.minMoodReached ?? state.status.mood) <= 45 ||
     (ds?.helpedBackCount ?? 0) >= 1);

  const isMild = disorientationSeverity >= 2;

  return makeCandidate('lost_and_found_ending_cg', 'crisis', 950, 850,
    isSevere, isMild,
    isSevere ? 9 : (isMild ? 5 : 0),
    disorientationSeverity >= 1 ? [`迷路严重度 ${disorientationSeverity}（主动${ds?.getLostActionCount ?? 0}/随机${ds?.randomLostCount ?? 0}/走错${ds?.wrongRoomCount ?? 0}/找回${ds?.helpedBackCount ?? 0}）`] : [],
  );
}

function evaluatePhoneUnanswered(state: ElderGameState): EndingCandidate | null {
  const missedScore = getMissedContactScore(state);

  // v6.6: 主结局 = 遗憾分≥2.2 且无成功联系、无修复、孤独≥60
  const isSevere =
    missedScore >= 2.2 &&
    !hasRecoveredContact(state) &&
    (state.maxLonelinessReached ?? state.status.loneliness) >= 60;

  // 子CG = 遗憾分≥1 且无修复
  const isMild = missedScore >= 1 && !hasRecoveredContact(state);

  const evidence: string[] = [];
  if ((state.phoneStats?.unanswered ?? 0) >= 1) evidence.push(`电话未接通 ${state.phoneStats?.unanswered} 次`);
  if ((state.phoneStats?.incomingMissed ?? 0) >= 1) evidence.push(`错过来电 ${state.phoneStats?.incomingMissed} 次`);
  if ((state.phoneStats?.videoUnanswered ?? 0) >= 1) evidence.push(`视频未接通 ${state.phoneStats?.videoUnanswered} 次`);
  if ((state.phoneStats?.videoFailedBySignal ?? 0) >= 1) evidence.push(`视频信号失败 ${state.phoneStats?.videoFailedBySignal} 次`);

  return makeCandidate('phone_unanswered_ending_cg', 'regret', 900, 820,
    isSevere, isMild,
    isSevere ? 8 : (isMild ? 4 : 0),
    evidence,
  );
}

function evaluateFamilyVisit(state: ElderGameState): EndingCandidate | null {
  const ps = state.phoneStats;
  const meaningfulContacts = ps?.meaningfulContacts ?? 0;
  const missedScore = getMissedContactScore(state);

  // v6.6: 主结局 = meaningfulContacts≥1 + 亲情证据 + 无未修复错过 + 心情/孤独阈值
  const isSevere =
    meaningfulContacts >= 1 &&
    hasFamilyEvidence(state) &&
    !(missedScore >= 2 && !hasRecoveredContact(state)) &&  // 未修复错过
    (state.minMoodReached ?? state.status.mood) > 35 &&
    (state.maxLonelinessReached ?? state.status.loneliness) < 75;

  const isMild = meaningfulContacts >= 1 || hasFamilyEvidence(state);

  const evidence: string[] = [];
  if (meaningfulContacts >= 1) evidence.push('有真实的亲情回应');
  if ((ps?.videoAnswered ?? 0) > 0) evidence.push('视频通话成功');

  return makeCandidate('family_visit_ending_cg', 'family', 780, 760,
    isSevere, isMild,
    isSevere ? 75 : (isMild ? 65 : 0),
    isMild ? evidence : [],
  );
}

function evaluateCaregiverEscort(state: ElderGameState): EndingCandidate | null {
  const requested = state.caregiverStats?.escortsByReason?.requestedActivity ?? 0;
  // v6.6: 只统计主动请求陪同外出，不含危机转运
  const isSevere =
    (
      requested >= 2 ||
      (requested >= 1 &&
        state.visitedLocations.some(id => ['garden', 'activity', 'clinic'].includes(id)) &&
        (state.maxLonelinessReached ?? state.status.loneliness) <= 65 &&
        (state.minMoodReached ?? state.status.mood) > 35)
    ) &&
    (state.maxHungerReached ?? state.status.hunger) < 95 &&
    (state.minHealthReached ?? state.status.health) > 25;

  return makeCandidate('caregiver_escort_ending_cg', 'care', 740, 700,
    isSevere, requested >= 1,
    isSevere ? 7 : (requested >= 1 ? 5 : 0),
    requested >= 1 ? [`主动请求护工陪同 ${requested} 次`] : [],
  );
}

function evaluateCaregiverCompanion(state: ElderGameState): EndingCandidate | null {
  const score = getCaregiverCareScore(state);
  const isSevere =
    score >= 4 &&
    (state.caregiverStats?.emergencyFeeds ?? 0) === 0 &&
    (state.minHealthReached ?? state.status.health) > 30;

  return makeCandidate('caregiver_companion_ending_cg', 'care', 700, 680,
    isSevere, score >= 3,
    score,
    score >= 3 ? [`综合照护分 ${score}`] : [],
  );
}

function evaluateHealthRecovery(state: ElderGameState): EndingCandidate | null {
  const hc = healthManagementCount(state);
  // v6.6: 健康改善幅度
  const healthDelta = state.status.health - (state.initialStatus?.health ?? 70);
  const isSevere =
    hc >= 3 &&
    (state.status.health >= 70 || healthDelta >= 12) &&
    (state.maxHungerReached ?? state.status.hunger) < 90;

  return makeCandidate('health_recovery_ending_cg', 'health', 660, 620,
    isSevere, hc >= 2,
    isSevere ? 65 : (hc >= 2 ? 4 : 0),
    hc >= 2 ? [`健康管理 ${hc} 次${healthDelta >= 12 ? '（健康改善 +' + healthDelta + '）' : ''}`] : [],
  );
}

function evaluateRegularMeal(state: ElderGameState): EndingCandidate | null {
  const mealsEaten = Object.values(state.eatenMeals ?? {}).filter(Boolean).length;
  // v6.6: 主结局=三餐全吃+无错过+饥饿<75+无紧急喂食
  const isSevere =
    state.eatenMeals?.breakfast &&
    state.eatenMeals?.lunch &&
    state.eatenMeals?.dinner &&
    state.missedMeals === 0 &&
    (state.maxHungerReached ?? state.status.hunger) < 75 &&
    (state.caregiverStats?.emergencyFeeds ?? 0) === 0;

  // 子CG: 至少两餐规律
  const isMild =
    mealsEaten >= 2 &&
    state.missedMeals <= 1 &&
    (state.maxHungerReached ?? state.status.hunger) < 85;

  return makeCandidate('regular_meal_ending_cg', 'routine', 620, 600,
    isSevere, isMild,
    isSevere ? 6 : (isMild ? 4 : 0),
    isMild ? [`吃了 ${mealsEaten} 餐`] : [],
  );
}

function evaluateSunsetGarden(state: ElderGameState): EndingCandidate | null {
  const missedScore = getMissedContactScore(state);
  const meaningfulContacts = state.phoneStats?.meaningfulContacts ?? 0;

  // v6.6: 主结局应强调傍晚线：看夕阳 或 傍晚花园散步+桂花碎片
  const eveningGarden =
    state.completedActions.includes('watch_sunset') ||
    (state.completedActions.includes('garden_walk') &&
     state.collectedFragments.includes('memory_osmanthus'));

  const isSevere =
    eveningGarden &&
    (state.maxHungerReached ?? state.status.hunger) < 90 &&
    (state.minHealthReached ?? state.status.health) > 30 &&
    !(meaningfulContacts === 0 && missedScore >= 2);

  const isMild =
    state.completedActions.includes('watch_sunset') ||
    state.completedActions.includes('garden_walk') ||
    state.collectedFragments.includes('memory_osmanthus');

  return makeCandidate('sunset_garden_ending_cg', 'nature', 560, 560,
    isSevere, isMild,
    isSevere ? 55 : (isMild ? 3 : 0),
    isMild ? ['在花园度过了时光'] : [],
  );
}

function evaluateAlbumMemories(state: ElderGameState): EndingCandidate | null {
  const missedScore = getMissedContactScore(state);
  const meaningfulContacts = state.phoneStats?.meaningfulContacts ?? 0;
  const albumCount = state.albumViewedFragmentIds?.length ?? 0;

  // v6.6: 只有尝试联系且全线失败时才让位给 phone_unanswered
  const allContactFailed =
    hasAttemptedContact(state) &&
    missedScore >= 2 &&
    meaningfulContacts === 0;

  const isSevere =
    (albumCount >= 4 || state.albumReachedEnd) &&
    (state.maxHungerReached ?? state.status.hunger) < 90 &&
    (state.minHealthReached ?? state.status.health) > 30 &&
    !allContactFailed;

  const isMild = albumCount >= 3 || state.albumReachedEnd;

  return makeCandidate('album_memories_ending_cg', 'memory', 540, 540,
    isSevere, isMild,
    isSevere ? 5 : (isMild ? 3 : 0),
    isMild ? [`翻了 ${albumCount} 页相册`] : [],
  );
}

function evaluateWarmDay(state: ElderGameState): EndingCandidate | null {
  const s = state.status;
  const ps = state.phoneStats;
  const missedScore = getMissedContactScore(state);
  const caregiverScore = getCaregiverCareScore(state);

  // v6.6: 至少 2 类正向社会支持（不再强制家人联系）
  const supportKinds = [
    (ps?.meaningfulContacts ?? 0) > 0,
    caregiverScore >= 3,
    state.completedActions.includes('chat_friend') || state.completedActions.includes('dining_chat'),
    Object.values(state.eatenMeals ?? {}).filter(Boolean).length >= 2,
    state.collectedFragments.length >= 3,
    state.completedActions.includes('garden_walk') || state.completedActions.includes('watch_sunset'),
  ].filter(Boolean).length;

  const isEligible =
    s.mood >= 70 &&
    s.loneliness <= 35 &&
    state.collectedFragments.length >= 3 &&
    (state.maxHungerReached ?? s.hunger) < 75 &&
    (state.minHealthReached ?? s.health) > 45 &&
    supportKinds >= 2 &&
    missedScore < 2 &&
    state.missedMeals === 0;

  return makeCandidate('warm_ending_cg', 'summary', 500, 0,
    isEligible, false,
    isEligible ? 5 : 0,
    isEligible ? [`充实而温柔的一天（支持#{supportKinds}类）`] : [],
    ['phone_unanswered_ending_cg', 'fainting_rescue_ending_cg', 'lost_and_found_ending_cg'],
  );
}

function evaluateLongDay(state: ElderGameState): EndingCandidate | null {
  // v6.6: 慢性低状态兜底，电话遗憾由 phone_unanswered 专门处理
  const isEligible =
    (state.maxLonelinessReached ?? state.status.loneliness) >= 70 ||
    (state.minMoodReached ?? state.status.mood) <= 40 ||
    state.missedMeals >= 2 ||
    (state.maxHungerReached ?? state.status.hunger) >= 85;

  const isMild =
    isEligible ||
    (state.maxLonelinessReached ?? state.status.loneliness) >= 60 ||
    (state.minMoodReached ?? state.status.mood) <= 45;

  return makeCandidate('long_ending_cg', 'summary', 460, 400,
    isEligible, isMild,
    isEligible ? 4 : (isMild ? 2 : 0),
    isMild ? ['这一天有些漫长'] : [],
  );
}

function evaluateQuietDay(): EndingCandidate | null {
  return makeCandidate('quiet_ending_cg', 'quiet', 0, 0,
    false, false, 0, [], ['*'] as any);
}

function evaluateMorningAfterQuiet(): EndingCandidate | null {
  const isEligible = true; // 始终可作为兜底
  return makeCandidate('morning_after_quiet_ending_cg', 'quiet', 100, 0,
    isEligible, false, 0, ['普通但安稳的一天'],
  );
}

// ══════════════════════════════
// 核心：评估全部候选
// ══════════════════════════════

function evaluateEndingCandidates(state: ElderGameState): EndingCandidate[] {
  return [
    evaluateFaintingRescue(state),
    evaluateLostAndFound(state),
    evaluatePhoneUnanswered(state),
    evaluateFamilyVisit(state),
    evaluateCaregiverEscort(state),
    evaluateCaregiverCompanion(state),
    evaluateHealthRecovery(state),
    evaluateRegularMeal(state),
    evaluateSunsetGarden(state),
    evaluateAlbumMemories(state),
    evaluateWarmDay(state),
    evaluateLongDay(state),
    evaluateQuietDay(),
    evaluateMorningAfterQuiet(),
  ].filter((c): c is EndingCandidate => c !== null);
}

// ══════════════════════════════
// 选择主结局
// ══════════════════════════════

function selectMainEnding(candidates: EndingCandidate[]): EndingCandidate {
  const mainCandidates = candidates.filter(c => c.mainEligible);

  if (mainCandidates.length === 0) {
    // 兜底
    return candidates.find(c => c.cgKey === 'morning_after_quiet_ending_cg')
      ?? makeCandidate('morning_after_quiet_ending_cg', 'quiet', 0, 0, true, false, 0, []);
  }

  return mainCandidates.sort((a, b) => {
    if (b.mainPriority !== a.mainPriority) return b.mainPriority - a.mainPriority;
    return b.score - a.score;
  })[0];
}

// ══════════════════════════════
// 选择次级结局
// ══════════════════════════════

function selectSecondaryEndings(
  candidates: EndingCandidate[],
  mainEnding: EndingCandidate,
): EndingCandidate[] {
  let secondary = candidates
    .filter(c => c.cgKey !== mainEnding.cgKey)
    .filter(c => c.secondaryEligible)
    // 硬互斥
    .filter(c => {
      const conflicts = HARD_CONFLICTS[mainEnding.cgKey as EndingCgKey];
      if (conflicts?.includes(c.cgKey as EndingCgKey)) return false;
      if (c.conflictsWith?.includes(mainEnding.cgKey)) return false;
      return true;
    });

  // 同组只保留分数最高的一个
  const groupMap = new Map<EndingCategory, EndingCandidate>();
  for (const c of secondary) {
    const existing = groupMap.get(c.category);
    if (!existing || c.score > existing.score) {
      groupMap.set(c.category, c);
    }
  }
  let deduped = Array.from(groupMap.values());

  // summary 组一般不作为次级
  deduped = deduped.filter(c => {
    if (c.category === 'summary' && deduped.length > 2) return false;
    if (c.category === 'quiet') return false;
    return true;
  });

  // 排序
  deduped.sort((a, b) => {
    if (b.secondaryPriority !== a.secondaryPriority) return b.secondaryPriority - a.secondaryPriority;
    return b.score - a.score;
  });

  // 负向次级上限
  const negativeInSecondary = deduped.filter(c =>
    NEGATIVE_ENDINGS.includes(c.cgKey as EndingCgKey)
  );
  const mainIsNegative = NEGATIVE_ENDINGS.includes(mainEnding.cgKey as EndingCgKey);

  if (negativeInSecondary.length > (mainIsNegative ? 1 : 1)) {
    // 只保留第一个负向
    const firstNegative = negativeInSecondary[0];
    deduped = deduped.filter(c =>
      !NEGATIVE_ENDINGS.includes(c.cgKey as EndingCgKey) || c.cgKey === firstNegative.cgKey
    );
  }

  return deduped.slice(0, MAX_SECONDARY);
}

// ══════════════════════════════
// 主入口：解析结局集
// ══════════════════════════════

export function resolveEndingSet(state: ElderGameState): ElderEndingResult {
  const candidates = evaluateEndingCandidates(state)
    .filter(c => c.mainEligible || c.secondaryEligible);

  const allMatched = evaluateEndingCandidates(state);
  const mainEnding = selectMainEnding(candidates);

  // 如果主结局是 quiet/morning_after_quiet 兜底，就不需要次级
  let secondaryEndings: EndingCandidate[] = [];
  if (mainEnding.cgKey !== 'quiet_ending_cg') {
    secondaryEndings = selectSecondaryEndings(candidates, mainEnding);
  }

  // summaryTone
  let summaryTone: 'warm' | 'mixed' | 'long' | 'quiet' = 'mixed';
  const warmEligible = candidates.find(c => c.cgKey === 'warm_ending_cg' && c.mainEligible);
  const longEligible = candidates.find(c => c.cgKey === 'long_ending_cg' && c.mainEligible);
  if (warmEligible) summaryTone = 'warm';
  else if (longEligible && mainEnding.category === 'summary') summaryTone = 'long';
  else if (mainEnding.category === 'quiet') summaryTone = 'quiet';

  return { mainEnding, secondaryEndings, allMatchedEndings: allMatched, summaryTone };
}

/** 兼容旧函数: 仅返回主结局 */
export function selectEndingCg(state: ElderGameState): EndingDisplay {
  const result = resolveEndingSet(state);
  const main = result.mainEnding;
  return {
    cgKey: main.cgKey as EndingCgKey,
    title: main.title,
    subtitle: main.subtitle,
    message: main.body,
  };
}

/** 兼容旧 EndingType 映射 */
export function endingCgToType(cgKey: string): 'warm' | 'quiet' | 'long' {
  const warmSet = new Set([
    'family_visit_ending_cg', 'caregiver_escort_ending_cg', 'caregiver_companion_ending_cg',
    'sunset_garden_ending_cg', 'warm_ending_cg', 'health_recovery_ending_cg',
    'regular_meal_ending_cg', 'album_memories_ending_cg',
  ]);
  const longSet = new Set([
    'long_ending_cg', 'fainting_rescue_ending_cg', 'lost_and_found_ending_cg',
    'phone_unanswered_ending_cg',
  ]);
  if (warmSet.has(cgKey)) return 'warm';
  if (longSet.has(cgKey)) return 'long';
  return 'quiet';
}

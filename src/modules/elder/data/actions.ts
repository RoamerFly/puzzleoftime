/* === 互动事件数据（优化版） ===
 *
 * 新增字段：maxUses, dailyUses, cooldownMinutes, hideWhenCompleted
 * 用于控制互动次数、冷却时间和热点显示
 */

import type { ElderAction } from '../types';

export const ELDER_ACTIONS: Record<string, ElderAction> = {
  // ===== 房间 =====
  find_glasses: {
    id: 'find_glasses',
    name: '找眼镜',
    description: '眼镜又不知道放哪儿了……没有眼镜，看东西都是模糊一片。',
    costMinutes: 5,
    effects: { mood: -2, energy: -1 },
    specialEffect: 'blur',
    specialNarrative: '摸索着在床头柜和枕头下面翻找……终于找到了。世界重新清晰起来。',
    repeatable: false,
    maxUses: 1,
    hideWhenCompleted: true,
    locationId: 'room',
  },
  wash_up: {
    id: 'wash_up',
    name: '洗漱',
    description: '慢慢走到洗手台前，用温水洗了把脸。看着镜子里的自己——又老了一点，但眼神还是那个眼神。',
    costMinutes: 10,
    effects: { mood: 4, energy: -3, health: 1 },
    // v6.0: 书法碎片已迁至 do_craft 触发
    specialNarrative: '慢慢走到洗手台前，用温水洗了把脸。镜子里的自己比记忆里老了许多，但眼神还算清明。毛巾拧干的时候，水声很轻，像一天真正开始的声音。',
    repeatable: false,
    maxUses: 1,
    hideWhenCompleted: true,
    locationId: 'room',
  },
  look_album: {
    id: 'look_album',
    name: '翻看旧相册',
    description: '床头那本相册已经翻过无数遍了，但每次看到那些旧照片，记忆就像被点亮了一样。',
    costMinutes: 6,
    effects: { mood: 2, loneliness: -2, energy: -1 },
    // v6.0: 改为翻页式相册，碎片由 albumResolver 管理，不再用 grantsFragment
    repeatable: true,
    maxUses: 6,
    cooldownMinutes: 3,
    hideWhenCompleted: false,
    locationId: 'room',
    feedbackTexts: {
      first: '你翻开相册，塑料膜轻轻作响，第一页照片已经有些泛黄。',
      repeat: '你又往后翻了一页，照片边角磨得发软。',
      tired: '相册很厚，翻久了手腕有些酸。',
      afterFragment: '这张照片看过许多遍，可今天又像第一次看见。',
    },
  },
  rest: {
    id: 'rest',
    name: '休息一会儿',
    description: '在床上靠一会儿，闭上眼睛。身体确实不如从前了，休息一下会好很多。',
    costMinutes: 20,
    effects: { energy: 12, mood: 2, hunger: 3 },
    repeatable: true,
    feedbackTexts: {
      first: '在床上靠了一会儿，闭上眼睛。身体确实不如从前了，但休息一下，感觉好了不少。窗外的鸟叫声细细的，像是在哼一首摇篮曲。',
      repeat: '又在床上躺了一会儿。闭上眼睛，那些白天见过的人和事在脑海里慢慢飘过。休息是老人最忠实的朋友。',
      tired: '今天已经躺了好几次了。身体是真的累了——不是那种睡一觉就能好的累，是岁月在骨头里慢慢沉积下来的沉。',
      lowStatus: '身体真的很累了。你靠在床上，闭上眼睛，但脑子里乱糟糟的。只是闭了一会儿眼，并没有真正睡着。',
      nighttime: '夜深了，躺在床上的感觉格外安宁。窗外的月光透过窗帘洒进来，像一层薄薄的银纱。',
    },
  },
  // ===== 夜间休息到天明 =====
  rest_until_morning: {
    id: 'rest_until_morning',
    name: '休息到明天',
    description: '天色已晚，该睡了。躺在床上，回想这一天的点点滴滴……闭上眼睛，明天又是新的一天。',
    costMinutes: 1440,
    effects: { energy: 30, mood: 5, health: 5 },
    timeConstraint: { startHour: 21, endHour: 30 },
    specialEffect: 'sleep',
    specialNarrative: '你慢慢躺下来，盖好被子。窗外的月光透过窗帘洒在地板上，安静而温柔。一天的画面在脑海里缓缓流过——花园里的桂花、活动室的老歌、电话那头的声音……眼睛渐渐合上了。',
    repeatable: true,
    locationId: 'room',
  },

  // ===== 餐厅 =====
  eat_breakfast: {
    id: 'eat_breakfast',
    name: '吃早饭',
    description: '今天的早餐是白粥、煮鸡蛋和一小碟咸菜。简单，但热乎乎的。护工帮你在粥里加了一点糖。',
    costMinutes: 15,
    effects: { hunger: -30, energy: 8, health: 3, mood: 2 },
    timeConstraint: { startHour: 7, endHour: 8 },
    specialNarrative: '慢慢喝完最后一口粥，胃里暖暖的。窗外阳光正好。',
    repeatable: false,
    maxUses: 1,
    hideWhenCompleted: true,
    feedbackTexts: {
      first: '今天的早餐是白粥、煮鸡蛋和一小碟咸菜。简单，但热乎乎的。护工帮你在粥里加了一点糖，喝下去整个人都暖和了。',
      nighttime: '早饭时间还没到。厨房还没开始准备，再等等吧。',
    },
  },
  eat_lunch: {
    id: 'eat_lunch',
    name: '吃午饭',
    description: '午餐是软烂的红烧肉、清炒时蔬和一碗蛋花汤。今天厨房好像多放了一点酱油，味道比平时浓一些。',
    costMinutes: 20,
    effects: { hunger: -35, energy: 10, health: 3, mood: 2 },
    timeConstraint: { startHour: 11, endHour: 13 },
    specialNarrative: '红烧肉炖得很烂，不费牙。你想起老伴以前做的红烧肉，也是这个味道。',
    repeatable: false,
    maxUses: 1,
    hideWhenCompleted: true,
    feedbackTexts: {
      first: '午餐是软烂的红烧肉、清炒时蔬和一碗蛋花汤。红烧肉炖得很烂，不费牙。你想起老伴以前做的红烧肉，也是这个味道。',
      nighttime: '午饭时间还没到呢。再等等吧。',
    },
  },
  eat_dinner: {
    id: 'eat_dinner',
    name: '吃晚饭',
    description: '晚餐清淡一些：清蒸鱼、冬瓜汤和半碗米饭。天色暗下来了，餐厅里的灯都亮了起来。',
    costMinutes: 20,
    effects: { hunger: -28, energy: 6, health: 2, mood: 1 },
    timeConstraint: { startHour: 17, endHour: 19 },
    specialNarrative: '吃完饭，窗外的天已经完全黑了。一天又快要过去了。',
    repeatable: false,
    maxUses: 1,
    hideWhenCompleted: true,
    feedbackTexts: {
      first: '晚餐清淡：清蒸鱼、冬瓜汤和半碗米饭。饭菜不多，但每一样都是用心做的。窗外的天已经黑了，餐厅里的灯暖暖地亮着。',
      nighttime: '晚饭时间还没到，再等等吧。',
    },
  },

  // ===== 医务室 =====
  take_medicine: {
    id: 'take_medicine',
    name: '吃药',
    description: '按时吃药。护士已经把药分好了，放在一个小纸杯里，旁边有一杯温水。',
    costMinutes: 5,
    effects: { health: 6, mood: -1, energy: -1 },
    specialNarrative: '按时吃药。护士已经把药分好了，放在小纸杯里，旁边有一杯温水。你一粒一粒慢慢咽下去，知道这些不起眼的小药片，正在帮身体维持今天的平稳。',
    repeatable: false,
    maxUses: 2,
    cooldownMinutes: 120,
    hideWhenCompleted: true,
    feedbackTexts: {
      first: '按时吃药。护士已经把药分好了，放在一个小纸杯里，旁边有一杯温水。白色的药片，黄色的胶囊，每一种都在帮你撑着这副老骨头。',
      repeat: '又到了吃药时间。人老了，药不能停——这是医生反复叮嘱的。你乖乖把药咽下去了。',
    },
  },
  morning_rehab: {
    id: 'morning_rehab',
    name: '晨间复健',
    description: '在医生的指导下做一些简单的肢体活动。虽然有些吃力，但做完身体会舒服许多。',
    costMinutes: 20,
    effects: { health: 6, energy: -10, mood: 1 },
    timeConstraint: { startHour: 9, endHour: 11 },
    // v6.0: 工作证件碎片已迁入相册
    repeatable: false,
    maxUses: 1,
    hideWhenCompleted: true,
    locationId: 'clinic',
    specialNarrative: '做完最后一个动作，额头微微出汗。医生对你比了个大拇指。',
    feedbackTexts: {
      first: '在医生的指导下做了一些简单的肢体活动。虽然有些吃力，但做完身体会舒服许多。医生对你比了个大拇指。',
      repeat: '今天的复健做完了。出点汗，活动活动，比躺着强。',
      tired: '动作做到一半，腿开始微微发颤。医生让你慢下来，不急着做完。',
    },
  },

  // ===== 花园 =====
  garden_walk: {
    id: 'garden_walk',
    name: '在花园散步',
    description: '沿着石子小路慢慢走一圈。桂花树还没到开花的季节，但月季开得很好。阳光暖洋洋的。',
    costMinutes: 15,
    effects: { mood: 5, health: 3, energy: -8, hunger: 3 },
    // grantsFragment 由 fragmentResolver 统一处理（优先 memory_osmanthus，然后 memory_old_house）
    repeatable: true,
    cooldownMinutes: 30,
    feedbackTexts: {
      first: '沿着石子小路慢慢走一圈。桂花树的叶子沙沙响，月季在花坛里开得正好。阳光从树叶间漏下来，洒在身上暖暖的。',
      repeat: '又在花园里走了一圈。脚步比刚才轻了些。风里有草木的清香，让人想起年轻时去过的那些园子。',
      tired: '你走了几步就慢下来，扶着助行器停了一会儿。这条路今天已经走了好几趟了。',
      lowStatus: '腿脚确实不太听使唤了，走几步就有些喘。但花园里的空气真好，站着歇一歇也不错。',
      nighttime: '花园已经关门了。透过走廊的窗子看出去，月光下的花园安安静静的，明天再来吧。',
    },
  },

  // ===== 活动室/花园 =====
  chat_friend: {
    id: 'chat_friend',
    name: '和老人聊天',
    description: '坐在旁边的老王是这里的老朋友了。话不多，但喜欢听。有时候两个人就这样静静坐着，也挺好。',
    costMinutes: 15,
    effects: { mood: 5, loneliness: -6, energy: -5 },
    // v6.0: 毕业照碎片已迁入相册
    specialNarrative: '"今天天气真好。"老王笑着说。你点点头，也笑了。有人陪着说话，时间好像过得快一些。',
    repeatable: true,
    cooldownMinutes: 30,
    feedbackTexts: {
      first: '你坐到棋桌旁，看着棋子一枚枚落下。你没有急着说话，只是慢慢跟上他们的节奏。',
      repeat: '又一局开始了。你笑了笑，这次想得比刚才慢些。',
      tired: '棋子还在眼前，你却有点走神。坐得久了，腰背开始发沉。',
      lowStatus: '你想再看一会儿棋，但眼皮有些重，手也不太想抬起来。',
      nighttime: '活动室快关门了。老王还在收棋子，动作慢慢的，像是不太舍得走。',
      afterFragment: '刚才那盘棋让你想起很多年轻时的人。现在再看棋盘，心里安静了一些。',
    },
  },

  // ===== 餐厅聊天（v6.8 新增，餐厅场景专属文本） =====
  dining_chat: {
    id: 'dining_chat',
    name: '和邻桌老人聊天',
    description: '旁边坐着几位也在吃饭的老人。你捧着茶杯，朝他们笑了笑。',
    costMinutes: 15,
    effects: { mood: 5, loneliness: -6, energy: -5 },
    specialNarrative: '邻桌的老李看你一个人坐着，把椅子往你这边挪了挪。"今天红烧肉炖得烂，你尝了没？"你点点头，两个人有一搭没一搭地聊了起来。',
    repeatable: true,
    cooldownMinutes: 30,
    feedbackTexts: {
      first: '邻桌的老人把椅子往你这边挪了挪，随口说起今天的菜。你捧着茶杯听着，偶尔应两句。',
      repeat: '旁边的老人又聊起了天气和院子里的花。你们都不是很健谈的人，但坐在一起，时间好像不那么漫长了。',
      tired: '聊了一阵，嗓子有些干，话题也慢慢少了下来。你低头喝着汤，偶尔抬头笑一下——这样也够了。',
      lowStatus: '你想说点什么，但身体有些疲惫。只是坐在那里，听着碗筷的声音和邻桌轻声的谈话，心里还是安稳了一点。',
      nighttime: '餐厅的灯调暗了一点，吃饭的人陆续走了。你最后喝完那碗汤，也准备回去了。',
      afterFragment: '刚才聊到的事让你想起了很久以前的日子。饭菜的热气还在，回忆也还是温的。',
    },
  },
  hear_old_song: {
    id: 'hear_old_song',
    name: '听到一首老歌',
    description: '活动室的收音机里放着一首很老很老的歌。旋律一响起来，你就知道是哪首了。',
    costMinutes: 5,
    effects: { mood: 5, loneliness: -3, energy: -1 },
    // grantsFragment 由 fragmentResolver 统一处理（优先 memory_old_dance，然后 memory_old_radio）
    specialNarrative: '那是你年轻时最喜欢的一首歌。那时候你还会跳舞——不，你跳得其实不太好，但快乐是真切的。',
    timeConstraint: { startHour: 15, endHour: 17 },
    repeatable: false,
    maxUses: 1,
    hideWhenCompleted: true,
    locationId: 'activity',
    feedbackTexts: {
      first: '活动室的收音机里放着一首很老很老的歌。旋律一响，你就知道是哪首了。那是你年轻时最喜欢的一首歌——那时候你还会跳舞，虽然跳得不太好，但快乐是真切的。',
      afterFragment: '收音机里又飘出熟悉的旋律。你闭着眼睛听着，嘴角微微上扬。有些歌听了大半辈子，每一次听都还是那么舒服。',
    },
  },

  // ===== 电话角 =====
  call_family: {
    id: 'call_family',
    name: '给家人打电话',
    description: '走到电话旁，拨通那个熟悉的号码。不知道他们今天忙不忙……希望有人接。',
    costMinutes: 10,
    effects: { mood: 8, loneliness: -12, energy: -2 },
    repeatable: true,
    // v6.3-v3: 移除 maxUses 限制，老人可以多次拨打
    cooldownMinutes: 60,
    locationId: 'phone',
    feedbackTexts: {
      first: '你慢慢按下那串熟得不能再熟的号码。话筒里传来嘟——嘟——的长音，一声接一声。你握紧听筒，心跳好像也跟着响。',
      success: '电话很快接通了。那头的声音有些嘈杂，却熟悉得让人安心。',
      failed: '电话响了很久，最后只剩下忙音。你把听筒放回去，手停了一会儿。',
      repeat: '这次通话短了一点，但听见家人的声音，心里还是踏实了些。',
      tired: '你又拿起听筒。号码已经烂熟于心，但手指按下去比刚才慢了。说了几句，声音比平时轻了。',
      lowStatus: '你本来想说很多，可电话接通后，只是问了句：最近忙不忙？',
      nighttime: '你看着电话，想了想，还是没有在这个时候拨出去。',
      dialingHint: '嘟——嘟——电话正在接通中……',
      // v6.4: 聊天记录式对话（按拨打次数轮换，每条{who,text}）
      chatMessages: [
        // ① 日常问候
        [
          { who: 'family', text: '喂？爸/妈——' },
          { who: 'elder', text: '哎。没什么事，就是打个电话。' },
          { who: 'family', text: '吃饭了吗？' },
          { who: 'elder', text: '吃了，粥和鸡蛋。你们呢？' },
          { who: 'family', text: '还没呢，刚到家。药有没有按时吃？' },
          { who: 'elder', text: '吃了。你路上小心，早点吃饭。' },
        ],
        // ② 桂花约定
        [
          { who: 'family', text: '喂——妈/爸！' },
          { who: 'elder', text: '哎。那边怎么那么吵？' },
          { who: 'family', text: '孩子正闹呢——等一下啊。对了，花园里的桂花开了没？' },
          { who: 'elder', text: '开了，香得很。你小时候最爱摘桂花。' },
          { who: 'family', text: '记得呢。这周末有空的话，带孩子过来闻一闻。' },
          { who: 'elder', text: '好。不急，什么时候都行。' },
        ],
        // ③ 儿媳/女婿
        [
          { who: 'family', text: '爷爷/奶奶，是我。身体最近好不好？' },
          { who: 'elder', text: '都好都好。你们最近忙不忙？' },
          { who: 'family', text: '还行，就是小的最近要考试，天天盯着做作业。' },
          { who: 'elder', text: '别盯太紧，孩子也累。' },
          { who: 'family', text: '知道了——哎，小家伙在旁边喊"爷爷/奶奶说别太累"。' },
          { who: 'elder', text: '好，好。挂了啊，你们也早点休息。' },
        ],
        // ④ 孙子/孙女
        [
          { who: 'family', text: '喂？爷爷/奶奶！是我！' },
          { who: 'elder', text: '哎哟，是你啊。作业写完了没？' },
          { who: 'family', text: '写完啦！今天美术课我画了一棵树，老师说我画得好！' },
          { who: 'elder', text: '真的？画得很好吧。' },
          { who: 'family', text: '还行！下次画给你看。午饭有鸡腿，我吃了两个——' },
          { who: 'elder', text: '慢点吃，别噎着。挂电话了啊，好好写作业。' },
        ],
        // ⑤ "想你们了"
        [
          { who: 'elder', text: '也没什么……就是想你们了。' },
          { who: 'family', text: '……我们也想你。' },
          { who: 'elder', text: '嗯。那就好。' },
          { who: 'family', text: '你好好吃饭，药别忘。周末我带炖好的汤过来。' },
          { who: 'elder', text: '好。挂了啊。' },
          { who: 'family', text: '挂吧。早点休息。' },
        ],
      ],
      // v6.3-v3: 未接通的多样化文本
      missedReasons: [
        '电话响到自动挂断，那头始终没人接。大概是手机不在身边，或者在开会。你把话筒放回去，心想等一会儿再打。',
        '嘟声响到第六下的时候转到了留言信箱。熟悉的机器女声念了一遍号码，你没有留言，轻轻挂上了。有些话对着机器说不出口。',
        '电话占线。一遍、两遍，都是短促的忙音。你停了一会儿，心想也许他们正在通话，过半小时再拨吧。',
      ],
    },
  },
  // ===== 电话角 - 新拆分动作 =====
  phone_chair: {
    id: 'phone_chair',
    name: '在电话角坐下',
    description: '电话角有一把旧藤椅，你在旁边坐下来，等着也许会给家人打个电话。',
    costMinutes: 3,
    effects: { energy: 5, mood: 3 },
    repeatable: true,
    cooldownMinutes: 30,
    locationId: 'phone',
    feedbackTexts: {
      first: '你在电话角的藤椅上坐了下来。这个位置刚好能看见窗外的走廊，光线柔和，是个安静的角落。坐下来，心里也静下来了。',
      repeat: '又在藤椅上坐了一会儿。这把椅子很舒服，坐下来就不太想动。你看着电话，想着要不要再拨一回。',
    },
  },

  // ===== 护理站 =====
  wait_nurse: {
    id: 'wait_nurse',
    name: '等待护工帮助',
    description: '按了铃，护工说马上来。你坐在走廊的长椅上等着。这里的护工总是很忙，你理解，但等待确实漫长。',
    costMinutes: -1,
    costMinutesRange: [10, 30],
    effects: { loneliness: -3, mood: -2, energy: -2 },
    repeatable: true,
    cooldownMinutes: 30,
    locationId: 'nurse',
    feedbackTexts: {
      first: '按了铃，护工说马上来。你坐在走廊的长椅上等着。过了一会儿，护工终于来了，满脸歉意："不好意思，刚才三楼那边有事耽搁了。"你摇摇头说没关系。',
      success: '护理员抬头看见你，语气很轻地问哪里不舒服。很快帮你处理好了。',
      failed: '护理站今天有些忙，你等了一会儿，才有人抬头回应。',
      repeat: '又按了一次铃。等了十几分钟，一位年轻的护工匆匆赶来。这里的护工总是很忙，你能理解，但等待确实让人觉得时间很长。',
      tired: '已经是今天第三次按铃了。你有点过意不去，但又确实需要帮忙。',
      nighttime: '这么晚了，值班的护理员比白天少了很多。按了铃，过了好久才有人来。但你理解——夜间值班只有两个人，要照顾整个楼层。',
    },
  },

  // ===== 走廊 =====
  get_lost: {
    id: 'get_lost',
    name: '……走到哪里了？',
    description: '走廊好像都长得一样。你停下来，有点不确定该往哪边走。',
    costMinutes: 5,
    effects: { mood: -4, energy: -4, loneliness: 4 },
    specialEffect: 'narrative',
    specialNarrative: '"您还好吗？"一位路过的年轻护工温柔地问。扶着你，慢慢地带你走回了你熟悉的方向。"下次记得看墙上的房间号和指示牌，都很清楚的。"',
    repeatable: true,
    cooldownMinutes: 20,
    locationId: 'corridor',
  },

  // ===== 看夕阳（房间或花园） =====
  watch_sunset: {
    id: 'watch_sunset',
    name: '看窗外夕阳',
    description: '黄昏的光从窗户照进来，把整个房间染成了金黄色。你慢慢走到窗前，看着远处的天际线。',
    costMinutes: 5,
    effects: { mood: 4, loneliness: -2 },
    timeConstraint: { startHour: 17, endHour: 19 },
    // v6.0: 节日灯笼碎片改为晚间电话角事件触发
    specialNarrative: '夕阳很美。你想起了很多个傍晚——年轻时的、中年时的、还有和老伴一起看过的那些夕阳。有些事过去了，但那种宁静的感觉还在。',
    repeatable: false,
    maxUses: 1,
    hideWhenCompleted: true,
  },

  // ===== 错过饭点 =====
  miss_meal: {
    id: 'miss_meal',
    name: '饿了',
    description: '肚子咕咕叫，才想起好像错过了饭点。',
    costMinutes: 0,
    effects: { mood: -5, hunger: 10, energy: -5, health: -1 },
    specialNarrative: '没关系，护工说可以去厨房拿些饼干和牛奶。饥饿感暂时得到了缓解，但你默默提醒自己明天要记得去吃饭。',
    repeatable: true,
    cooldownMinutes: 60,
    feedbackTexts: {
      first: '饭点已经过了。胃里空了一阵，你才想起刚才好像有人来叫过你。',
      repeat: '今天已经错过不止一顿饭了。身体发虚，连站起来都比早晨慢了一些。',
      tired: '护工发现你脸色不太对，赶紧端来热粥。饿久了不是忍一忍就过去的事。',
    },
  },

  // ═══════════════════════════════════════════════
  // v5.4 装饰热点扩展（原"无，可选扩展"→实际动作）
  // v5.6: 添加 feedbackTexts 多句反馈
  // ═══════════════════════════════════════════════

  // ===== 房间 =====
  press_bell: {
    id: 'press_bell',
    name: '按呼叫铃',
    description: '按了一下床头的呼叫铃。',
    costMinutes: 3,
    effects: { loneliness: -2, mood: -1 },
    specialNarrative: '你说可能是按错了。护工没有责备，只是又确认了一遍："真的没事吗？"你点点头，心里却因为有人回应而安定了一点。',
    repeatable: true,
    cooldownMinutes: 60,
    locationId: 'room',
  },
  use_walker: {
    id: 'use_walker',
    name: '用助行器',
    description: '扶着助行器的扶手，慢慢站起来走了几步。虽然慢，但至少不用别人扶。',
    costMinutes: 5,
    effects: { energy: -2, health: 1 },
    specialNarrative: '握着助行器的手柄，一步一步挪到窗边。阳光正好照在手上——这双手虽然老了，但还能自己走。',
    repeatable: false,
    maxUses: 2,
    cooldownMinutes: 60,
    locationId: 'room',
  },

  // ===== 走廊 =====
  lean_handrail: {
    id: 'lean_handrail',
    name: '扶着扶手',
    description: '靠着墙上的防滑扶手，停下来喘口气。走廊很长，慢慢走，不急。',
    costMinutes: 3,
    effects: { energy: 3, mood: -1 },
    // v6.0: 孩子照片碎片已迁入相册
    specialNarrative: '握着扶手，忽然想起孩子刚学走路的时候——也是这样扶着墙，一步一步，摇摇晃晃地往前走。那时候你在后面张着双臂护着，生怕摔了。现在轮到你扶着扶手慢慢走了。',
    repeatable: true,
    cooldownMinutes: 15,
    feedbackTexts: {
      first: '握着扶手，靠在墙边歇了一口气。走廊很长，但慢慢走总能到。墙上贴着一张亲情宣传照片，上面有个小孩对着镜头笑——忽然想起自己孩子刚学走路的时候，也是这样一步一步，摇摇晃晃地往前走。',
      repeat: '又停下来扶着扶手喘了口气。走廊的扶手很好用，一步一步，不急。',
    },
  },

  // ===== 餐厅 =====
  talk_caregiver: {
    id: 'talk_caregiver',
    name: '和护理员聊聊',
    description: '护理员正在旁边忙着分餐，抬头对你笑了笑。你决定搭几句话。',
    costMinutes: 8,
    effects: { loneliness: -5, mood: 3, energy: -1 },
    specialNarrative: '"今天天气真好。"你随口说了一句。护理员一边忙着一边回话："是啊，花园里的月季开得可好了，等会儿可以去看看。"简单的几句对话，却让人觉得不那么孤单了。',
    repeatable: true,
    cooldownMinutes: 30,
    feedbackTexts: {
      first: '"今天天气真好。"你随口说了一句。护理员一边忙着一边回话："是啊，花园里的月季开得可好了，等会儿可以去看看。哦对了，下午有家属探望安排，您家人说不定会来呢。"简单的几句对话，却让人觉得不那么孤单了。',
      repeat: '又和护理员聊了几句。她是个热心的人，总能让人心里暖暖的。',
    },
  },

  // ===== 活动室 =====
  do_craft: {
    id: 'do_craft',
    name: '做手工',
    description: '手工桌上放着彩纸、剪刀和胶水。几位老人正在做简单的折纸和拼贴画。',
    costMinutes: 15,
    effects: { mood: 4, energy: -6, health: -1, loneliness: -3 },
    // grantsFragment 由 fragmentResolver 统一处理（look_album + do_craft → memory_scarf）
    specialNarrative: '你坐到手工桌前，桌上有红纸、毛线、旧字帖和几支毛笔。手指没有年轻时灵活了，但慢慢做，还是能做出一点像样的东西。看到宣纸和墨迹时，心里忽然安静下来。',
    repeatable: true,
    cooldownMinutes: 30,
    locationId: 'activity',
    feedbackTexts: {
      first: '你坐到手工桌前，桌上有红纸、毛线、旧字帖和几支毛笔。触到布料和针线的时候，心里忽然涌上一股暖意——想起了老伴织的那条旧围巾。',
      repeat: '又在手工桌前坐了一会儿。折纸、拼贴，简单的事，但一针一线、一折一叠，都是陪伴自己度过时光的方式。',
      tired: '手指有些僵了。纸鹤的角怎么也折不齐——手开始发抖了。放下纸，活动了几下手腕。',
      lowStatus: '手指有点僵，折纸不太利索。但坐在这里，看着其他老人忙着手里的活，心里还是平静了不少。',
    },
  },
  watch_tv: {
    id: 'watch_tv',
    name: '看电视',
    description: '电视开着，正放着戏曲节目。画面有些发白，但声音很熟悉。',
    costMinutes: 10,
    effects: { mood: 2, loneliness: -1, energy: -2 },
    specialNarrative: '电视里唱的是《天仙配》，那是你和老伴最喜欢的一段。旋律一响，好像老伴就在旁边，和你一起听。',
    repeatable: false,
    maxUses: 1,
    hideWhenCompleted: true,
    locationId: 'activity',
    feedbackTexts: {
      first: '电视里正放着戏曲节目。画面有些发白，但声音很熟悉。《天仙配》的旋律响起来的时候，好像一下子回到了过去——那时候电视还是黑白的，但一家人围在一起，比什么都暖和。',
      nighttime: '晚上的电视节目快结束了。屏幕上的雪花点越来越多，但你还是在看——不是看节目，是看那些模糊的光影，像极了记忆的样子。',
    },
  },

  // ===== 花园 =====
  admire_flowers: {
    id: 'admire_flowers',
    name: '赏花',
    description: '弯腰看看花坛里的月季——粉的、红的、黄的，开得正好。',
    costMinutes: 5,
    effects: { mood: 4, loneliness: -1, energy: -1 },
    // grantsFragment 由 fragmentResolver 统一处理（garden_walk + admire_flowers → memory_osmanthus）
    specialNarrative: '一朵粉月季开得特别大，花瓣上还有早晨的露珠。你伸手轻轻碰了碰——又软又凉。种了一辈子花，看到花开，心里还是欢喜。',
    repeatable: true,
    cooldownMinutes: 20,
    feedbackTexts: {
      first: '一朵粉月季开得特别大，花瓣上还有早晨的露珠。你伸手轻轻碰了碰——又软又凉。种了一辈子花，看到花开，心里还是欢喜。',
      repeat: '又看了一会儿花。月季年年开，你也年年看。有些花谢了又开，有些人走了就不再回来。但花还在开，日子还在过。',
    },
  },
  sit_pavilion: {
    id: 'sit_pavilion',
    name: '亭子小坐',
    description: '走到花园的凉亭下面，在长石凳上坐下来。风穿过亭子，吹在脸上很舒服。',
    costMinutes: 10,
    effects: { energy: 4, mood: 3, loneliness: -2 },
    specialNarrative: '坐在亭子里，看着花园里其他老人慢慢走过。时间好像也慢了下来。一只蝴蝶停在亭子柱子上，翅膀一开一合，像在和你打招呼。',
    repeatable: true,
    cooldownMinutes: 30,
    feedbackTexts: {
      first: '走到凉亭下，在石凳上坐下来。风穿过亭子，吹在脸上很舒服。一只蝴蝶停在柱子上，翅膀一开一合，像在和你打招呼。',
      repeat: '又在亭子里坐了一会儿。这个角度刚好能看见整个花园——桂花树、月季花坛，还有远处走廊的暖黄色灯光。',
    },
  },

  // ===== 医务室 =====
  measure_bp: {
    id: 'measure_bp',
    name: '测血压',
    description: '坐下来，把手臂伸进血压计的袖带。医生说最近血压还算稳定。',
    costMinutes: 5,
    effects: { health: 1, mood: -1 },
    specialNarrative: '"高压128，低压82，不错。"医生一边记录一边说。"药还是要按时吃，不能停。"你点点头，心想这副老机器还能正常运转，也算不错。',
    repeatable: false,
    maxUses: 1,
    hideWhenCompleted: true,
    locationId: 'clinic',
  },
  exercise_bike: {
    id: 'exercise_bike',
    name: '踩健身车',
    description: '坐上去慢慢踩了几圈。膝盖有点响，但踩起来还行。',
    costMinutes: 15,
    effects: { energy: -9, health: 5, mood: 1 },
    specialNarrative: '踩完十圈，额头微微出汗。医生在旁边鼓励："很好很好，每天坚持踩一会儿，膝盖会越来越活络的。"你喘着气，心里想着——活络不活络不知道，但出汗的感觉确实不错。',
    // v6.0: 第一次旅行碎片已迁入相册
    repeatable: false,
    maxUses: 1,
    cooldownMinutes: 60,
    hideWhenCompleted: true,
    locationId: 'clinic',
    feedbackTexts: {
      first: '坐上健身车，慢慢踩了几圈。膝盖有点响，但踩起来还行。医生在旁边鼓励，你心想——活络不活络不知道，但出汗的感觉确实不错。当年骑自行车上班的日子，也是这个节奏。',
    },
  },

  // ===== 护理站 =====
  ask_medicine: {
    id: 'ask_medicine',
    name: '询问用药',
    description: '看着药品推车上的瓶瓶罐罐，你决定问问护士自己的药还够不够。',
    costMinutes: 5,
    effects: { health: 2, mood: 1, energy: -1 },
    specialNarrative: '护士翻了翻记录本："您的降压药还有一周的量，下周一来拿新的就行。""好，谢谢你。"你记在心里，又多了一个下周一要做的事。',
    repeatable: false,
    maxUses: 1,
    hideWhenCompleted: true,
    locationId: 'nurse',
  },

  // ===== 电话角 =====
  turn_on_lamp: {
    id: 'turn_on_lamp',
    name: '打开台灯',
    description: '轻轻拧开桌上的台灯，暖黄的光洒下来。这个小角落立刻变得温馨了许多。',
    costMinutes: 2,
    effects: { mood: 2, energy: -1 },
    specialNarrative: '台灯的光不大，但刚好照亮桌面。你坐下来，看着灯光出神。灯光总让人想起家的感觉——以前每天晚上，也是这样一盏灯，照着桌上的饭菜和家人的脸。',
    // v6.0: 回家团聚碎片已迁入相册；节日灯笼碎片改为晚间turn_on_lamp组合触发
    repeatable: false,
    maxUses: 1,
    hideWhenCompleted: true,
    locationId: 'phone',
  },
  read_board: {
    id: 'read_board',
    name: '看亲情板',
    description: '亲情联系板上贴着探访时间、联系电话和几张照片。你站在前面看了一会儿，指尖停在一个熟悉的名字旁边。想说的话很多，真要写下来时，却又不知道从哪一句开始。',
    costMinutes: 5,
    effects: { mood: 1, loneliness: -5, energy: -2 },
    specialNarrative: '亲情联系板上贴着探访时间、联系电话和几张照片。你站在前面看了一会儿，指尖停在一个熟悉的名字旁边。想说的话很多，真要写下来时，却又不知道从哪一句开始。',
    // v6.0: 生日蛋糕碎片已迁入相册
    repeatable: true,
    cooldownMinutes: 60,
    locationId: 'phone',
    feedbackTexts: {
      first: '亲情联系板上贴着探访时间、联系电话和几张照片。你站在前面看了一会儿，指尖停在一个熟悉的名字旁边。"周三下午 3 点，家人来。"一张小纸条上写着这几个字。你也想写一张，想了想，又不知道从哪里写起。',
      repeat: '又看了一遍亲情板。有些便利贴已经泛黄了，但上面的字还是那么认真。',
    },
  },

  // ══════════════════════════════════════
  // 电话角 - 平板视频通话（v6.6 升级为完整视频通话事件）
  // ══════════════════════════════════════
  use_tablet: {
    id: 'use_tablet',
    name: '用平板视频通话',
    description: '拿起平板，试试能不能视频连线家人。屏幕亮起来，那个熟悉的头像出现在联系人列表里。',
    costMinutes: 10,
    effects: { energy: -2 },  // 拿起设备成本；真正结果在 VideoCallDialog 结束后结算
    repeatable: true,
    cooldownMinutes: 90,
    locationId: 'phone',
    feedbackTexts: {
      first: '你拿起平板，手指在屏幕上小心滑动。联系人列表里家人的头像亮着——你轻轻点了下去。',
    },
  },

  // ══════════════════════════════════════
  // v6.1: 护工送饭（饥饿触发，不绑定地点）
  // ══════════════════════════════════════
  caregiver_meal: {
    id: 'caregiver_meal',
    name: '吃饭（护工送来）',
    description: '护工见你饿了，端来了一份热饭菜。',
    costMinutes: 15,
    effects: { hunger: -25, energy: 5, health: 2, mood: 3, loneliness: -2 },
    specialNarrative: '护工轻轻推门进来，把餐盘放在桌上："看您一直没去餐厅，给您端过来了。趁热吃吧。"饭菜简单但可口——有软米饭、蒸蛋和几样小菜。你不紧不慢地吃着，胃里渐渐暖了起来。',
    // v6.1fix: 可重复（带冷却），饥饿反复时能多次使用
    repeatable: true,
    cooldownMinutes: 90,
    hideWhenCompleted: false,
    feedbackTexts: {
      first: '你慢慢吃着护工送来的饭菜。虽然只是一份简餐，但被人记挂着的感觉，比饭菜本身更暖胃。吃完后整个人精神了不少。',
      repeat: '又吃完了一份护工送来的简餐。饭菜不多，但刚好不饿。',
    },
  },

  // ══════════════════════════════════════
  // v6.1 饿晕事件：强制治疗动作
  // ══════════════════════════════════════
  force_feed: {
    id: 'force_feed',
    name: '接受喂饭',
    description: '护工扶你坐下，一勺一勺地喂你喝粥。你虚弱得连勺子都拿不稳了。',
    costMinutes: 20,
    effects: { hunger: -40, energy: 10, health: 5, mood: 2, loneliness: -5 },
    specialNarrative: '护工一勺一勺地喂你喝粥。你虚弱得连勺子都拿不稳了，但每一口热粥滑下去，身体都像在被慢慢填满。护工没有说话，只是耐心地举着勺子等你咽完。吃完后，晕眩的感觉渐渐消退，手脚也有了些力气。',
    repeatable: false,
    maxUses: 1,
    hideWhenCompleted: true,
  },
  iv_nutrition: {
    id: 'iv_nutrition',
    name: '打营养液',
    description: '护士赶来，帮你挂上了营养液。透明的液体一滴一滴流入血管——虽然冷，但身体在慢慢恢复。',
    costMinutes: 25,
    effects: { hunger: -35, energy: 8, health: 8, mood: -1, loneliness: -3 },
    specialNarrative: '护士帮你接上了营养液，动作很轻。透明的液体一滴一滴落下，你靠在床边，感觉眩晕慢慢退去。她又替你把被角掖好，低声叮嘱：下次可不能再饿成这样了。',
    repeatable: false,
    maxUses: 1,
    hideWhenCompleted: true,
    feedbackTexts: {
      first: '你靠在床上，看着营养液一滴滴落下。挂完这瓶之后，整个人清醒了不少。护士拔针时叮嘱："下次可不能再饿成这样了。"',
    },
  },

  // ══════════════════════════════════════
  // 等待用餐（动态动作，label/耗时在执行时计算）
  // ══════════════════════════════════════
  wait_for_meal: {
    id: 'wait_for_meal',
    name: '等待至用餐时间',
    description: '在餐厅里坐下来，等着下一顿饭。厨房里偶尔传来锅碗碰撞的声音，空气里已经有了一点饭菜的香气。',
    costMinutes: 0,
    effects: {},
    repeatable: true,
    cooldownMinutes: 5,
    hideWhenCompleted: false,
    locationId: 'dining',
  },

  // ══════════════════════════════════════
  // v6.9→v6.11 体力耗尽干预动作
  // rest_escorted: 体力≤15护工主动扶休息（使用中）
  // rest_collapse_room: 体力=0时由handleExhaustionTreat直接操作状态（使用中）
  // rest_collapse_sit: @deprecated v6.11（不再被调用）
  // ══════════════════════════════════════

  /** 体力过低→护工扶着就地休息（动态添加，类似 caregiver_meal 的体力版） */
  rest_escorted: {
    id: 'rest_escorted',
    name: '护工扶着休息',
    description: '护工看你脸色不太好，扶你到旁边坐下歇一歇。',
    costMinutes: 15,
    effects: { energy: 18, health: 3, mood: 2, loneliness: -2 },
    specialNarrative: '护工轻轻扶你到旁边的椅子上坐下。"您脸色不太好，先歇一会儿，别急着走。"你闭上眼睛靠了一会儿，手脚渐渐有了些力气。',
    repeatable: true,
    cooldownMinutes: 120,
    hideWhenCompleted: false,
    feedbackTexts: {
      first: '护工看着你，有些不放心："您先坐一会儿，别急着走。"你靠在椅子上，闭上眼睛，呼吸慢慢匀了下来。',
      repeat: '护工又一次扶你坐下，神情有些担心："今天怎么这么容易累？要不我叫医生来看看？"你摇摇头，说歇一歇就好。',
    },
  },

  /** v6.11: 体力归零→强制回房间休养（不再由对话框触发；handleExhaustionTreat 直接操作状态，手动记录此动作用于冷却检测） */
  rest_collapse_room: {
    id: 'rest_collapse_room',
    name: '回房间休息',
    description: '护工扶着你，一步一步慢慢走回房间。你几乎整个人的重量都靠在她身上。',
    costMinutes: 30,
    effects: { energy: 35, health: 5, mood: 3, loneliness: -4 },
    specialNarrative: '护工扶着你，一步一步慢慢走回房间。你几乎整个人的重量都靠在她身上。终于坐到床边，护工帮你脱了鞋、盖好被子。"好好睡一觉吧，有什么事按铃就行。"你闭上眼睛，听到门轻轻关上的声音，身体慢慢沉入柔软的床里。',
    repeatable: true,
    cooldownMinutes: 180,
    hideWhenCompleted: false,
  },

  /** @deprecated v6.11: 体力归零→就地坐下恢复，不再被对话框调用，保留定义以供兼容 */
  rest_collapse_sit: {
    id: 'rest_collapse_sit',
    name: '就地坐下歇',
    description: '护工赶紧搬来一把椅子，扶你慢慢坐下来。',
    costMinutes: 20,
    effects: { energy: 25, health: 2, mood: 1, loneliness: -3 },
    specialNarrative: '护工赶紧搬来椅子，扶你慢慢坐下来。"先在这儿歇一会儿，不急。"她帮你倒了杯温水，站在旁边看着你慢慢喝下去。坐了一会儿，你抬起手摆了摆——好一些了。',
    repeatable: true,
    cooldownMinutes: 180,
    hideWhenCompleted: false,
    feedbackTexts: {
      first: '你靠着椅子坐了一会儿。护工站在旁边，时不时看你一眼。慢慢地，手脚不再那么沉了。',
    },
  },
};

/* ══════════════════════════════════════
   v6.6 平板视频通话消息
   ══════════════════════════════════════ */

/** 视频通话成功后的对话消息（按 groupId 分组，与电话通话同为5组，行数4~6随机变化） */
export const videoCallMessages: Array<{
  id: string;
  title: string;
  lines: Array<{ speaker: string; text: string }>;
}> = [
  {
    id: 'grandchild_drawing',
    title: '孙辈的小画',
    lines: [
      { speaker: 'family', text: '爷爷/奶奶，能看到我吗？' },
      { speaker: 'elder', text: '看到了，看到了。你离镜头太近啦。' },
      { speaker: 'family', text: '我今天画了一棵树，给你看！' },
      { speaker: 'elder', text: '画得真好，叶子像花园里的桂花。' },
      { speaker: 'family', text: '下次我带来给你。' },
      { speaker: 'elder', text: '好，我等着。' },
    ],
  },
  {
    id: 'dinner_table',
    title: '晚饭桌边',
    lines: [
      { speaker: 'family', text: '我们正吃饭呢，给你看看今天的菜。' },
      { speaker: 'elder', text: '别光顾着给我看，你们也快吃。' },
      { speaker: 'family', text: '你晚饭吃了吗？' },
      { speaker: 'elder', text: '吃了，有汤，热乎的。' },
      { speaker: 'family', text: '那就好，周末我们去看你。' },
    ],
  },
  {
    id: 'camera_angle',
    title: '调不好的角度',
    lines: [
      { speaker: 'family', text: '爸/妈，你把平板拿低一点。' },
      { speaker: 'elder', text: '这样？我只看见自己的下巴。' },
      { speaker: 'family', text: '哈哈，对，再往上一点。' },
      { speaker: 'elder', text: '现在看见你了。' },
      { speaker: 'family', text: '你气色挺好的。' },
      { speaker: 'elder', text: '看见你们，气色就好了。' },
    ],
  },
  {
    id: 'garden_flowers',
    title: '花园里的花',
    lines: [
      { speaker: 'family', text: '妈/爸，你那边花园的花开了没？' },
      { speaker: 'elder', text: '开了，桂花香得很。你小时候最爱摘。' },
      { speaker: 'family', text: '记得呢！现在阳台上也种了一盆。' },
      { speaker: 'elder', text: '真的？那你可得浇水勤快点。' },
      { speaker: 'family', text: '知道了——下次拍给你看！' },
    ],
  },
  {
    id: 'weather_chat',
    title: '天气真好',
    lines: [
      { speaker: 'family', text: '今天太阳真好，你都出去走走了吗？' },
      { speaker: 'elder', text: '去了，在花园里坐了一会儿，晒得暖洋洋的。' },
      { speaker: 'family', text: '那就好。多晒太阳能补钙。' },
      { speaker: 'elder', text: '补钙？你什么时候学会这些话了。' },
    ],
  },
];

/** 视频通话失败/未接文本 */
export const videoCallFailedTexts: string[] = [
  '屏幕亮了很久，头像一直没有变成画面。你把平板放回支架，想着他们大概还在忙。',
  '视频连上了一下，又很快断开。你听见半句"等会儿再打"，屏幕就暗了下去。',
  '你点了好几次绿色按钮，平板却一直没有反应。也许手指太干，屏幕没认出来。',
];

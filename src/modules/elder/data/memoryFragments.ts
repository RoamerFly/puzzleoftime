/* === 回忆碎片数据（v6.0 分类版） ===
 *
 * v6.0 改进：
 * - 新增 source 字段：album / action / combo / event
 * - 8张照片类碎片转入相册池，由 albumResolver 管理
 * - 弱因果关联已修复（书法→do_craft, 旅行→相册, 灯笼→晚间事件等）
 * - 组合触发碎片保留 triggerRules
 */

import type { MemoryFragment } from '../types';

export const MEMORY_FRAGMENTS: Record<string, MemoryFragment> = {

  // ══════════════════════════════════════
  // 相册碎片（source='album'，由 albumResolver 管理）
  // 不参与 resolveTriggeredFragment 普通扫描
  // ══════════════════════════════════════

  memory_photo_album: {
    id: 'memory_photo_album',
    title: '相册里的第一张婚照',
    description: '透明塑料膜下面，压着一张泛黄的结婚照。',
    memoryText: '照片里的你们还很年轻，站得有些拘谨，笑却藏不住。那天的花、那天的衣服、那天照相馆里刺眼的灯光，都已经远了。可手指隔着塑料膜碰到照片时，还是像碰到了那一天。',
    imageKey: 'memory_album_wedding_photo',
    triggerAction: '__album__',
    source: 'album',
  },
  memory_spouse_photo: {
    id: 'memory_spouse_photo',
    title: '白了头的合影',
    description: '相框里的你和老伴都已经白了头，但笑得很安稳。',
    memoryText: '这张合影拍得并不隆重，只是在一个普通的下午。那时候你们都老了，走路慢了，说话也慢了，可坐在一起的时候，日子就还是完整的。现在相框还在桌上，像老伴还坐在旁边，提醒你慢慢吃饭、早点休息。',
    imageKey: 'memory_spouse_photo',
    triggerAction: '__album__',
    source: 'album',
  },
  memory_childhood_photo: {
    id: 'memory_childhood_photo',
    title: '给孩子念书的晚上',
    description: '孩子窝在怀里，手指点着图画书上的小动物，一页一页不肯睡。',
    memoryText: '那时候你总嫌时间不够。白天忙工作，晚上还要哄孩子睡觉。孩子听故事时眼睛亮亮的，问了一遍又一遍"后来呢"。现在孩子也成了大人，忙得很少停下。你偶尔想起那个晚上，才明白自己也曾是别人睡前最安心的声音。',
    imageKey: 'memory_childhood_photo',
    triggerAction: '__album__',
    source: 'album',
  },
  memory_graduation_photo: {
    id: 'memory_graduation_photo',
    title: '毕业照',
    description: '那张毕业照已经泛黄了，但你还是能一眼找到自己——站在第三排左边，笑得很腼腆。',
    memoryText: '那时候你觉得未来很远，远到看不清。现在回头看，未来已经变成了过去。照片里的同学们，有些已经叫不出名字了，但那天阳光很好，大家都年轻，那是最好的时光。',
    imageKey: 'memory_album_old_classmates', // v6.0: 老同学合影新图，替代聊天→毕业照的突兀触发
    triggerAction: '__album__',
    source: 'album',
  },
  memory_work_badge: {
    id: 'memory_work_badge',
    title: '工作证件',
    description: '抽屉深处那张泛黄的工作证，上面贴着你年轻时的照片。',
    memoryText: '工作证上的照片，是你二十多岁的时候拍的。那时候刚进厂，每天骑自行车上班，风雨无阻。车间里机油的味道、同事们的说笑声、食堂的红烧肉——那些辛苦但充实的日子，铺成了你一生的路。',
    imageKey: 'memory_work_badge',
    triggerAction: '__album__',
    source: 'album',
  },
  memory_first_trip: {
    id: 'memory_first_trip',
    title: '第一次远行',
    description: '旧车票压在相册里，旁边那张照片，是你们第一次坐绿皮火车去远方。',
    memoryText: '火车在山间慢慢开，窗外是河、桥和一座座小站。你拎着旧皮箱，站在站台上挥了很久。那时候远方还很远，车票也舍不得丢。后来走过许多路，但第一次出发时的心跳，一直留在这张票根里。',
    imageKey: 'memory_album_train_ticket',
    triggerAction: '__album__',
    source: 'album',
  },
  memory_home_reunion: {
    id: 'memory_home_reunion',
    title: '回家团聚',
    description: '春节回家，推开门的瞬间，屋子里都是熟悉的味道。',
    memoryText: '桌上摆满了你爱吃的菜。孩子们长高了，长辈和小辈挤在一桌。电视里放着春晚，但没人认真看——大家都在聊天，笑声把电视声盖住了。团圆这件事，年轻时不觉得珍贵，老了才知道那是最大的福气。',
    imageKey: 'memory_album_new_year_dinner', // v6.0: 年夜饭新图，强化节日语境
    triggerAction: '__album__',
    source: 'album',
  },
  memory_birthday_cake: {
    id: 'memory_birthday_cake',
    title: '养老院里的生日',
    description: '蛋糕不大，蜡烛也不多，但护工和其他老人都围过来认真地为你唱了生日歌。',
    memoryText: '你原本以为这个生日会很安静。护工把蛋糕端上来，旁边的老人也围了过来。蜡烛亮起的时候，房间忽然暖了。被人记得，不一定要多热闹——只要有人愿意停下来，陪你过这一小会儿。',
    imageKey: 'memory_birthday_cake',
    triggerAction: '__album__',
    source: 'album',
  },

  // ══════════════════════════════════════
  // 行为碎片（source='action'，特定动作直接触发）
  // ══════════════════════════════════════

  memory_old_radio: {
    id: 'memory_old_radio',
    title: '旧收音机',
    description: '那台老收音机，陪了你大半辈子。调频的旋钮都磨光滑了。',
    memoryText: '每天傍晚，拧开收音机，新闻和天气预报准时响起。有时候是评书，有时候是戏曲。老伴在厨房炒菜，油锅滋滋响，收音机里的声音和炒菜声混在一起——那是家的声音。收音机早就不响了，但那声音还常常在耳边绕。',
    imageKey: 'memory_old_radio',
    triggerAction: 'hear_old_song',
    source: 'action',
  },
  memory_flower_time: {
    id: 'memory_flower_time',
    title: '种花时光',
    description: '阳台上的花开了，是你和老伴一起种下的。',
    memoryText: '老伴喜欢茉莉，你喜欢月季。浇水、施肥、修剪，每天都有做不完的小事。花开的时候，老伴会摘一朵别在衣襟上，然后问你"好看吗"。后来阳台上的花也谢了，但每次闻到花香，都会想起低头嗅花的样子。',
    imageKey: 'memory_flower_time',
    triggerAction: 'admire_flowers',
    source: 'action',
    triggerRules: [
      { actionId: 'admire_flowers', priority: 30 },
      { actionId: 'sit_pavilion', requireActions: ['admire_flowers'], priority: 25 },
    ],
  },
  memory_calligraphy: {
    id: 'memory_calligraphy',
    title: '书法作品',
    description: '退休以后开始练书法，一笔一划，写的是字，练的是心。',
    memoryText: '每天早饭后铺开宣纸，研墨、蘸笔、落笔。有时候写"家和万事兴"，有时候写"宁静致远"。墨香在房间里弥漫开来，窗外的鸟叫声和笔尖的沙沙声交织在一起。写字的时候，时间过得很慢，但心里很安静。',
    imageKey: 'memory_calligraphy',
    triggerAction: 'do_craft',
    source: 'action',
  },

  // ══════════════════════════════════════
  // 组合碎片（source='combo'，需条件组合触发）
  // ══════════════════════════════════════

  memory_osmanthus: {
    id: 'memory_osmanthus',
    title: '桂花树下的合照',
    description: '家门口那棵桂花树，每年秋天都开满金黄的小花。树下拍过无数张照片。',
    memoryText: '那年你和老伴坐在桂花树下，孩子们站在身后，谁都说再靠近一点。桂花落在肩头，香气很淡，却留了很多年。后来人各有各的远方，树还在原地开花。每次闻到桂花香，你都像又坐回了那张旧凳子。',
    imageKey: 'memory_osmanthus',
    triggerAction: 'admire_flowers',
    source: 'combo',
    triggerRules: [
      {
        actionId: 'garden_walk',
        requireActions: ['admire_flowers'],
        priority: 15,
      },
      {
        actionId: 'garden_walk',
        requireActions: ['sit_pavilion'],
        priority: 12,
      },
      {
        actionId: 'admire_flowers',
        requireActions: ['garden_walk'],
        priority: 10,
      },
    ],
  },
  memory_family_visit: {
    id: 'memory_family_visit',
    title: '家人来探望的午后',
    description: '那个周末，孩子们都来了。虽然只是坐了一个下午，但房间里的笑声很久没有散。',
    memoryText: '小辈把小熊塞进你怀里，说这是送给你的礼物。孩子们带来了水果，问你饭吃得好不好、晚上睡得踏不踏实。茶喝了一杯又一杯，谁都不舍得先走。门关上的时候，房间忽然安静下来，但桌上的果香还留着。',
    imageKey: 'memory_family_visit',
    triggerAction: 'call_family',
    source: 'combo',
    triggerRules: [
      {
        actionId: 'call_family',
        requireActions: ['talk_caregiver'],
        priority: 20,
      },
      {
        actionId: 'call_family',
        requireActions: ['read_board'],
        priority: 18,
      },
    ],
  },
  memory_old_dance: {
    id: 'memory_old_dance',
    title: '年轻时跳舞的旧时光',
    description: '收音机里的老歌一响，你就想起了那个舞厅。灯光很暗，但舞伴的笑容很亮。',
    memoryText: '那时候你和舞伴在舞厅里转了一圈又一圈。裙摆飞起来，像一朵盛开的花。你踩了舞伴好几脚，但舞伴一直笑着。后来那个舞厅拆了，但旋律还在你的脑海里，一直没有停。',
    imageKey: 'memory_old_dance',
    triggerAction: 'hear_old_song',
    source: 'combo',
    triggerRules: [
      {
        actionId: 'hear_old_song',
        requireActions: ['watch_tv'],
        priority: 10,
      },
    ],
  },
  memory_phone_call: {
    id: 'memory_phone_call',
    title: '一通接通的电话',
    description: '电话响了很久，你以为没人接了——然后那头传来一声"喂"。',
    memoryText: '"是我。"仅仅两个字，你就觉得今天没有白过。电话那头能听到孩子在背景里喊着。你握着话筒，好像握着他们的手。距离很远，但声音很近。',
    imageKey: 'memory_phone_call',
    triggerAction: 'call_family',
    source: 'combo',
    triggerRules: [
      // 主动拨打 + 坐过电话角椅子
      {
        actionId: 'call_family',
        requireActions: ['phone_chair'],
        priority: 10,
      },
      // v6.3-v3: 接起家人来电 + 在电话角
      {
        actionId: 'call_family',
        requireActions: ['answer_incoming_call'],
        priority: 8,
        fallbackText: '',
      },
      // v6.3-v3: 接起家人来电 + 看过亲情板
      {
        actionId: 'read_board',
        requireActions: ['answer_incoming_call'],
        priority: 7,
        fallbackText: '',
      },
    ],
  },
  memory_scarf: {
    id: 'memory_scarf',
    title: '老伴留下的围巾',
    description: '衣柜最里面那条旧围巾，是老伴亲手织的。现在摸起来，好像还有那时的温度。',
    memoryText: '那年冬天特别冷，每天晚上坐在灯下织围巾。你说不用这么辛苦，却说"不辛苦，你戴着就不冷了"。围巾现在有些脱线了，但你没舍得扔。因为那是留给你的最后一个冬天。',
    imageKey: 'memory_scarf',
    triggerAction: 'do_craft',
    source: 'combo',
    triggerRules: [
      {
        actionId: 'do_craft',
        requireActions: ['look_album'],
        priority: 10,
      },
    ],
  },

  // ══════════════════════════════════════
  // 偶遇碎片（source='event'，随机事件/时间地点触发）
  // ══════════════════════════════════════

  memory_festival_lantern: {
    id: 'memory_festival_lantern',
    title: '节日灯笼',
    description: '过年的时候，家家户户挂起红灯笼。整条街都亮堂堂的。',
    memoryText: '除夕夜，你搬着梯子，孩子们在下面扶。灯笼一个一个挂上去，红光照亮了整条小巷。鞭炮声噼里啪啦，空气里有火药味和饺子的香气。那样的年味儿，现在越来越淡了，但在记忆里，灯笼永远亮着。',
    imageKey: 'memory_festival_lantern',
    triggerAction: 'turn_on_lamp',
    source: 'event',
    triggerRules: [
      {
        actionId: 'turn_on_lamp',
        timeConstraint: { startHour: 19, endHour: 24 },
        priority: 10,
      },
    ],
  },
  memory_old_house: {
    id: 'memory_old_house',
    title: '老房子',
    description: '那间住了几十年的老房子，楼梯咯吱咯吱响，但每一步都踏实。',
    memoryText: '老房子的厨房很小，但香味能飘满整栋楼。阳台上的花是和老伴一起种的，春天开得热热闹闹的。搬走那天，你在每个房间站了很久。房子空了，但那些在里面过的日子，永远装在心里。',
    imageKey: 'memory_old_house',
    triggerAction: 'garden_walk',
    source: 'event',
    triggerRules: [
      {
        actionId: 'garden_walk',
        requireActions: ['admire_flowers'],
        priority: 8,
      },
      {
        actionId: 'admire_flowers',
        requireFragments: ['memory_flower_time'],
        priority: 10,
      },
    ],
  },

  // ══════════════════════════════════════
  // v6.3 新增展开回忆碎片（source='combo'）
  // 根目录旧图转为完整回忆场景，需组合条件触发
  // ══════════════════════════════════════

  memory_home_reunion_scene: {
    id: 'memory_home_reunion_scene',
    title: '家门口的团聚',
    description: '那一天，孩子们真的回来了。',
    memoryText: '门一开，屋子里一下子热闹起来。你记得孩子扑过来的重量，也记得饭桌上谁都舍不得先放下筷子。',
    imageKey: 'memory_home_reunion_scene',
    triggerAction: 'call_family',
    source: 'combo',
    triggerRules: [
      {
        actionId: 'call_family',
        requireActions: ['read_board'],
        requireLocations: ['phone'],
        requireFragments: ['memory_home_reunion'],
        priority: 92,
      },
      {
        actionId: 'eat_dinner',
        requireActions: ['call_family'],
        requireFragments: ['memory_home_reunion'],
        priority: 86,
      },
    ],
  },
  memory_first_trip_scene: {
    id: 'memory_first_trip_scene',
    title: '远行的站台',
    description: '第一次坐上火车去远方。',
    memoryText: '绿皮火车慢慢开动，你站在站台上挥了很久。那时候远方很远，可牵着手，就觉得哪儿都能去。',
    imageKey: 'memory_first_trip_scene',
    triggerAction: 'exercise_bike',
    source: 'combo',
    triggerRules: [
      {
        actionId: 'garden_walk',
        requireActions: ['look_album'],
        requireFragments: ['memory_first_trip'],
        requireLocations: ['garden'],
        priority: 72,
      },
      {
        actionId: 'look_album',
        requireFragments: ['memory_first_trip'],
        priority: 65,
      },
    ],
  },
  memory_graduation_photo_scene: {
    id: 'memory_graduation_photo_scene',
    title: '照片里的同学',
    description: '那张合影里，每个人都还年轻。',
    memoryText: '照片里的人站得整整齐齐，你忽然想起谁总爱迟到，谁唱歌最好听。名字有些模糊了，笑脸却还在。',
    imageKey: 'memory_graduation_photo_scene',
    triggerAction: 'chat_friend',
    source: 'combo',
    triggerRules: [
      {
        actionId: 'chat_friend',
        requireActions: ['look_album'],
        requireFragments: ['memory_graduation_photo'],
        requireLocations: ['activity'],
        priority: 82,
      },
    ],
  },
};

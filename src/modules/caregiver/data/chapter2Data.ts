/**
 * Chapter 2 ending configuration.
 *
 * The old scheduling-task data was removed after the chapter moved to the
 * linear event flow. This file now only keeps the ending data consumed by
 * summaryRules.ts.
 */

export interface EndingConfig {
  level: 'excellent' | 'good' | 'average' | 'struggling';
  label: string;
  minUnderstandingRatio: number;
  narrative: string[];
  nextChapterHint: string;
}

export const CHAPTER2_ENDINGS: EndingConfig[] = [
  {
    level: 'excellent',
    label: '真正懂了',
    minUnderstandingRatio: 0.75,
    narrative: [
      '你不只是完成了护理事件。',
      '你读懂了那些没说出口的话。',
      '交接记录里，名字后面终于不再只是冰冷的数字。',
    ],
    nextChapterHint:
      '你写下的不是完成率，而是王奶奶看不清药盒、李爷爷需要更安全的走廊、陈阿姨在等家人的消息。被看见本身，就是改变的第一步。',
  },
  {
    level: 'good',
    label: '开始懂了',
    minUnderstandingRatio: 0.5,
    narrative: [
      '你完成了一部分事件，也理解了一部分老人。',
      '有些话你听懂了，有些你隐约感觉到了。',
      '还有一些空白，留给下一次更慢一点的观察。',
    ],
    nextChapterHint:
      '你的交接记录里开始有了温度，也仍有空白。愿意理解的这个上午，已经和昨天不一样了。',
  },
  {
    level: 'average',
    label: '尽力了',
    minUnderstandingRatio: 0.25,
    narrative: [
      '你尽力完成了手头的事情。',
      '但那些没说出口的话、没被看见的事，也许只能等明天了。',
    ],
    nextChapterHint:
      '你记录了不少表面信息。"协助进食"四个字背后，是她说了三次"不用管我"。',
  },
  {
    level: 'struggling',
    label: '仅仅做完了',
    minUnderstandingRatio: 0,
    narrative: [
      '你把事件处理完了。',
      '仅此而已。',
      '每一个名字后面的故事，仍然是一片空白。',
    ],
    nextChapterHint:
      '你的交接记录上只有完成情况。但每一个“完成”下面，都可能藏着一个“还没被看见”。',
  },
];

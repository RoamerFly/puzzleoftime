/* === 老人视角模块：拼图数据 === */

export interface PhotoConfig {
  id: number;
  title: string;
  imageUrl: string;
  rows: number;
  cols: number;
  description: string;
}

export const PUZZLE_PHOTOS: PhotoConfig[] = [
  {
    id: 0,
    title: '全家团聚的年夜饭',
    imageUrl: '/assets/images/photo-elderly/family-dinner.png',
    rows: 3,
    cols: 3,
    description: '那年除夕，孩子们都回来了。桌上是老伴的红烧肉，小辈抢着夹菜，笑得前仰后合。你坐在中间，觉得自己是世界上最幸福的人。',
  },
];

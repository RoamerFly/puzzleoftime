/**
 * Clue state helper — 从 SceneHotspotLayer 提取以支持 Fast Refresh
 */

export type HotspotClueState = 'unseen' | 'recorded';

export function getClueState(
  clueId: string,
  recordedIds: string[],
): HotspotClueState {
  if (recordedIds.includes(clueId)) return 'recorded';
  return 'unseen';
}

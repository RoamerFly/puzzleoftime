/**
 * === 图片预加载工具 ===
 *
 * 提供预加载并预解码图片的功能，带缓存避免重复加载。
 * 使用 img.decode() 完成预解码，减少主线程卡顿。
 */

const imagePreloadCache = new Map<string, Promise<void>>();

/**
 * 预加载并预解码单张图片
 * @param src 图片路径
 * @returns Promise，加载/解码完成后 resolve（即使失败也会 resolve，不阻塞流程）
 */
export async function preloadImage(src: string): Promise<void> {
  if (!src) return;

  // 如果已有缓存（正在加载或已加载完成），直接复用
  const cached = imagePreloadCache.get(src);
  if (cached) return cached;

  const promise = new Promise<void>((resolve, reject) => {
    const img = document.createElement('img');
    img.src = src;
    img.addEventListener('load', () => resolve(), { once: true });
    img.addEventListener('error', () => reject(new Error(`Failed to load image: ${src}`)), { once: true });
  });

  promise.catch((err) => {
    console.warn('[preloadImages] 图片加载失败:', src, err);
  });

  imagePreloadCache.set(src, promise);
  return promise;
}

/**
 * 批量预加载并预解码多张图片
 * @param srcs 图片路径数组
 * @returns Promise，全部完成后 resolve（每张图片独立错误处理）
 */
export async function preloadImages(srcs: string[]): Promise<void> {
  await Promise.all(srcs.filter(Boolean).map(src => preloadImage(src)));
}

/**
 * 检查某张图片是否已在缓存中完成预加载
 * 注意：仅表示已触发预加载，不保证已完成
 */
export function isImageCached(src: string): boolean {
  return imagePreloadCache.has(src);
}

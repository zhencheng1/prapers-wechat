/**
 * 顶部固定栏高度（px）。
 * H5 端由 StatusBar 组件模拟一条 44px 状态栏，小程序端取真实状态栏高度。
 * 用于让固定导航栏 / sticky 标题头精确吸附在状态栏下方。
 */
export function getStatusBarHeight(): number {
  // #ifdef H5
  return 44
  // #endif
  // #ifndef H5
  try {
    return uni.getSystemInfoSync().statusBarHeight || 20
  } catch {
    return 20
  }
  // #endif
}

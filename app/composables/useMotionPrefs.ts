/* 全局动效偏好判定（客户端单例） */
export function useMotionPrefs() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const isTouch = window.matchMedia('(hover: none)').matches
  const isSmall = window.innerWidth <= 900
  return { reduceMotion, isTouch, isSmall }
}

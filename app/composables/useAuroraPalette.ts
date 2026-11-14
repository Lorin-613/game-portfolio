/* AuroraBackground 与章节场景之间的调色板桥（模块级单例） */
type Setter = (index: number) => void
let setter: Setter | null = null

export function useAuroraPalette() {
  return {
    register(fn: Setter) { setter = fn },
    set(index: number) { if (setter) setter(index) }
  }
}

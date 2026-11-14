<script setup lang="ts">
/* ═══ 统一 rAF：分层指针视差(.px) + 流体光标精灵 + 磁吸(data-magnet) ═══
   单一循环唯一写入者；Matter 物理接管中的元素(data-physics)自动跳过 */
const { $gsap } = useNuxtApp() as any
const { reduceMotion, isTouch } = useMotionPrefs()
const sfx = useSoundscape()
const fairy = ref<HTMLElement | null>(null)

let raf = 0
const cleanups: (() => void)[] = []

onMounted(async () => {
  if (reduceMotion || isTouch) return
  await nextTick()

  const pxEls = Array.from(document.querySelectorAll<HTMLElement>('.px')).map(el => ({
    el, d: parseFloat(el.dataset.depth || '0.05'), x: 0, y: 0
  }))

  let mx = 0, my = 0, tx = innerWidth / 2, ty = innerHeight / 2
  let fx = tx, fy = ty, prevFx = fx, prevFy = fy
  let pullX = 0, pullY = 0, lastMove = 0
  let hotFrame: HTMLElement | null = null, hotRect: DOMRect | null = null
  let lastAir = 0
  const f = fairy.value!

  const onMove = (e: MouseEvent) => {
    mx = (e.clientX / innerWidth - 0.5) * 2
    my = (e.clientY / innerHeight - 0.5) * 2
    tx = e.clientX; ty = e.clientY; lastMove = performance.now()
    if (!f.classList.contains('ready')) f.classList.add('ready')
    /* 热区（事件委托）：贴近可交互元素时放大，并给一声轻触音 */
    const t = e.target as HTMLElement
    const wasHot = f.classList.contains('hot')
    const isHot = !!(t?.closest?.('a,button,.g-frame,.choice,.tag-pill,.charm,[data-magnet]'))
    if (isHot && !wasHot) sfx.tick()
    f.classList.toggle('hot', isHot)
    /* 靠近画廊插画时产生微弱引力：光标被拉向卡片中心 */
    const frame = t?.closest?.('.g-frame') as HTMLElement | null
    if (frame) {
      if (frame !== hotFrame) { hotFrame = frame; hotRect = frame.getBoundingClientRect() }
      if (hotRect) {
        const cx = hotRect.left + hotRect.width / 2, cy = hotRect.top + hotRect.height / 2
        const dx = cx - tx, dy = cy - ty
        const d = Math.sqrt(dx * dx + dy * dy) || 1
        const pull = Math.min(13, 240 / d)
        pullX = (dx / d) * pull; pullY = (dy / d) * pull
      }
    } else { hotFrame = null; pullX = 0; pullY = 0 }
  }
  const onLeave = () => f.classList.remove('ready')
  document.addEventListener('mousemove', onMove, { passive: true })
  document.addEventListener('mouseleave', onLeave)
  cleanups.push(() => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseleave', onLeave)
  })

  const loop = () => {
    /* 分层指针视差：远/中/近不同幅度；物理接管或已卸载的元素跳过 */
    for (const s of pxEls) {
      if (s.el.dataset.physics === '1' || !s.el.isConnected) continue
      s.x += (mx * s.d * 62 - s.x) * 0.055
      s.y += (my * s.d * 40 - s.y) * 0.055
      s.el.style.transform = `translate3d(${s.x.toFixed(2)}px,${s.y.toFixed(2)}px,0)`
    }
    /* 流体光标：x/y 不同缓动系数 → 液态拖尾；速度驱动拉伸与旋转 */
    fx += (tx - fx) * 0.10
    fy += (ty - fy) * 0.17
    const vx = fx - prevFx, vy = fy - prevFy
    prevFx = fx; prevFy = fy
    const sp = Math.min(1, Math.sqrt(vx * vx + vy * vy) / 24)
    const rot = Math.max(-18, Math.min(18, Math.atan2(vy, vx) * 57.2958 * 0.16))
    const sx = 1 + sp * 0.30, sy = 1 - sp * 0.16
    f.style.transform =
      `translate3d(${(fx + pullX).toFixed(1)}px,${(fy + pullY).toFixed(1)}px,0) ` +
      `translate(-50%,-50%) rotate(${rot.toFixed(1)}deg) scale(${sx.toFixed(3)},${sy.toFixed(3)})`
    f.classList.toggle('idle', performance.now() - lastMove > 1400)
    /* 指针移动的空气音：与光标拖尾同一速度源，节流到 ~12 次/秒 */
    const now = performance.now()
    if (now - lastAir > 80) { sfx.air(sp); lastAir = now }
    raf = requestAnimationFrame(loop)
  }
  loop()

  /* 磁吸（transform 归 GSAP quickTo） */
  if ($gsap) {
    document.querySelectorAll<HTMLElement>('[data-magnet]').forEach(el => {
      const xTo = $gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' })
      const yTo = $gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' })
      const mm = (e: MouseEvent) => {
        const r = el.getBoundingClientRect()
        xTo(((e.clientX - (r.left + r.width / 2)) / r.width) * 10)
        yTo(((e.clientY - (r.top + r.height / 2)) / r.height) * 10)
      }
      const ml = () => { xTo(0); yTo(0) }
      el.addEventListener('mousemove', mm)
      el.addEventListener('mouseleave', ml)
      cleanups.push(() => { el.removeEventListener('mousemove', mm); el.removeEventListener('mouseleave', ml) })
    })
  }
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  cleanups.forEach(fn => fn())
})
</script>

<template>
  <div id="cursorFairy" ref="fairy" class="cursor-fairy" aria-hidden="true">
    <img src="/img/fairy_normal.png" alt="" />
  </div>
</template>

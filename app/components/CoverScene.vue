<script setup lang="ts">
/* ═══ COVER 封面进入页（游戏真实标题画面） ═══
   cover_title.png 作为封面主视觉（图中已含 YONGKOKU 标志与 Begin Journey 按钮），
   叠加 2.5D mesh 视差 + 按钮热区 + 可点击物理装饰 + 圆形幕帘转场 */
const { $gsap, $st, $lenis } = useNuxtApp() as any
const { reduceMotion } = useMotionPrefs()
const { set: setPalette } = useAuroraPalette()
const sfx = useSoundscape()

const frame = ref<HTMLElement | null>(null)
const veil = ref<HTMLElement | null>(null)
const cta = ref<HTMLButtonElement | null>(null)

onMounted(() => {
  if (reduceMotion || !$gsap || !$st) return
  /* 滚离封面时柔和淡出 */
  $gsap.to(frame.value, {
    yPercent: -10, opacity: 0.25, ease: 'none',
    scrollTrigger: { trigger: '#cover', start: 'top top', end: 'bottom top', scrub: true }
  })
  /* 回到封面时恢复封面调色板 */
  $st.create({
    trigger: '#cover', start: 'top 55%', end: 'bottom 45%',
    onToggle: (self: any) => { if (self.isActive) setPalette(0) }
  })
})

/* 开场编排（preloader 结束后由 index.vue 调用） */
function intro() {
  sfx.chime(0, 0.07)
  if (reduceMotion || !$gsap) return
  const tl = $gsap.timeline({ defaults: { ease: 'power4.out' } })
  tl.fromTo(frame.value,
    { clipPath: 'inset(0% 0% 100% 0% round 46px)', scale: 0.965 },
    { clipPath: 'inset(0% 0% 0% 0% round 46px)', scale: 1, duration: 1.5, ease: 'power4.inOut' }, 0.15)
    .fromTo('.cover-cta-hotspot', { opacity: 0 }, { opacity: 1, duration: 0.9 }, 1.15)
    .fromTo('.cover .symbol.charm', { opacity: 0, scale: 0.5 }, {
      opacity: 1, scale: 1, duration: 0.8, stagger: 0.08, ease: 'back.out(1.7)',
      onComplete: () => $gsap.set('.cover .symbol.charm', { clearProps: 'opacity,transform' })
    }, 1.0)
    .fromTo('.cover-hint', { opacity: 0 }, { opacity: 1, duration: 0.8 }, 1.4)
}
defineExpose({ intro })

/* 「Begin Journey」：圆形幕帘从按钮处展开 → 瞬移至章节 → 幕帘收起 */
let veiling = false
function enter(e: MouseEvent) {
  const target = document.querySelector('#chapters') as HTMLElement | null
  if (!target) return
  sfx.swell()
  if (reduceMotion || !$gsap) {
    if ($lenis) $lenis.scrollTo(target, { offset: -90 })
    else target.scrollIntoView({ behavior: 'smooth' })
    return
  }
  if (veiling) return
  veiling = true
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const x = e.clientX || r.left + r.width / 2
  const y = e.clientY || r.top + r.height / 2
  $gsap.timeline({ onComplete: () => { veiling = false } })
    .set(veil.value, { clipPath: `circle(0% at ${x}px ${y}px)`, opacity: 1 })
    .to(veil.value, { clipPath: `circle(142% at ${x}px ${y}px)`, duration: 0.8, ease: 'power3.in' })
    .add(() => {
      if ($lenis) $lenis.scrollTo(target, { offset: -90, immediate: true })
      else target.scrollIntoView()
    })
    .to(veil.value, { clipPath: 'circle(0% at 50% 42%)', duration: 0.9, ease: 'power3.out' }, '+=0.18')
    .set(veil.value, { opacity: 0 })
}
</script>

<template>
  <section id="cover" class="cover">
    <h1 class="sr-only">YONGKOKU — Begin Journey</h1>

    <div class="cover-stage">
      <div ref="frame" class="cover-frame">
        <CoverParallaxGL src="/img/cover_title.png" />

        <!-- 图中「Begin Journey」按钮位置的热区：视觉按钮在图里，可点区域在此 -->
        <button
          ref="cta"
          class="cover-cta-hotspot"
          aria-label="Begin the Journey"
          data-magnet
          @click="enter"
          @mouseenter="sfx.tick()"
        >
          <span class="cta-halo" aria-hidden="true"></span>
        </button>
      </div>
    </div>

    <!-- 环境装饰：可点击掉落弹跳的物理小物 -->
    <PhysicsCharm class="charm-a" :depth="0.09" size="lg">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.2 6.6.9-4.9 4.7 1.3 6.7L12 17.2 6.1 20.5l1.3-6.7L2.5 9.1l6.6-.9L12 2z"/></svg>
    </PhysicsCharm>
    <PhysicsCharm class="charm-b" :depth="0.05" size="md">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.9-10-9.6C.4 8.5 2.2 4.5 6 4.5c2.2 0 3.6 1.2 4.5 2.6.9-1.4 2.3-2.6 4.5-2.6 3.8 0 5.6 4 4 6.9C19.5 16.1 12 21 12 21z"/></svg>
    </PhysicsCharm>
    <PhysicsCharm class="charm-c" :depth="0.07" size="md">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="4" y="9" width="16" height="11" rx="2"/><rect x="2.5" y="5" width="19" height="4" rx="1.5"/><path d="M12 5v15M12 5c-1.6-3.2-5.5-3.2-5.5-1.2S8.8 6 12 5zm0 0c1.6-3.2 5.5-3.2 5.5-1.2S15.2 6 12 5z"/></svg>
    </PhysicsCharm>
    <PhysicsCharm class="charm-d" :depth="0.1" size="sm">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1.5l2.1 7.4 7.4 2.1-7.4 2.1L12 20.5l-2.1-7.4-7.4-2.1 7.4-2.1L12 1.5z"/></svg>
    </PhysicsCharm>

    <p class="cover-hint">Click to begin · Scroll to explore</p>
    <div ref="veil" class="veil" aria-hidden="true"></div>
  </section>
</template>

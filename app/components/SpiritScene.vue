<script setup lang="ts">
/* ═══ SPIRIT 角色场景（自 legacy 平移） ═══
   sticky pin 时间线 + 轨道物理符号 + Lulu 指针跟随（写入内层 img，transform 分层互不冲突） */
const { $gsap, $st } = useNuxtApp() as any
const { reduceMotion, isTouch } = useMotionPrefs()
const { set: setPalette } = useAuroraPalette()
const sfx = useSoundscape()

const stage = ref<HTMLElement | null>(null)
const img = ref<HTMLImageElement | null>(null)
let raf = 0

onMounted(() => {
  if (reduceMotion || !$gsap || !$st) return

  $st.create({
    trigger: '#spirit', start: 'top 55%', end: 'bottom 45%',
    onToggle: (self: any) => {
      if (!self.isActive) return
      setPalette(6)
      sfx.chime(5, 0.06)
    }
  })

  const mm = $gsap.matchMedia()
  mm.add('(min-width: 901px)', () => {
    const tl = $gsap.timeline({
      scrollTrigger: { trigger: '#spiritStageSec', start: 'top top', end: '+=1200', pin: true, scrub: 0.6 }
    })
    tl.fromTo('.spirit-disc', { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 1, ease: 'power2.out' }, 0)
      .fromTo('#spiritImg', { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }, 0.15)
      .fromTo('.spirit-orbit .symbol', { opacity: 0 }, { opacity: 1, stagger: 0.12, duration: 0.7 }, 0.4)
      .to({}, { duration: 0.6 }) /* 停留呼吸 */
  })

  /* Lulu 指针跟随：写入内层 img（外层漂浮归 CSS，滚动归 GSAP） */
  if (!isTouch && stage.value && img.value) {
    let sTx = 0, sTy = 0, sX = 0, sY = 0
    const st = stage.value, im = img.value
    st.addEventListener('mousemove', (e: MouseEvent) => {
      const r = st.getBoundingClientRect()
      sTx = ((e.clientX - r.left) / r.width - 0.5) * 22
      sTy = ((e.clientY - r.top) / r.height - 0.5) * 14
    })
    st.addEventListener('mouseleave', () => { sTx = 0; sTy = 0 })
    const loop = () => {
      sX += (sTx - sX) * 0.07
      sY += (sTy - sY) * 0.07
      im.style.transform = `translate3d(${sX.toFixed(2)}px,${sY.toFixed(2)}px,0)`
      raf = requestAnimationFrame(loop)
    }
    loop()
  }
})

onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <section id="spirit">
    <div id="spiritStageSec" class="spirit-stage-sec">
      <div class="wrap">
        <p class="eyebrow rv">Guide Spirit</p>
        <h2 class="title mask-title">Lulu</h2>
        <div class="spirit-grid" style="margin-top:2.5rem">
          <div ref="stage" id="spiritStage" class="spirit-stage">
            <div class="spirit-disc"></div>
            <div class="spirit-orbit">
              <PhysicsCharm :depth="0.10" size="sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><path d="M12 2 L13 9 L20 10 L13 11 L12 18 L11 11 L4 10 L11 9 Z"/></svg>
              </PhysicsCharm>
              <PhysicsCharm :depth="0.14" size="md">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M12 20 C12 20 4 14 4 9 C4 6 6 4 8.5 4 C10 4 11 5 12 6.5 C13 5 14 4 15.5 4 C18 4 20 6 20 9 C20 14 12 20 12 20 Z"/></svg>
              </PhysicsCharm>
              <PhysicsCharm :depth="0.08" size="sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><path d="M4 20 L12 4 L20 20 Z"/><line x1="8" y1="14" x2="16" y2="14"/></svg>
              </PhysicsCharm>
              <PhysicsCharm :depth="0.12" size="md">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 16 L14 10"/><path d="M14 10 L16 8"/><path d="M14 16 L16 16"/></svg>
              </PhysicsCharm>
            </div>
            <div id="spiritImg" class="spirit-img">
              <div class="spirit-float">
                <img ref="img" src="/img/fairy_normal.png" alt="Lulu guide spirit" />
              </div>
            </div>
          </div>
          <div class="spirit-copy rv">
            <h3>Lulu</h3>
            <p class="role">Guide Spirit · YONGKOKU World</p>
            <p>Always nearby, never intrusive — a quiet companion at every crossroads.</p>
            <div class="tags">
              <span class="tag-pill" data-magnet>Narrative guide</span>
              <span class="tag-pill" data-magnet>Emotional comfort</span>
              <span class="tag-pill" data-magnet>Growth witness</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

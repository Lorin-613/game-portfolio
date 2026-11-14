<script setup lang="ts">
/* ═══ 参数化章节场景：章节号+遮罩标题+文案+概念图主视觉(幕帘)+前层小卡(视差) ═══
   进入视窗时切换全局极光调色板 */
const props = defineProps<{
  num: string
  title: string
  copy: string
  concept: string
  card: string
  cardAlt: string
  theme: 'carnival' | 'office' | 'snow' | 'forest'
  palette: number
  flip?: boolean
}>()

const { $gsap, $st } = useNuxtApp() as any
const { reduceMotion } = useMotionPrefs()
const { set: setPalette } = useAuroraPalette()
const sfx = useSoundscape()
const root = ref<HTMLElement | null>(null)

onMounted(() => {
  const el = root.value
  if (!el || !$st) return
  /* 章节在场时切换调色板；非 reduced-motion 时给一声对应音阶的铃音 */
  $st.create({
    trigger: el, start: 'top 55%', end: 'bottom 45%',
    onToggle: (self: any) => {
      if (!self.isActive) return
      setPalette(props.palette)
      if (!reduceMotion) sfx.chime(props.palette - 1, 0.06)
    }
  })
  if (reduceMotion || !$gsap) return
  /* 概念图主视觉：轻微纵深漂移 */
  const art = el.querySelector('.chapter-art img')
  if (art) {
    $gsap.fromTo(art, { yPercent: 3 }, {
      yPercent: -3, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
    })
  }
  /* 前层小卡：反向缓移 */
  const card = el.querySelector('.chapter-card')
  if (card) {
    $gsap.fromTo(card, { y: 60 }, {
      y: -60, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
    })
  }
})
</script>

<template>
  <section ref="root" class="chapter" :data-theme="theme" :class="{ flip }">
    <ChapterBackdrop :theme="theme" />
    <div class="wrap chapter-inner">
      <div class="chapter-head">
        <p class="eyebrow rv">Chapter {{ num }}</p>
        <h2 class="title mask-title">{{ title }}</h2>
        <p class="lead rv">{{ copy }}</p>
      </div>
      <div class="chapter-stage">
        <div class="chapter-art wipe">
          <img :src="concept" :alt="title" loading="lazy" />
        </div>
        <div class="chapter-card px" data-depth="0.07">
          <img :src="card" :alt="cardAlt" loading="lazy" />
        </div>
      </div>
    </div>
  </section>
</template>

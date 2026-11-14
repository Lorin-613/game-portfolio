<script setup lang="ts">
/* ═══ Youngkoku 单页滚动旅程 ═══
   Preloader → Cover(2.5D 封面) → Chapters×4 → Gallery → Spirit → Experience → Footer
   统一 GSAP+ScrollTrigger 时间线；所有场景常挂 DOM（preloader 仅遮罩） */
const { $gsap, $st } = useNuxtApp() as any
const { reduceMotion } = useMotionPrefs()

const coverRef = ref<{ intro: () => void } | null>(null)

const chapters = [
  {
    num: '01', title: 'Dream Carnival', theme: 'carnival' as const, palette: 1,
    copy: 'A carnival that never closes — every ride is a small rehearsal for courage.',
    concept: '/img/page_chapter_concept_1.png',
    card: '/img/page_activity_task.png', cardAlt: 'Activity tasks'
  },
  {
    num: '02', title: 'Gift Office', theme: 'office' as const, palette: 2, flip: true,
    copy: 'Behind every gift is a desk, a stamp, and someone who remembered what you love.',
    concept: '/img/page_chapter_concept_2.png',
    card: '/img/page_mail_notice.png', cardAlt: 'Mail notice'
  },
  {
    num: '03', title: 'Snow Cabin', theme: 'snow' as const, palette: 3,
    copy: 'Snow falls softly outside; inside, every gift waits for the right heart.',
    concept: '/img/page_chapter_concept_3.png',
    card: '/img/page_save_slot.png', cardAlt: 'Save slot'
  },
  {
    num: '04', title: 'Magic Forest', theme: 'forest' as const, palette: 4, flip: true,
    copy: 'A forest where unicorns rest and fountains remember every wish whispered to them.',
    concept: '/img/page_chapter_concept_4.png',
    card: '/img/page_mental_garden.png', cardAlt: 'Mental garden'
  }
]

function onPreloaderFinished() {
  coverRef.value?.intro()
  if ($st) $st.refresh()
}

onMounted(async () => {
  if (reduceMotion || !$gsap || !$st) return
  await nextTick()

  /* 区块标题逐词切分（mask-title → mask-line 结构） */
  document.querySelectorAll<HTMLElement>('.mask-title').forEach(t => {
    const words = (t.textContent || '').trim().split(/\s+/).filter(Boolean)
    t.innerHTML = words.map(w =>
      `<span class="mask-line" style="display:inline-block;margin-right:.26em"><span>${w}</span></span>`
    ).join('')
  })

  /* 通用 reveal：弹性上浮（封面元素由 CoverScene.intro 负责） */
  $gsap.utils.toArray('.rv').forEach((el: any) => {
    if (el.closest('.cover')) return
    $gsap.fromTo(el, { opacity: 0, y: 46, rotation: -1.6, scale: 0.965 }, {
      opacity: 1, y: 0, rotation: 0, scale: 1,
      duration: 1.3, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    })
  })

  /* 标题 mask 揭示：逐词幕帘拉开（y:0 抵消 CSS 预置的 translateY，避免 GSAP 把百分比固化成分像素） */
  document.querySelectorAll<HTMLElement>('.mask-title').forEach(t => {
    $gsap.fromTo(t.querySelectorAll('.mask-line > span'),
      { yPercent: 115, y: 0, rotation: 3, opacity: 0 },
      {
        yPercent: 0, rotation: 0, opacity: 1,
        duration: 1.35, ease: 'expo.out', stagger: 0.09,
        scrollTrigger: { trigger: t, start: 'top 86%', once: true }
      })
  })

  /* 图片幕帘揭示（封面的 cover-frame 由 intro 负责） */
  $gsap.utils.toArray('.wipe').forEach((el: any) => {
    if (el.closest('.cover')) return
    $gsap.to(el, {
      clipPath: 'inset(0% 0% 0% 0% round 4px)', duration: 1.3, ease: 'power4.inOut',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true }
    })
  })
})
</script>

<template>
  <div>
    <div class="scene-wash" aria-hidden="true"></div>
    <AuroraBackground />
    <PreloaderOverlay @finished="onPreloaderFinished" />
    <SiteNav />
    <CursorFairy />

    <main>
      <CoverScene ref="coverRef" />

      <div id="chapters">
        <ChapterScene
          v-for="ch in chapters" :key="ch.num"
          :num="ch.num" :title="ch.title" :copy="ch.copy"
          :concept="ch.concept" :card="ch.card" :card-alt="ch.cardAlt"
          :theme="ch.theme" :palette="ch.palette" :flip="ch.flip"
        />
      </div>

      <WorldGallery />
      <SpiritScene />
      <ExperienceScene />
    </main>

    <footer>YONGKOKU · A gentle narrative world · 2025</footer>
  </div>
</template>

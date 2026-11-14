<script setup lang="ts">
/* ═══ WORLD GALLERY 横向剧场（自 legacy 平移） ═══
   桌面：pin + scrub + containerAnimation 三层视差 + 卷轴幕帘 + 3D 陀螺仪悬停 + 速度 skew
   移动：原生 overflow 横滑 + 普通 reveal */
const { $gsap, $st } = useNuxtApp() as any
const { reduceMotion, isTouch } = useMotionPrefs()
const { set: setPalette } = useAuroraPalette()
const sfx = useSoundscape()

const panels = [
  { src: '/img/login_page.png', name: 'Login' },
  { src: '/img/main_home.png', name: 'Home' },
  { src: '/img/page_chapter_select.png', name: 'Chapters' },
  { src: '/img/page_shop.png', name: 'Shop' },
  { src: '/img/page_science_emotion.png', name: 'Science' },
  { src: '/img/page_end_barrage.png', name: 'Ending' }
]

const pinEl = ref<HTMLElement | null>(null)
const track = ref<HTMLElement | null>(null)
const bar = ref<HTMLElement | null>(null)
const aurora = ref<HTMLElement | null>(null)

onMounted(() => {
  if (reduceMotion || !$gsap || !$st) return
  const root = pinEl.value!

  /* 在场时切换调色板 */
  $st.create({
    trigger: '#gallery', start: 'top 55%', end: 'bottom 45%',
    onToggle: (self: any) => {
      if (!self.isActive) return
      setPalette(5)
      sfx.chime(4, 0.055)
    }
  })

  const mm = $gsap.matchMedia()

  mm.add('(min-width: 901px)', () => {
    const trackEl = track.value!
    const auroraSet = $gsap.quickSetter(aurora.value, 'x', 'px')
    const dist = () => Math.max(0, trackEl.scrollWidth - innerWidth)
    const tween = $gsap.to(trackEl, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: {
        trigger: pinEl.value,
        start: 'top top',
        end: () => '+=' + dist(),
        pin: true,
        scrub: 0.5,
        invalidateOnRefresh: true,
        onUpdate: (self: any) => {
          if (bar.value) bar.value.style.width = (self.progress * 100) + '%'
          auroraSet(-150 + self.progress * 300) /* 背景极光反相缓移 */
        }
      }
    })

    /* 每帧三层视差：卡框 / 编号 / 画心 各走不同速度 */
    root.querySelectorAll('.g-panel').forEach((panel: Element) => {
      const frame = panel.querySelector('.g-frame')!
      const meta = panel.querySelector('.g-meta')!
      const art = panel.querySelector('.g-frame img')!
      const sweep = () => ({
        trigger: panel, containerAnimation: tween,
        start: 'left right', end: 'right left', scrub: true
      })
      $gsap.fromTo(frame, { y: 34, xPercent: 1.5 }, { y: -34, xPercent: -1.5, ease: 'none', scrollTrigger: sweep() })
      $gsap.fromTo(meta, { x: 30, opacity: 0.45 }, { x: -30, opacity: 1, ease: 'none', scrollTrigger: sweep() })
      $gsap.fromTo(art, { yPercent: 1.7 }, { yPercent: -1.7, ease: 'none', scrollTrigger: sweep() })
      /* 入场幕帘：从右侧卷轴拉开 */
      $gsap.fromTo(frame, { clipPath: 'inset(0% 100% 0% 0%)' }, {
        clipPath: 'inset(0% 0% 0% 0%)', ease: 'power3.out',
        scrollTrigger: {
          trigger: panel, containerAnimation: tween,
          start: 'left 98%', end: 'left 60%', scrub: true
        }
      })
    })

    /* 卡片 3D 陀螺仪悬停（透视只作用于卡片局部） */
    if (!isTouch) {
      root.querySelectorAll<HTMLElement>('.g-frame').forEach((frame) => {
        const setRX = $gsap.quickTo(frame, 'rotationX', { duration: 0.55, ease: 'power3.out' })
        const setRY = $gsap.quickTo(frame, 'rotationY', { duration: 0.55, ease: 'power3.out' })
        const setSC = $gsap.quickTo(frame, 'scale', { duration: 0.55, ease: 'power3.out' })
        frame.addEventListener('mouseenter', () => sfx.whoosh(0.8))
        frame.addEventListener('mousemove', (e: MouseEvent) => {
          const r = frame.getBoundingClientRect()
          const nx = (e.clientX - r.left) / r.width - 0.5
          const ny = (e.clientY - r.top) / r.height - 0.5
          setRY(nx * 13)
          setRX(-ny * 11)
          setSC(1.015)
          frame.style.setProperty('--mx', (nx * 100 + 50).toFixed(1) + '%')
          frame.style.setProperty('--my', (ny * 100 + 50).toFixed(1) + '%')
        })
        frame.addEventListener('mouseleave', () => { setRX(0); setRY(0); setSC(1) })
      })
    }
  })

  /* 移动端：面板普通 reveal（横向由原生 overflow 处理） */
  mm.add('(max-width: 900px)', () => {
    root.querySelectorAll('.g-panel').forEach((panel: Element) => {
      $gsap.fromTo(panel, { opacity: 0, y: 50 }, {
        opacity: 1, y: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: panel, start: 'top 88%', once: true }
      })
    })
  })
})
</script>

<template>
  <section id="gallery">
    <div ref="pinEl" class="gallery-pin">
      <div ref="aurora" class="g-aurora" aria-hidden="true"><i></i><i></i><i></i></div>
      <div ref="track" class="gallery-track">
        <div v-for="(p, i) in panels" :key="p.src" class="g-panel">
          <div class="g-frame"><img :src="p.src" :alt="p.name" loading="lazy" /></div>
          <div class="g-meta">
            <span class="g-idx">{{ String(i + 1).padStart(2, '0') }}</span>
            <span class="g-name">{{ p.name }}</span>
          </div>
        </div>
      </div>
      <div class="gallery-progress"><i ref="bar"></i></div>
    </div>
  </section>
</template>

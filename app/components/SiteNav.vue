<script setup lang="ts">
/* ═══ 浮动云朵导航 + 顶部渐变滚动进度条 + 全局锚点滚动(lenis) + --vel 滚动速度 + 音效开关 ═══ */
const { $lenis } = useNuxtApp() as any
const navEl = ref<HTMLElement | null>(null)
const progress = ref<HTMLElement | null>(null)
const sfx = useSoundscape()
const sfxOn = ref(sfx.enabled)

function toggleSound() {
  sfxOn.value = sfx.toggle()
}

const links = [
  { href: '#chapters', label: 'Chapters' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#spirit', label: 'Spirit' },
  { href: '#experience', label: 'Experience' }
]

const cleanups: (() => void)[] = []

onMounted(() => {
  /* 浏览器要求手势后才能出声：首次指针交互解锁音频上下文 */
  const unlock = () => sfx.resume()
  document.addEventListener('pointerdown', unlock, { once: true, passive: true })
  cleanups.push(() => document.removeEventListener('pointerdown', unlock))

  const onState = (scroll: number, limit: number, velocity: number) => {
    navEl.value?.classList.toggle('scrolled', scroll > 50)
    if (progress.value) progress.value.style.width = (limit > 0 ? (scroll / limit) * 100 : 0) + '%'
    const v = Math.max(-6, Math.min(6, velocity || 0))
    document.documentElement.style.setProperty('--vel', v.toFixed(2))
    if (limit > 0) sfx.journey(scroll / limit)
  }
  if ($lenis) {
    const h = (e: any) => onState(e.scroll, e.limit, e.velocity)
    $lenis.on('scroll', h)
    cleanups.push(() => $lenis.off('scroll', h))
  } else {
    const h = () => onState(window.scrollY, document.documentElement.scrollHeight - innerHeight, 0)
    window.addEventListener('scroll', h, { passive: true })
    cleanups.push(() => window.removeEventListener('scroll', h))
  }

  /* 全站锚点滚动（事件委托：封面 CTA 等任何 [data-scroll] 均生效） */
  const onClick = (e: MouseEvent) => {
    const a = (e.target as HTMLElement)?.closest?.('[data-scroll]')
    if (!a) return
    const id = a.getAttribute('href')
    if (!id || id[0] !== '#') return
    const el = document.querySelector(id)
    if (!el) return
    e.preventDefault()
    if ($lenis) $lenis.scrollTo(el as HTMLElement, { offset: -90 })
    else (el as HTMLElement).scrollIntoView({ behavior: 'smooth' })
  }
  document.addEventListener('click', onClick)
  cleanups.push(() => document.removeEventListener('click', onClick))
})

onBeforeUnmount(() => cleanups.forEach(fn => fn()))
</script>

<template>
  <div ref="progress" class="scroll-progress" aria-hidden="true"></div>
  <nav id="nav" ref="navEl" aria-label="Main">
    <a class="nav-brand" href="#cover" data-scroll>YONGKOKU</a>
    <ul class="nav-links">
      <li v-for="l in links" :key="l.href">
        <a :href="l.href" data-scroll @mouseenter="sfx.tick()">{{ l.label }}</a>
      </li>
    </ul>
    <button
      class="sound-toggle"
      :class="{ muted: !sfxOn }"
      :aria-pressed="sfxOn"
      :aria-label="sfxOn ? 'Mute sound' : 'Unmute sound'"
      data-magnet
      @pointerdown.stop
      @click="toggleSound"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 9.5v5h3.2L12 18.5v-13L7.2 9.5H4z"/>
        <path v-if="sfxOn" class="wave" d="M15.5 8.8a4.4 4.4 0 0 1 0 6.4"/>
        <path v-if="sfxOn" class="wave" d="M18 6.2a8 8 0 0 1 0 11.6"/>
        <path v-else d="M16 9.5l5 5M21 9.5l-5 5"/>
      </svg>
      <span class="lbl">{{ sfxOn ? 'Sound' : 'Muted' }}</span>
    </button>
  </nav>
</template>

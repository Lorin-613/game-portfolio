import Lenis from 'lenis'

/* Lenis 接管原生滚动，与 GSAP 时间线联动；reduced-motion 时不接管 */
export default defineNuxtPlugin({
  name: 'lenis',
  dependsOn: ['gsap'],
  setup(nuxtApp) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return { provide: { lenis: null as Lenis | null } }

    const lenis = new Lenis({
      duration: 1.35,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true
    })
    const $app = nuxtApp as any
    if ($app.$gsap && $app.$st) {
      lenis.on('scroll', $app.$st.update)
      $app.$gsap.ticker.add((time: number) => { lenis.raf(time * 1000) })
      $app.$gsap.ticker.lagSmoothing(0)
    } else {
      const raf = (t: number) => { lenis.raf(t); requestAnimationFrame(raf) }
      requestAnimationFrame(raf)
    }
    if (import.meta.dev) (window as any).__lenis = lenis
    return { provide: { lenis } }
  }
})

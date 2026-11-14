import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default defineNuxtPlugin({
  name: 'gsap',
  setup() {
    gsap.registerPlugin(ScrollTrigger)
    /* reveal 原语初始隐藏（reduced-motion 时保持可见）；ssr:false 下插件先于首次渲染，无闪烁 */
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.classList.add('motion-ready')
    }
    if (import.meta.dev) {
      ;(window as any).__gsap = gsap
      ;(window as any).__st = ScrollTrigger
    }
    return { provide: { gsap, st: ScrollTrigger } }
  }
})

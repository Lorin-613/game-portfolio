<script setup lang="ts">
/* ═══ OGL 全屏流体极光背景 ═══
   fbm 域扭曲噪声 shader（dpr 0.5 半分辨率渲染），章节调色板由 useAuroraPalette 桥接 GSAP 渐变；
   初始化成功时 html 加 .ogl-on 隐藏 CSS 极光圆斑；失败/reduce 时保持 CSS 兜底 */
import { Renderer, Program, Mesh, Triangle } from 'ogl'

const { $gsap } = useNuxtApp() as any
const { reduceMotion } = useMotionPrefs()
const { register } = useAuroraPalette()

/* 8 组低饱和粉彩章节调色板：cover / carnival / office / snow / forest / gallery / spirit / experience */
const PALETTES: [string, string, string][] = [
  ['#ffd9e8', '#dccaf7', '#ffd8c8'],  // 0 cover 粉紫桃
  ['#ffd0e2', '#a8d8ef', '#ffe9a8'],  // 1 carnival 蓝粉
  ['#fff1e6', '#ffd8c8', '#ffd0e2'],  // 2 office 暖奶油
  ['#dff1fa', '#eaf7ff', '#dcd6f7'],  // 3 snow 青白
  ['#bfe7d0', '#dcf5e3', '#ffd9e8'],  // 4 forest 粉绿
  ['#d8ecfa', '#e4dcfb', '#ffd9e8'],  // 5 gallery 冰蓝粉
  ['#e6dcff', '#dccaf7', '#ffe4ef'],  // 6 spirit 薰衣草
  ['#ffe0d2', '#ffd0e2', '#fff1e6']   // 7 experience 蜜桃
]

const vertex = /* glsl */`
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`

const fragment = /* glsl */`
  precision highp float;
  uniform float uTime;
  uniform vec2 uRes;
  uniform vec3 uColA;
  uniform vec3 uColB;
  uniform vec3 uColC;
  varying vec2 vUv;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float noise(in vec2 p){
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0.0; float a = 0.5;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = rot * p * 2.0; a *= 0.5; }
    return v;
  }
  void main() {
    vec2 p = vUv * vec2(uRes.x / uRes.y, 1.0) * 1.6;
    float t = uTime * 0.045;
    vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
    vec2 r = vec2(fbm(p + 2.6 * q + vec2(1.7, 9.2) + 0.30 * t),
                  fbm(p + 2.6 * q + vec2(8.3, 2.8) - 0.26 * t));
    float f = fbm(p + 3.0 * r);
    vec3 col = mix(uColA, uColB, clamp(f * f * 2.2, 0.0, 1.0));
    col = mix(col, uColC, clamp(length(q) * 0.55, 0.0, 1.0));
    /* 提亮至粉彩绘本区间，保证前景可读 */
    col = mix(col, vec3(1.0, 0.976, 0.965), 0.38);
    gl_FragColor = vec4(col, 1.0);
  }
`

function hex2rgb(hex: string): number[] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]
}

const host = ref<HTMLElement | null>(null)
let raf = 0
const cleanups: (() => void)[] = []

onMounted(() => {
  if (reduceMotion || !$gsap || !host.value) return

  let renderer: Renderer
  try {
    renderer = new Renderer({ dpr: 0.5, alpha: false, antialias: false })
  } catch {
    return /* WebGL 不可用 → 保持 CSS 极光兜底 */
  }
  const gl = renderer.gl
  gl.canvas.classList.add('aurora-gl')
  host.value.appendChild(gl.canvas)
  document.documentElement.classList.add('ogl-on')

  const colA = hex2rgb(PALETTES[0][0])
  const colB = hex2rgb(PALETTES[0][1])
  const colC = hex2rgb(PALETTES[0][2])
  const uniforms = {
    uTime: { value: 0 },
    uRes: { value: [innerWidth, innerHeight] as number[] },
    uColA: { value: colA },
    uColB: { value: colB },
    uColC: { value: colC }
  }
  const geometry = new Triangle(gl)
  const program = new Program(gl, { vertex, fragment, uniforms })
  const mesh = new Mesh(gl, { geometry, program })

  const resize = () => {
    renderer.setSize(innerWidth, innerHeight)
    uniforms.uRes.value = [innerWidth, innerHeight]
  }
  resize()
  window.addEventListener('resize', resize, { passive: true })
  cleanups.push(() => window.removeEventListener('resize', resize))

  const t0 = performance.now()
  const loop = () => {
    uniforms.uTime.value = (performance.now() - t0) / 1000
    renderer.render({ scene: mesh })
    raf = requestAnimationFrame(loop)
  }
  loop()

  /* 章节调色板 morph：GSAP 逐通道缓动（数组即对象，索引键可补间） */
  register((index: number) => {
    const pal = PALETTES[Math.max(0, Math.min(PALETTES.length - 1, index))]
    const targets = [hex2rgb(pal[0]), hex2rgb(pal[1]), hex2rgb(pal[2])]
    ;[colA, colB, colC].forEach((cur, i) => {
      $gsap.to(cur, { 0: targets[i][0], 1: targets[i][1], 2: targets[i][2], duration: 1.6, ease: 'sine.inOut', overwrite: true })
    })
  })

  cleanups.push(() => {
    cancelAnimationFrame(raf)
    document.documentElement.classList.remove('ogl-on')
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    gl.canvas.remove()
  })
})

onBeforeUnmount(() => cleanups.forEach(fn => fn()))
</script>

<template>
  <div ref="host" aria-hidden="true"></div>
</template>

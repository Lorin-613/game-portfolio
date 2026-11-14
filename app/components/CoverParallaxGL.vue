<script setup lang="ts">
/* ═══ 封面 2.5D 视差：main_home 贴图铺在 48×28 网格上 ═══
   顶点 mesh-warp：中心标志区不动，越靠边缘随鼠标位移越大 → 盒式纵深；
   鼠标静止时保留微弱正弦漂移（画面自我呼吸）；GL 失败回退 <img> */
import { Renderer, Program, Mesh, Plane, Texture } from 'ogl'

const props = withDefaults(defineProps<{ src?: string }>(), { src: '/img/main_home.png' })

const { reduceMotion } = useMotionPrefs()
const host = ref<HTMLElement | null>(null)
const failed = ref(false)

let raf = 0
const cleanups: (() => void)[] = []

const vertex = /* glsl */`
  attribute vec2 uv;
  attribute vec3 position;
  uniform vec2 uMouse;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec2 pos = position.xy;
    float d = length(uv - 0.5);
    float edge = smoothstep(0.10, 0.62, d);
    /* 角部位移最大 → 2.5D 盒感；中心标志区保持不动 */
    pos += uMouse * edge * 0.05 * pos;
    gl_Position = vec4(pos, 0.0, 1.0);
  }
`
const fragment = /* glsl */`
  precision highp float;
  uniform sampler2D uMap;
  varying vec2 vUv;
  void main() { gl_FragColor = texture2D(uMap, vUv); }
`

onMounted(() => {
  /* reduced-motion：不启用 WebGL 视差，直接呈现静态封面图 */
  if (reduceMotion || !host.value) {
    failed.value = true
    return
  }
  let renderer: Renderer
  try {
    renderer = new Renderer({ dpr: Math.min(devicePixelRatio, 1.75), alpha: false, antialias: false })
  } catch {
    failed.value = true
    return
  }
  const gl = renderer.gl
  host.value.appendChild(gl.canvas)

  const texture = new Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR, magFilter: gl.LINEAR })
  const img = new Image()
  img.onload = () => { texture.image = img }
  img.onerror = () => { failed.value = true }
  img.src = props.src

  /* 网格略微超出视口，吸收角部位移不露边 */
  const geometry = new Plane(gl, { width: 2.11, height: 2.11, widthSegments: 48, heightSegments: 28 })
  const program = new Program(gl, {
    vertex, fragment,
    uniforms: {
      uMap: { value: texture },
      uMouse: { value: [0, 0] as number[] }
    }
  })
  const mesh = new Mesh(gl, { geometry, program })

  const resize = () => {
    const el = host.value!
    renderer.setSize(Math.max(2, el.clientWidth), Math.max(2, el.clientHeight))
  }
  resize()
  const ro = new ResizeObserver(resize)
  ro.observe(host.value)
  cleanups.push(() => ro.disconnect())

  let mx = 0, my = 0, sx = 0, sy = 0
  const onMove = (e: MouseEvent) => {
    mx = (e.clientX / innerWidth - 0.5) * 2
    my = (e.clientY / innerHeight - 0.5) * 2
  }
  window.addEventListener('mousemove', onMove, { passive: true })
  cleanups.push(() => window.removeEventListener('mousemove', onMove))

  const t0 = performance.now()
  const loop = () => {
    const t = (performance.now() - t0) / 1000
    /* 反向位移营造背景纵深；叠加微小自动漂移保持呼吸 */
    const tx = -mx + Math.sin(t * 0.4) * 0.18
    const ty = -my * 0.7 + Math.cos(t * 0.33) * 0.14
    sx += (tx - sx) * 0.055
    sy += (ty - sy) * 0.055
    const u = program.uniforms.uMouse.value as number[]
    u[0] = sx; u[1] = -sy
    renderer.render({ scene: mesh })
    raf = requestAnimationFrame(loop)
  }
  loop()

  cleanups.push(() => {
    cancelAnimationFrame(raf)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    gl.canvas.remove()
  })
})

onBeforeUnmount(() => cleanups.forEach(fn => fn()))
</script>

<template>
  <div ref="host" class="cover-gl" aria-hidden="true" style="position:absolute;inset:0">
    <img v-if="failed" class="cover-fallback" :src="src" alt="" />
  </div>
</template>

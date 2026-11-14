<script setup lang="ts">
/* ═══ 加载导入页：进度条 → 幕帘上滑 → emit('finished') 触发封面开场 ═══ */
const emit = defineEmits<{ (e: 'finished'): void }>()
const { reduceMotion } = useMotionPrefs()

const p = ref(0)
const done = ref(false)
const gone = ref(false)
let timer: ReturnType<typeof setInterval> | null = null
let fallback: ReturnType<typeof setTimeout> | null = null

function finish() {
  if (done.value) return
  done.value = true
  emit('finished')
  setTimeout(() => { gone.value = true }, 1300)
}

onMounted(() => {
  if (reduceMotion) { gone.value = true; emit('finished'); return }
  timer = setInterval(() => {
    p.value = Math.min(100, p.value + Math.random() * 13 + 5)
    if (p.value >= 100) {
      if (timer) clearInterval(timer)
      setTimeout(finish, 340)
    }
  }, 140)
  /* 兜底，绝不久留 */
  fallback = setTimeout(() => { if (timer) clearInterval(timer); finish() }, 6000)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
  if (fallback) clearTimeout(fallback)
})
</script>

<template>
  <div v-if="!gone" class="preloader" :class="{ done }" aria-hidden="true">
    <div class="preloader-badge"><img src="/img/fairy_normal.png" alt="" /></div>
    <div class="preloader-name">YONGKOKU</div>
    <div class="preloader-bar"><i :style="{ width: p + '%' }"></i></div>
    <div class="preloader-pct">{{ Math.floor(p) }}%</div>
  </div>
</template>

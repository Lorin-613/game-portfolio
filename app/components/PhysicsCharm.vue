<script setup lang="ts">
/* ═══ 可点击物理装饰：外层 .symbol.charm.px（指针视差/物理掉落）+ 内层 .emboss（CSS 漂浮发光） ═══
   点击 → Matter.js 重力掉落弹跳 → 消散重生；触屏降级为跳动 */
withDefaults(defineProps<{ depth?: number; size?: 'sm' | 'md' | 'lg' }>(), { depth: 0.06, size: 'md' })

const root = ref<HTMLElement | null>(null)
const { attach } = usePhysicsCharm()
onMounted(() => { if (root.value) attach(root.value) })
</script>

<template>
  <div ref="root" class="symbol charm px" :data-depth="depth">
    <div class="emboss" :class="size"><slot /></div>
  </div>
</template>

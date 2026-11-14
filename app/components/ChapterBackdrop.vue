<script setup lang="ts">
/* ═══ 章节专属几何动效背景（纯 CSS/DOM，低饱和慢节奏） ═══
   carnival 旋转木马光斑+气球 / office 漂浮信封便签 / snow 落雪晶体 / forest 萤火光晕 */
defineProps<{ theme: 'carnival' | 'office' | 'snow' | 'forest' }>()
</script>

<template>
  <div class="ch-backdrop" :data-theme="theme" aria-hidden="true">
    <!-- 梦境乐园：旋转木马光斑 + 漂浮气球 -->
    <template v-if="theme === 'carnival'">
      <div class="car-ring"><i v-for="n in 6" :key="n" :style="{ '--i': n - 1 }"></i></div>
      <i v-for="n in 4" :key="'b' + n" class="balloon" :style="{ '--i': n - 1 }"></i>
    </template>
    <!-- 礼物事务所：漂浮信封与便签 -->
    <template v-else-if="theme === 'office'">
      <i v-for="n in 6" :key="n" class="note" :style="{ '--i': n - 1 }"></i>
    </template>
    <!-- 雪境礼屋：飘落雪晶 -->
    <template v-else-if="theme === 'snow'">
      <i v-for="n in 14" :key="'s' + n" class="flake" :style="{ '--i': n - 1 }"></i>
    </template>
    <!-- 魔法森林：萤火虫光晕漂移 -->
    <template v-else>
      <i v-for="n in 8" :key="'f' + n" class="firefly" :style="{ '--i': n - 1 }"></i>
    </template>
  </div>
</template>

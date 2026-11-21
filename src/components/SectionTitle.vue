<template>
  <view class="section-head">
    <text class="section-title">{{ title }}</text>
    <slot />
  </view>
</template>

<script setup lang="ts">
defineProps<{ title: string }>()
</script>

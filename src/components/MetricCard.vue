<script setup>
defineProps({ label: String, value: [String, Number], unit: String, accent: { type: Boolean, default: false } })
</script>
<template>
  <div class="metric-card" :class="{ 'metric-card--accent': accent }">
    <span>{{ label }}</span><strong>{{ value }} <small>{{ unit }}</small></strong>
  </div>
</template>

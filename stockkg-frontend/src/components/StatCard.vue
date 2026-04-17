<template>
  <div class="stat-card">
    <p>{{ label }}</p>
    <strong>{{ value }}</strong>
    <span>{{ helper }}</span>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  value: [String, Number],
  helper: String,
})
</script>

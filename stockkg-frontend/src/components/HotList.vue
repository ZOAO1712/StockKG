<template>
  <div class="panel-card hot-list-card">
    <div class="panel-head">
      <div>
        <p class="panel-kicker">Top Nodes</p>
        <h3>高关联节点</h3>
      </div>
    </div>

    <div class="hot-list">
      <button
        v-for="node in items"
        :key="node.id"
        class="hot-item"
        type="button"
        @click="$emit('select', node.id)"
      >
        <div>
          <strong>{{ node.label }}</strong>
          <p>{{ node.category }} · 连接度 {{ node.degree }}</p>
        </div>
        <span class="score-chip">{{ node.score }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['select'])
</script>

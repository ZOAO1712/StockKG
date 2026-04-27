<template>
  <div class="panel-card hot-list-card compact-side-card">
    <div class="panel-head compact-panel-head">
      <div>
        <p class="panel-kicker">Top Nodes</p>
        <h3>高关联节点</h3>
      </div>
    </div>

    <div class="hot-list compact-hot-list">
      <button
          v-for="node in items"
          :key="node.id"
          class="hot-item compact-hot-item"
          type="button"
          @click="$emit('select', node.id)"
      >
        <div class="hot-item-text">
          <strong>{{ node.label }}</strong>
          <p>{{ node.description || `${node.category} · 连接度 ${node.score ?? 0}` }}</p>
        </div>
        <span class="score-chip compact-score-chip">{{ node.score }}</span>
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

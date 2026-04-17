<template>
  <div class="panel-card detail-card">
    <div class="panel-head">
      <div>
        <p class="panel-kicker">Node Detail</p>
        <h3>节点详情</h3>
      </div>
      <span class="type-pill" :style="{ backgroundColor: `${color}20`, color }">{{ node?.category || '未选择' }}</span>
    </div>

    <template v-if="node">
      <div class="detail-main">
        <h4>{{ node.label }}</h4>
        <p>{{ node.description }}</p>
      </div>

      <div class="detail-grid">
        <div class="detail-box">
          <span>节点层级</span>
          <strong>{{ node.level || '—' }}</strong>
        </div>
        <div class="detail-box">
          <span>评分</span>
          <strong>{{ node.score || '—' }}</strong>
        </div>
        <div class="detail-box">
          <span>代码</span>
          <strong>{{ node.symbol || '—' }}</strong>
        </div>
        <div class="detail-box">
          <span>ID</span>
          <strong>{{ node.id }}</strong>
        </div>
      </div>

      <div class="metrics-card">
        <h5>扩展属性</h5>
        <ul>
          <li v-for="(value, key) in node.metrics || {}" :key="key">
            <span>{{ key }}</span>
            <strong>{{ value }}</strong>
          </li>
        </ul>
      </div>
    </template>

    <div v-else class="empty-state">
      点击左侧图谱中的任意节点查看详情。
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  node: Object,
  colors: {
    type: Object,
    default: () => ({}),
  },
})

const color = computed(() => props.colors?.[props.node?.category] || '#94a3b8')
</script>

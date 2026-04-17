<template>
  <div class="graph-page">
    <section class="graph-main-column">
      <div class="panel-card filter-card">
        <div class="panel-head">
          <div>
            <p class="panel-kicker">Explorer Tools</p>
            <h3>搜索与筛选</h3>
          </div>
          <button class="ghost-btn" type="button" @click="store.resetFilters">重置</button>
        </div>

        <div class="filter-toolbar">
          <input
            :value="store.keyword"
            class="search-input"
            placeholder="输入节点名称 / 类别 / 描述，例如：新能源、ROE、贵州茅台"
            @input="store.setKeyword($event.target.value)"
          />
        </div>

        <div class="category-filters">
          <button
            v-for="item in store.categoryList"
            :key="item.key"
            type="button"
            class="filter-chip"
            :class="{ active: store.enabledCategories.includes(item.key) }"
            :style="chipStyle(item)"
            @click="store.toggleCategory(item.key)"
          >
            {{ item.key }} ({{ item.count }})
          </button>
        </div>
      </div>

      <div class="panel-card graph-panel-card">
        <div class="panel-head">
          <div>
            <p class="panel-kicker">Interactive Graph</p>
            <h3>图谱交互区</h3>
          </div>
          <span class="panel-caption">
            当前展示 {{ store.filteredGraph.nodes.length }} 个节点 / {{ store.filteredGraph.edges.length }} 条关系
          </span>
        </div>

        <KnowledgeGraph
          :graph="store.filteredGraph"
          :colors="store.categoryColors"
          :categories="store.categoryList"
          :selected-node-id="store.selectedNodeId"
          @select="store.selectNode"
        />
      </div>
    </section>

    <aside class="graph-side-column">
      <DetailPanel :node="store.selectedNode" :colors="store.categoryColors" />

      <div class="panel-card helper-card">
        <div class="panel-head">
          <div>
            <p class="panel-kicker">How To Extend</p>
            <h3>下一步接真实数据</h3>
          </div>
        </div>

        <ul class="helper-list">
          <li>把 <code>src/mock/graphData.js</code> 换成后端接口返回数据。</li>
          <li>节点字段建议统一为 <code>id / label / category / metrics</code>。</li>
          <li>边字段建议统一为 <code>source / target / label</code>。</li>
          <li>如果你接 Neo4j，可在后端把 Cypher 查询结果转成前端 JSON。</li>
        </ul>
      </div>
    </aside>
  </div>
</template>

<script setup>
import DetailPanel from '@/components/DetailPanel.vue'
import KnowledgeGraph from '@/components/KnowledgeGraph.vue'
import { useGraphStore } from '@/stores/graph'

const store = useGraphStore()

function chipStyle(item) {
  const active = store.enabledCategories.includes(item.key)
  return {
    borderColor: item.color,
    color: active ? '#fff' : item.color,
    backgroundColor: active ? item.color : `${item.color}12`,
  }
}
</script>

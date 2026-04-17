<template>
  <div class="page-grid">
    <section class="overview-section">
      <div class="stats-grid">
        <StatCard label="节点总数" :value="store.stats.totalNodes" helper="当前 mock 图谱实体" />
        <StatCard label="关系总数" :value="store.stats.totalEdges" helper="节点之间的语义连接" />
        <StatCard label="类别数量" :value="store.stats.totalCategories" helper="股票 / 行业 / 指标等" />
        <StatCard label="平均评分" :value="store.stats.avgScore" helper="用于演示热度与优先级" />
      </div>

      <div class="two-col-grid">
        <div class="panel-card">
          <div class="panel-head">
            <div>
              <p class="panel-kicker">Category Distribution</p>
              <h3>类别分布</h3>
            </div>
          </div>
          <ChartPanel :option="categoryOption" />
        </div>

        <div class="panel-card">
          <div class="panel-head">
            <div>
              <p class="panel-kicker">Node Score</p>
              <h3>核心节点评分</h3>
            </div>
          </div>
          <ChartPanel :option="scoreOption" />
        </div>
      </div>
    </section>

    <aside class="side-section">
      <HotList :items="store.hotNodes" @select="goToGraph" />

      <div class="panel-card timeline-card">
        <div class="panel-head">
          <div>
            <p class="panel-kicker">Display Scenario</p>
            <h3>适合毕设展示的功能点</h3>
          </div>
        </div>

        <ol class="timeline-list">
          <li>
            <strong>知识图谱浏览</strong>
            <p>支持拖拽、缩放、点击节点查看详情。</p>
          </li>
          <li>
            <strong>搜索与筛选</strong>
            <p>可按关键词、类别过滤图谱子集。</p>
          </li>
          <li>
            <strong>图谱数据统计</strong>
            <p>使用 ECharts 展示类别分布与核心评分。</p>
          </li>
          <li>
            <strong>后续接入后端</strong>
            <p>只需把 mock 数据替换为 API / Neo4j 查询结果。</p>
          </li>
        </ol>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import ChartPanel from '@/components/ChartPanel.vue'
import HotList from '@/components/HotList.vue'
import StatCard from '@/components/StatCard.vue'
import { useGraphStore } from '@/stores/graph'

const router = useRouter()
const store = useGraphStore()

const categoryOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: 0 },
  series: [
    {
      type: 'pie',
      radius: ['45%', '72%'],
      center: ['50%', '45%'],
      label: { formatter: '{b}\n{c}' },
      data: store.categoryList.map((item) => ({
        value: item.count,
        name: item.key,
        itemStyle: { color: item.color },
      })),
    },
  ],
}))

const scoreOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { top: 20, right: 16, bottom: 36, left: 36 },
  xAxis: {
    type: 'category',
    data: store.hotNodes.map((item) => item.label),
    axisLabel: { interval: 0, rotate: 20 },
  },
  yAxis: { type: 'value', max: 100 },
  series: [
    {
      type: 'bar',
      data: store.hotNodes.map((item) => ({
        value: item.score,
        itemStyle: { color: store.categoryColors[item.category] },
      })),
      borderRadius: [8, 8, 0, 0],
    },
  ],
}))

function goToGraph(nodeId) {
  store.selectNode(nodeId)
  router.push('/graph')
}
</script>

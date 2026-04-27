<template>
  <div class="page-grid compact-overview-page">
    <section class="overview-section">
      <div class="stats-grid compact-stats-grid">
        <StatCard label="节点总数" :value="overview.nodeCount" helper="数据库中的全部图谱实体" />
        <StatCard label="关系总数" :value="overview.relationCount" helper="数据库中的全部图谱关系" />
        <StatCard label="类别数量" :value="overview.categoryCount" helper="按 category / 标签统计" />
        <StatCard label="平均评分" :value="formattedAverageScore" helper="基于连接度的综合评分" />
      </div>

      <div class="two-col-grid compact-chart-grid">
        <div class="panel-card compact-chart-card">
          <div class="panel-head compact-panel-head">
            <div>
              <p class="panel-kicker">Category Distribution</p>
              <h3>类别分布</h3>
            </div>
          </div>
          <ChartPanel :option="categoryOption" />
        </div>

        <div class="panel-card compact-chart-card">
          <div class="panel-head compact-panel-head">
            <div>
              <p class="panel-kicker">Node Score</p>
              <h3>核心节点连接度</h3>
            </div>
          </div>
          <ChartPanel :option="scoreOption" />
        </div>
      </div>
    </section>

    <aside class="side-section compact-side-section">
      <HotList :items="hotListItems" @select="goToGraph" />

      <div class="panel-card timeline-card compact-side-card">
        <div class="panel-head compact-panel-head">
          <div>
            <p class="panel-kicker">Display Scenario</p>
            <h3>适合毕设展示的功能点</h3>
          </div>
        </div>

        <ol class="timeline-list compact-timeline-list">
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
        </ol>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ChartPanel from '@/components/ChartPanel.vue'
import HotList from '@/components/HotList.vue'
import StatCard from '@/components/StatCard.vue'
import { useGraphStore } from '@/stores/graph'
import { getDashboardOverview } from '@/api/dashboard'

const router = useRouter()
const graphStore = useGraphStore()

const overview = ref({
  nodeCount: 0,
  relationCount: 0,
  categoryCount: 0,
  averageScore: 0,
  topNodes: [],
  categoryDistribution: [],
  scoreList: [],
})

const categoryNameMap = {
  Stock: '股票',
  Industry: '行业',
  Concept: '概念',
  Company: '公司',
  Strategy: '策略',
  User: '用户',
}

function normalizeCategoryName(name) {
  return categoryNameMap[name] || name || '未分类'
}

function buildCompactCategoryData(list = [], limit = 6) {
  const mergedMap = new Map()

  list.forEach((item) => {
    const rawName = item.name ?? item.category ?? item.label
    const name = normalizeCategoryName(rawName)
    const value = Number(item.value ?? item.count ?? 0)

    if (!Number.isFinite(value) || value <= 0) return

    mergedMap.set(name, (mergedMap.get(name) || 0) + value)
  })

  const sorted = [...mergedMap.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

  const top = sorted.slice(0, limit)
  const rest = sorted.slice(limit).reduce((sum, item) => sum + item.value, 0)

  if (rest > 0) {
    top.push({ name: '其他', value: rest })
  }

  return top
}

async function fetchOverview() {
  try {
    const data = await getDashboardOverview()

    overview.value = {
      nodeCount: data.nodeCount ?? 0,
      relationCount: data.relationCount ?? 0,
      categoryCount: data.categoryCount ?? 0,
      averageScore: data.averageScore ?? 0,
      topNodes: Array.isArray(data.topNodes) ? data.topNodes : [],
      categoryDistribution: Array.isArray(data.categoryDistribution) ? data.categoryDistribution : [],
      scoreList: Array.isArray(data.scoreList) ? data.scoreList : [],
    }
  } catch (error) {
    console.error('获取总览数据失败：', error)
  }
}

onMounted(() => {
  fetchOverview()
})

const formattedAverageScore = computed(() => Number(overview.value.averageScore || 0).toFixed(2))

const hotListItems = computed(() =>
    overview.value.topNodes.slice(0, 4).map((item, index) => {
      const category = normalizeCategoryName(item.category)
      const score = Number(item.degree ?? item.score ?? 0)

      return {
        id: item.id ?? `node-${index}`,
        label: item.label ?? item.name ?? '未命名节点',
        category,
        score,
        description: `${category} · 连接度 ${score}`,
      }
    }),
)

const categoryOption = computed(() => {
  const chartData = buildCompactCategoryData(overview.value.categoryDistribution, 5)

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      bottom: 0,
      left: 'center',
      type: 'scroll',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: {
        fontSize: 11,
      },
    },
    series: [
      {
        name: '类别分布',
        type: 'pie',
        radius: ['44%', '62%'],
        center: ['50%', '41%'],
        avoidLabelOverlap: false,
        minAngle: 8,
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}\n{c}',
          color: '#334155',
          fontSize: 11,
          lineHeight: 15,
        },
        labelLine: {
          show: true,
          length: 10,
          length2: 8,
          smooth: true,
        },
        labelLayout() {
          // 不再按占比隐藏小类别标签，避免“策略”等小扇区名称缺失
          return {
            hideOverlap: false,
            moveOverlap: 'shiftY',
            draggable: false,
          }
        },
        data: chartData,
      },
    ],
  }
})

const scoreOption = computed(() => {
  const scoreSource = overview.value.scoreList.length
      ? overview.value.scoreList.slice(0, 6).map((item) => ({
        name: item.name ?? item.label ?? '未知',
        value: Number(item.value ?? item.score ?? 0),
      }))
      : overview.value.topNodes.slice(0, 6).map((item) => ({
        name: item.label ?? item.name ?? '未知',
        value: Number(item.degree ?? item.score ?? 0),
      }))

  return {
    tooltip: { trigger: 'axis' },
    grid: { top: 16, right: 10, bottom: 48, left: 38 },
    xAxis: {
      type: 'category',
      data: scoreSource.map((item) => item.name),
      axisLabel: {
        interval: 0,
        rotate: 18,
        fontSize: 11,
      },
    },
    yAxis: {
      type: 'value',
      name: '连接度',
      nameTextStyle: {
        fontSize: 11,
      },
      axisLabel: {
        fontSize: 11,
      },
    },
    series: [
      {
        type: 'bar',
        barWidth: 20,
        data: scoreSource.map((item) => item.value),
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
        },
      },
    ],
  }
})

function goToGraph(payload) {
  const nodeId = typeof payload === 'object' ? payload.id : payload
  if (nodeId) {
    graphStore.selectNode(nodeId)
  }
  router.push('/graph')
}
</script>

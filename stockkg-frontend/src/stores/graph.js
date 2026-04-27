import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getStockGraph } from '@/api/graph'

const categoryColors = {
  股票: '#5b8ff9',
  公司: '#7f8c8d',
  行业: '#5ad8a6',
  概念: '#f6bd16',
  交易所: '#6dc8ec',
  地区: '#13c2c2',
  人物: '#ff9d4d',
  行情指标: '#9270ca',
  知识点: '#9270ca',
  指标: '#9270ca',
  事件: '#ff9d4d',
  风险: '#f4664a',
  策略: '#6dc8ec',
  其他: '#94a3b8',
}

const categoryMap = {
  Stock: '股票',
  Company: '公司',
  Industry: '行业',
  Concept: '概念',
  Exchange: '交易所',
  Area: '地区',
  Person: '人物',
  MarketMetric: '行情指标',
  KnowledgePoint: '知识点',
  FinancialIndicator: '指标',
  TechnicalIndicator: '指标',
  FinanceMetric: '指标',
  TechnicalMetric: '指标',
  Event: '事件',
  Risk: '风险',
  Strategy: '策略',
}

const relationMap = {
  BELONGS_TO: '属于行业',
  BELONGS_TO_INDUSTRY: '属于行业',
  HAS_CONCEPT: '关联概念',
  RELATED_TO: '关联概念',
  RELATED_TO_TECHNICAL_INDICATOR: '技术指标',
  RELATED_TO_FINANCIAL_INDICATOR: '财务指标',
  CORRESPONDS_TO: '对应公司',
  LISTED_ON: '上市于',
  LOCATED_IN: '位于地区',
  HAS_MANAGER: '管理人员',
  HAS_MARKET_METRIC: '行情指标',
  HAS_RISK: '存在风险',
}

function normalizeCategory(category) {
  return categoryMap[category] || category || '其他'
}

function normalizeRelation(label) {
  return relationMap[label] || label || '关联'
}

function normalizeNode(node) {
  const rawMetrics = node.metrics || {}
  const metrics = { ...rawMetrics }
  const category = normalizeCategory(node.category)

  const description = node.description || rawMetrics.description || ''
  const level = node.level || rawMetrics.level || ''
  const score = Number(node.score ?? rawMetrics.score ?? 0)
  const symbol = node.symbol || rawMetrics.symbol || rawMetrics.code || (category === '股票' ? String(node.id).replace(/^stock_/, '') : '')

  delete metrics.description
  delete metrics.level
  delete metrics.score
  delete metrics.symbol
  delete metrics.code

  return {
    id: String(node.id),
    label: node.label || node.name || String(node.id),
    category,
    metrics,
    description,
    level,
    symbol,
    score,
  }
}

function normalizeEdge(edge) {
  return {
    source: String(edge.source),
    target: String(edge.target),
    label: normalizeRelation(edge.label),
    rawLabel: edge.label || '',
  }
}

export const useGraphStore = defineStore('graph', () => {
  const rawNodes = ref([])
  const rawEdges = ref([])
  const selectedNodeId = ref('')
  const keyword = ref('')
  const enabledCategories = ref([])
  const loading = ref(false)
  const error = ref('')

  const categoryList = computed(() => {
    const categories = [...new Set(rawNodes.value.map((node) => node.category))]
    return categories.map((key) => ({
      key,
      color: categoryColors[key] || categoryColors['其他'],
      count: rawNodes.value.filter((node) => node.category === key).length,
    }))
  })

  const stats = computed(() => {
    const totalNodes = rawNodes.value.length
    const totalEdges = rawEdges.value.length
    const totalCategories = categoryList.value.length
    const avgScore = totalNodes
        ? Math.round(rawNodes.value.reduce((sum, node) => sum + (node.score || 0), 0) / totalNodes)
        : 0

    return {
      totalNodes,
      totalEdges,
      totalCategories,
      avgScore,
    }
  })

  const selectedNode = computed(() =>
      rawNodes.value.find((node) => node.id === selectedNodeId.value),
  )

  const filteredGraph = computed(() => {
    const search = keyword.value.trim().toLowerCase()
    const visibleBaseNodes = rawNodes.value.filter((node) =>
        enabledCategories.value.includes(node.category),
    )

    if (!search) {
      const nodeIds = new Set(visibleBaseNodes.map((node) => node.id))
      return {
        nodes: visibleBaseNodes,
        edges: rawEdges.value.filter(
            (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target),
        ),
      }
    }

    const matchedIds = new Set(
        visibleBaseNodes
            .filter((node) =>
                [
                  node.label,
                  node.category,
                  node.description,
                  node.symbol,
                  ...Object.values(node.metrics || {}),
                ]
                    .filter(Boolean)
                    .some((text) => String(text).toLowerCase().includes(search)),
            )
            .map((node) => node.id),
    )

    rawEdges.value.forEach((edge) => {
      if (matchedIds.has(edge.source) || matchedIds.has(edge.target)) {
        matchedIds.add(edge.source)
        matchedIds.add(edge.target)
      }
    })

    const nodes = visibleBaseNodes.filter((node) => matchedIds.has(node.id))
    const nodeIds = new Set(nodes.map((node) => node.id))

    return {
      nodes,
      edges: rawEdges.value.filter(
          (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target),
      ),
    }
  })

  const degreeMap = computed(() => {
    const map = new Map()
    rawNodes.value.forEach((node) => map.set(node.id, 0))
    rawEdges.value.forEach((edge) => {
      map.set(edge.source, (map.get(edge.source) || 0) + 1)
      map.set(edge.target, (map.get(edge.target) || 0) + 1)
    })
    return map
  })

  const hotNodes = computed(() => {
    return [...rawNodes.value]
        .map((node) => ({ ...node, degree: degreeMap.value.get(node.id) || 0 }))
        .sort((a, b) => b.degree - a.degree || b.score - a.score)
        .slice(0, 6)
  })

  async function fetchGraph(code = '600519') {
    loading.value = true
    error.value = ''

    try {
      const payload = await getStockGraph(code)

      const nodes = (payload.nodes || []).map(normalizeNode)
      const edges = (payload.edges || []).map(normalizeEdge)

      rawNodes.value = nodes
      rawEdges.value = edges
      selectedNodeId.value = nodes[0]?.id || ''
      enabledCategories.value = [...new Set(nodes.map((node) => node.category))]
    } catch (err) {
      console.error('加载图谱失败', err)
      error.value = err?.response?.data?.message || err?.message || '加载图谱失败'
      rawNodes.value = []
      rawEdges.value = []
      selectedNodeId.value = ''
      enabledCategories.value = []
    } finally {
      loading.value = false
    }
  }

  function selectNode(nodeId) {
    selectedNodeId.value = nodeId
  }

  function setKeyword(value) {
    keyword.value = value
  }

  function toggleCategory(category) {
    if (enabledCategories.value.includes(category)) {
      enabledCategories.value = enabledCategories.value.filter((item) => item !== category)
      if (!enabledCategories.value.length) {
        enabledCategories.value = [category]
      }
    } else {
      enabledCategories.value = [...enabledCategories.value, category]
    }
  }

  function resetFilters() {
    keyword.value = ''
    enabledCategories.value = [...new Set(rawNodes.value.map((node) => node.category))]
  }

  return {
    rawNodes,
    rawEdges,
    selectedNodeId,
    selectedNode,
    keyword,
    enabledCategories,
    categoryList,
    stats,
    filteredGraph,
    hotNodes,
    loading,
    error,
    fetchGraph,
    selectNode,
    setKeyword,
    toggleCategory,
    resetFilters,
    categoryColors,
  }
})
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { categoryColors, graphData } from '@/mock/graphData'

export const useGraphStore = defineStore('graph', () => {
  const rawNodes = ref(graphData.nodes)
  const rawEdges = ref(graphData.edges)
  const selectedNodeId = ref(graphData.nodes[0]?.id || '')
  const keyword = ref('')
  const enabledCategories = ref(Object.keys(categoryColors))

  const categoryList = computed(() =>
    Object.keys(categoryColors).map((key) => ({
      key,
      color: categoryColors[key],
      count: rawNodes.value.filter((node) => node.category === key).length,
    })),
  )

  const stats = computed(() => {
    const totalNodes = rawNodes.value.length
    const totalEdges = rawEdges.value.length
    const totalCategories = categoryList.value.length
    const avgScore = Math.round(
      rawNodes.value.reduce((sum, node) => sum + (node.score || 0), 0) / totalNodes,
    )

    return {
      totalNodes,
      totalEdges,
      totalCategories,
      avgScore,
    }
  })

  const selectedNode = computed(() => rawNodes.value.find((node) => node.id === selectedNodeId.value))

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
        .filter((node) => {
          return [node.label, node.category, node.description, node.symbol]
            .filter(Boolean)
            .some((text) => String(text).toLowerCase().includes(search))
        })
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
      edges: rawEdges.value.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)),
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
    enabledCategories.value = Object.keys(categoryColors)
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
    selectNode,
    setKeyword,
    toggleCategory,
    resetFilters,
    categoryColors,
  }
})

<template>
  <div class="graph-wrapper">
    <div ref="containerRef" class="graph-canvas"></div>

    <div class="graph-legend">
      <span v-for="item in categories" :key="item.key">
        <i :style="{ backgroundColor: item.color }"></i>
        {{ item.key }}
      </span>
    </div>
  </div>
</template>

<script setup>
import * as d3 from 'd3'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  graph: {
    type: Object,
    required: true,
  },
  colors: {
    type: Object,
    default: () => ({}),
  },
  categories: {
    type: Array,
    default: () => [],
  },
  selectedNodeId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['select'])

const containerRef = ref(null)
const width = ref(0)
const height = ref(0)
const isDragging = ref(false)

let resizeObserver = null
let cleanup = null

function clearDragState() {
  isDragging.value = false
  hideTooltip()
}

function handleVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    clearDragState()
  }
}

let nodeCircleSelection = null
let nodeGroupSelection = null
let tooltipSelection = null

const graphPayload = computed(() => ({
  nodes: (props.graph?.nodes || []).map((node) => ({ ...node })),
  edges: (props.graph?.edges || []).map((edge, index) => ({
    ...edge,
    id: `${edge.source}-${edge.target}-${index}`,
  })),
}))

function shortenRelation(label = '') {
  if (label.length <= 6) return label
  return `${label.slice(0, 6)}…`
}

function getPointerPosition(event, container) {
  const [x, y] = d3.pointer(event, container)
  return {
    x: x + 16,
    y: y + 16,
  }
}

function showTooltip(event, html) {
  if (!tooltipSelection || !containerRef.value) return

  const pos = getPointerPosition(event, containerRef.value)

  tooltipSelection
      .style('opacity', 1)
      .html(html)
      .style('left', `${pos.x}px`)
      .style('top', `${pos.y}px`)
}

function moveTooltip(event) {
  if (!tooltipSelection || !containerRef.value) return

  const pos = getPointerPosition(event, containerRef.value)

  tooltipSelection
      .style('left', `${pos.x}px`)
      .style('top', `${pos.y}px`)
}

function hideTooltip() {
  tooltipSelection?.style('opacity', 0)
}

function updateSelectedStyle() {
  if (!nodeCircleSelection) return

  nodeCircleSelection
      .attr('r', (d) => (d.id === props.selectedNodeId ? 34 : 28))
      .attr('fill-opacity', (d) => (d.id === props.selectedNodeId ? 0.95 : 0.86))
      .attr('stroke', (d) => (d.id === props.selectedNodeId ? '#0f172a' : '#ffffff'))
      .attr('stroke-width', (d) => (d.id === props.selectedNodeId ? 3 : 2))
}

function renderGraph() {
  if (!containerRef.value) return

  const container = containerRef.value
  container.innerHTML = ''

  width.value = container.clientWidth || 860
  height.value = container.clientHeight || 560

  const nodes = graphPayload.value.nodes
  const links = graphPayload.value.edges

  if (!nodes.length) {
    cleanup = () => {
      nodeCircleSelection = null
      nodeGroupSelection = null
      tooltipSelection = null
    }
    return
  }

  const svg = d3
      .select(container)
      .append('svg')
      .attr('viewBox', [0, 0, width.value, height.value])
      .attr('width', width.value)
      .attr('height', height.value)

  const zoomLayer = svg.append('g')

  const zoom = d3
      .zoom()
      .scaleExtent([0.35, 3])
      .on('zoom', (event) => {
        zoomLayer.attr('transform', event.transform)
      })

  svg.call(zoom)
  svg.on('dblclick.zoom', null)

  const simulation = d3
      .forceSimulation(nodes)
      .force(
          'link',
          d3
              .forceLink(links)
              .id((d) => d.id)
              .distance(140),
      )
      .force('charge', d3.forceManyBody().strength(-560))
      .force('center', d3.forceCenter(width.value / 2, height.value / 2))
      .force(
          'collision',
          d3.forceCollide().radius((d) => (d.label?.length > 4 ? 44 : 36)),
      )

  const link = zoomLayer
      .append('g')
      .attr('stroke', 'rgba(148, 163, 184, 0.7)')
      .attr('stroke-width', 1.4)
      .selectAll('line')
      .data(links)
      .join('line')

  const linkLabelGroup = zoomLayer.append('g')

  const linkLabelBg = linkLabelGroup
      .selectAll('rect')
      .data(links)
      .join('rect')
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', 'rgba(255,255,255,0.88)')

  const linkText = linkLabelGroup
      .selectAll('text')
      .data(links)
      .join('text')
      .attr('font-size', 11)
      .attr('fill', '#475569')
      .attr('text-anchor', 'middle')
      .text((d) => shortenRelation(d.label))

  nodeGroupSelection = zoomLayer
      .append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .style('cursor', 'pointer')

  nodeGroupSelection.call(
      d3
          .drag()
          .on('start', (event, d) => {
            event.sourceEvent?.stopPropagation()
            isDragging.value = true

            if (!event.active) {
              simulation.alphaTarget(0.3).restart()
            }

            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d) => {
            clearDragState()

            if (!event.active) {
              simulation.alphaTarget(0)
            }

            d.fx = null
            d.fy = null
          }),
  )

  nodeGroupSelection.on('click', (event, d) => {
    if (event.defaultPrevented) return
    if (isDragging.value) return

    event.stopPropagation()
    emit('select', d.id)
  })

  nodeCircleSelection = nodeGroupSelection
      .append('circle')
      .attr('r', 28)
      .attr('fill', (d) => props.colors[d.category] || '#94a3b8')
      .attr('fill-opacity', 0.86)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)

  updateSelectedStyle()

  nodeGroupSelection
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .attr('fill', '#fff')
      .attr('font-size', 12)
      .attr('font-weight', 700)
      .text((d) => (d.label?.length > 5 ? `${d.label.slice(0, 5)}…` : d.label))

  tooltipSelection = d3
      .select(container)
      .append('div')
      .attr('class', 'graph-tooltip')
      .style('opacity', 0)

  nodeGroupSelection
      .on('mouseenter', (event, d) => {
        const metricHtml =
            Object.keys(d.metrics || {}).length > 0
                ? Object.entries(d.metrics)
                    .map(([k, v]) => `${k}：${v}`)
                    .join('<br/>')
                : '暂无指标信息'

        showTooltip(
            event,
            `
          <strong>${d.label}</strong><br/>
          ${d.category}<br/>
          ${metricHtml}
        `,
        )
      })
      .on('mousemove', (event) => {
        moveTooltip(event)
      })
      .on('mouseleave', () => {
        hideTooltip()
      })

  link
      .on('mouseenter', (event, d) => {
        showTooltip(
            event,
            `
          <strong>关系</strong><br/>
          ${(d.source?.label || d.source?.id || '')} → ${(d.target?.label || d.target?.id || '')}<br/>
          ${d.label}
        `,
        )
      })
      .on('mousemove', (event) => {
        moveTooltip(event)
      })
      .on('mouseleave', () => {
        hideTooltip()
      })

  simulation.on('tick', () => {
    link
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y)

    linkText
        .attr('x', (d) => (d.source.x + d.target.x) / 2)
        .attr('y', (d) => (d.source.y + d.target.y) / 2)

    const textNodes = linkText.nodes()

    linkLabelBg.each(function (_, i) {
      const textNode = textNodes[i]
      if (!textNode) return

      const bbox = textNode.getBBox()

      d3.select(this)
          .attr('x', bbox.x - 4)
          .attr('y', bbox.y - 2)
          .attr('width', bbox.width + 8)
          .attr('height', bbox.height + 4)
    })

    nodeGroupSelection.attr('transform', (d) => `translate(${d.x},${d.y})`)
  })

  // svg
  //     .transition()
  //     .duration(500)
  //     .call(zoom.transform, d3.zoomIdentity.translate(40, 20).scale(0.92))

  cleanup = () => {
    clearDragState()
    simulation.stop()
    hideTooltip()
    svg.remove()
    tooltipSelection?.remove()

    nodeCircleSelection = null
    nodeGroupSelection = null
    tooltipSelection = null
  }
}

function rerenderGraph() {
  clearDragState()
  cleanup?.()
  renderGraph()
}

onMounted(() => {
  renderGraph()

  resizeObserver = new ResizeObserver(() => {
    rerenderGraph()
  })

  if (containerRef.value) {
    resizeObserver.observe(containerRef.value)
  }

  window.addEventListener('pointerup', clearDragState)
  window.addEventListener('pointercancel', clearDragState)
  window.addEventListener('blur', clearDragState)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  cleanup?.()

  window.removeEventListener('pointerup', clearDragState)
  window.removeEventListener('pointercancel', clearDragState)
  window.removeEventListener('blur', clearDragState)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

watch(
    () => graphPayload.value,
    () => {
      rerenderGraph()
    },
    { deep: true },
)

watch(
    () => props.selectedNodeId,
    () => {
      updateSelectedStyle()
    },
)


</script>
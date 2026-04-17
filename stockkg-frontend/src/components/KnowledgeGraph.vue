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
let resizeObserver = null
let cleanup = null

const graphPayload = computed(() => ({
  nodes: props.graph.nodes.map((node) => ({ ...node })),
  edges: props.graph.edges.map((edge, index) => ({ ...edge, id: `${edge.source}-${edge.target}-${index}` })),
}))

function renderGraph() {
  if (!containerRef.value) return
  const container = containerRef.value
  container.innerHTML = ''

  width.value = container.clientWidth || 860
  height.value = container.clientHeight || 560

  const nodes = graphPayload.value.nodes
  const links = graphPayload.value.edges

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

  const simulation = d3
    .forceSimulation(nodes)
    .force(
      'link',
      d3
        .forceLink(links)
        .id((d) => d.id)
        .distance(130),
    )
    .force('charge', d3.forceManyBody().strength(-520))
    .force('center', d3.forceCenter(width.value / 2, height.value / 2))
    .force('collision', d3.forceCollide().radius((d) => (d.label.length > 4 ? 42 : 34)))

  const link = zoomLayer
    .append('g')
    .attr('stroke', 'rgba(148, 163, 184, 0.65)')
    .attr('stroke-width', 1.4)
    .selectAll('line')
    .data(links)
    .join('line')

  const linkText = zoomLayer
    .append('g')
    .selectAll('text')
    .data(links)
    .join('text')
    .attr('font-size', 11)
    .attr('fill', '#64748b')
    .attr('text-anchor', 'middle')
    .text((d) => d.label)

  const nodeGroup = zoomLayer
    .append('g')
    .selectAll('g')
    .data(nodes)
    .join('g')
    .style('cursor', 'pointer')
    .on('click', (_, d) => emit('select', d.id))
    .call(
      d3
        .drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event, d) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        }),
    )

  nodeGroup
    .append('circle')
    .attr('r', (d) => (d.id === props.selectedNodeId ? 34 : 28))
    .attr('fill', (d) => props.colors[d.category] || '#94a3b8')
    .attr('fill-opacity', (d) => (d.id === props.selectedNodeId ? 0.95 : 0.86))
    .attr('stroke', (d) => (d.id === props.selectedNodeId ? '#0f172a' : '#ffffff'))
    .attr('stroke-width', (d) => (d.id === props.selectedNodeId ? 3 : 2))

  nodeGroup
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', 4)
    .attr('fill', '#fff')
    .attr('font-size', 12)
    .attr('font-weight', 700)
    .text((d) => (d.label.length > 5 ? `${d.label.slice(0, 5)}…` : d.label))

  const tooltip = d3
    .select(container)
    .append('div')
    .attr('class', 'graph-tooltip')
    .style('opacity', 0)

  nodeGroup
    .on('mouseenter', (event, d) => {
      tooltip
        .style('opacity', 1)
        .html(`<strong>${d.label}</strong><br/>${d.category}<br/>评分：${d.score}`)
        .style('left', `${event.offsetX + 16}px`)
        .style('top', `${event.offsetY + 16}px`)
    })
    .on('mousemove', (event) => {
      tooltip.style('left', `${event.offsetX + 16}px`).style('top', `${event.offsetY + 16}px`)
    })
    .on('mouseleave', () => {
      tooltip.style('opacity', 0)
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

    nodeGroup.attr('transform', (d) => `translate(${d.x},${d.y})`)
  })

  svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity.translate(20, 20).scale(0.95))

  cleanup = () => {
    simulation.stop()
    svg.remove()
    tooltip.remove()
  }
}

watch(
  () => [graphPayload.value, props.selectedNodeId],
  () => {
    cleanup?.()
    renderGraph()
  },
  { deep: true },
)

onMounted(() => {
  renderGraph()
  resizeObserver = new ResizeObserver(() => {
    cleanup?.()
    renderGraph()
  })
  resizeObserver.observe(containerRef.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  cleanup?.()
})
</script>

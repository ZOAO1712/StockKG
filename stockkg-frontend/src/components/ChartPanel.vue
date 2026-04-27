<template>
  <div class="chart-panel">
    <div ref="chartRef" class="chart-panel-canvas"></div>
    <div v-if="showEmpty" class="chart-empty">暂无图表数据</div>
  </div>
</template>

<script setup>
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import {
  DatasetComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  DatasetComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  CanvasRenderer,
])

const props = defineProps({
  option: {
    type: Object,
    required: true,
  },
})

const chartRef = ref(null)
let chartInstance = null
let resizeObserver = null

const showEmpty = computed(() => {
  const series = Array.isArray(props.option?.series) ? props.option.series : []
  if (!series.length) return true

  return series.every((item) => {
    const data = Array.isArray(item?.data) ? item.data : []
    return data.length === 0
  })
})

function ensureChart() {
  if (!chartRef.value) return null

  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  return chartInstance
}

async function renderChart() {
  await nextTick()

  const chart = ensureChart()
  if (!chart) return

  if (showEmpty.value) {
    chart.clear()
    chart.resize()
    return
  }

  chart.setOption(props.option, true)
  chart.resize()
}

function resizeChart() {
  chartInstance?.resize()
}

onMounted(() => {
  renderChart()
  window.addEventListener('resize', resizeChart)

  if (window.ResizeObserver && chartRef.value) {
    resizeObserver = new ResizeObserver(() => resizeChart())
    resizeObserver.observe(chartRef.value)
  }
})

watch(
  () => props.option,
  () => {
    renderChart()
  },
  { deep: true },
)

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart)
  resizeObserver?.disconnect()
  resizeObserver = null
  chartInstance?.dispose()
  chartInstance = null
})
</script>

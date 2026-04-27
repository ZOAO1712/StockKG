<template>
  <div class="graph-page">
    <section class="graph-main-column">
      <div class="panel-card filter-card">
        <div class="panel-head panel-head-top">
          <div>
            <p class="panel-kicker">Explorer Tools</p>
            <h3>图谱控制台</h3>
            <p class="panel-desc">支持按股票代码或名称动态检索，并对当前图谱进行搜索和分类筛选。</p>
          </div>

          <div class="panel-actions">
            <div class="status-badge">
              <span class="status-label">当前股票</span>
              <strong>{{ currentStockLabel }}</strong>
            </div>
            <div class="status-badge">
              <span class="status-label">图谱规模</span>
              <strong>{{ store.filteredGraph.nodes.length }} 节点 / {{ store.filteredGraph.edges.length }} 关系</strong>
            </div>

            <button class="ghost-btn" type="button" @click="handleReset">
              重置筛选
            </button>
          </div>
        </div>

        <div class="toolbar-card">
          <div class="toolbar-card-head">
            <div class="toolbar-title-wrap">
              <div class="toolbar-icon">搜</div>
              <div>
                <div class="toolbar-title">股票动态检索</div>
                <div class="toolbar-subtitle">输入股票代码或名称关键词，系统会自动联想匹配结果</div>
              </div>
            </div>
          </div>

          <div class="search-area">
            <div class="stock-input-group">
              <label class="input-label">股票代码 / 名称</label>

              <div class="search-input-wrap">
                <input
                    v-model="queryText"
                    class="search-input code-input"
                    placeholder="请输入股票代码或名称，如：600519、茅台、平安"
                    @focus="handleInputFocus"
                    @blur="handleInputBlur"
                    @keyup.enter="handleLoadGraph"
                />

                <button
                    class="primary-btn"
                    type="button"
                    :disabled="store.loading || !canLoad"
                    @click="handleLoadGraph"
                >
                  {{ store.loading ? '加载中...' : '加载图谱' }}
                </button>

                <div
                    v-if="showSuggestions"
                    class="suggestion-panel"
                >
                  <div v-if="searchingSuggestions" class="suggestion-empty">
                    正在检索匹配股票...
                  </div>

                  <template v-else>
                    <button
                        v-for="item in suggestions"
                        :key="item.code"
                        type="button"
                        class="suggestion-item"
                        @mousedown.prevent="selectSuggestion(item)"
                    >
                      <div class="suggestion-main">
                        <strong>{{ item.code }}</strong>
                        <span>{{ item.name }}</span>
                      </div>
                      <div class="suggestion-sub">
                        <span v-if="item.company">{{ item.company }}</span>
                        <span v-if="item.company && item.industry">｜</span>
                        <span v-if="item.industry">{{ item.industry }}</span>
                      </div>
                    </button>

                    <div v-if="!suggestions.length" class="suggestion-empty">
                      未找到匹配股票，请换个关键词
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <div class="stock-helper-row">
            <span class="helper-text">
              当前图谱：<strong>{{ currentStockLabel }}</strong>
            </span>
            <span class="helper-text" :class="{ error: helperIsError }">
              {{ queryHint }}
            </span>
          </div>
        </div>

        <div class="toolbar-divider"></div>

        <div class="toolbar-card">
          <div class="toolbar-card-head">
            <div class="toolbar-title-wrap">
              <div class="toolbar-icon filter">筛</div>
              <div>
                <div class="toolbar-title">图谱筛选</div>
                <div class="toolbar-subtitle">在当前股票图谱中搜索节点，并按类别显示或隐藏</div>
              </div>
            </div>
          </div>

          <div class="filter-toolbar">
            <input
                :value="store.keyword"
                class="search-input"
                placeholder="在当前图谱中搜索节点名称 / 类别 / 指标，例如：白酒、概念、PE"
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
              {{ item.key }}（{{ item.count }}）
            </button>
          </div>
        </div>
      </div>

      <div class="panel-card graph-panel-card">
        <div class="panel-head">
          <div>
            <p class="panel-kicker">Interactive Graph</p>
            <h3>图谱交互区</h3>
          </div>
          <span class="panel-caption">
            当前股票：{{ currentStockCode }} ｜ 展示 {{ store.filteredGraph.nodes.length }} 个节点 / {{ store.filteredGraph.edges.length }} 条关系
          </span>
        </div>

        <div v-if="store.loading" class="graph-state graph-loading">
          图谱数据加载中...
        </div>
        <div v-else-if="store.error" class="graph-state graph-error">
          {{ store.error }}
        </div>

        <KnowledgeGraph
            v-else
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
            <p class="panel-kicker">Backend Connected</p>
            <h3>当前数据来源</h3>
          </div>
        </div>

<!--        <ul class="helper-list">-->
<!--          <li>图谱加载接口：<code>/api/graph/stock/{code}</code></li>-->
<!--          <li>动态检索接口：<code>/api/graph/stocks/search?keyword=关键词</code></li>-->
<!--          <li>支持输入股票代码或名称关键词动态联想。</li>-->
<!--          <li>关系标签已转为中文显示。</li>-->
<!--        </ul>-->
      </div>
    </aside>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DetailPanel from '@/components/DetailPanel.vue'
import KnowledgeGraph from '@/components/KnowledgeGraph.vue'
import { useGraphStore } from '@/stores/graph'
import { searchStocks } from '@/api/graph'

const store = useGraphStore()
const route = useRoute()
const router = useRouter()

const initialCode = String(route.query.code || route.params.code || '600519')

const currentStockCode = ref(initialCode)
const currentStockName = ref('')
const queryText = ref(initialCode)

const suggestions = ref([])
const showSuggestions = ref(false)
const searchingSuggestions = ref(false)

let searchTimer = null
let blurTimer = null

const currentStockLabel = computed(() => {
  return currentStockName.value
      ? `${currentStockCode.value} ${currentStockName.value}`
      : currentStockCode.value
})

const canLoad = computed(() => {
  const keyword = String(queryText.value || '').trim()
  if (!keyword) return false
  if (/^\d{6}$/.test(keyword)) return true
  return suggestions.value.length > 0
})

const helperIsError = computed(() => {
  const keyword = String(queryText.value || '').trim()
  if (!keyword) return false
  if (/^\d{1,5}$/.test(keyword)) return true
  return false
})

const queryHint = computed(() => {
  const keyword = String(queryText.value || '').trim()

  if (!keyword) {
    return '可输入 6 位股票代码，或输入股票名称关键词'
  }

  if (/^\d{1,5}$/.test(keyword)) {
    return '股票代码需为 6 位数字'
  }

  if (/^\d{6}$/.test(keyword)) {
    return '按回车或点击“加载图谱”即可查询'
  }

  if (searchingSuggestions.value) {
    return '正在动态检索匹配股票...'
  }

  if (suggestions.value.length) {
    return `已找到 ${suggestions.value.length} 条候选结果，可直接点击加载`
  }

  return '未找到匹配结果，请换个关键词'
})

async function fetchSuggestions(keyword) {
  const text = String(keyword || '').trim()
  if (!text) {
    suggestions.value = []
    showSuggestions.value = false
    return
  }

  searchingSuggestions.value = true
  try {
    const list = await searchStocks(text, 8)
    suggestions.value = Array.isArray(list) ? list : []
    showSuggestions.value = true
  } catch (error) {
    console.error('动态检索股票失败', error)
    suggestions.value = []
    showSuggestions.value = true
  } finally {
    searchingSuggestions.value = false
  }
}

async function loadGraphByCode(code, fallbackName = '') {
  const finalCode = String(code || '').trim()
  if (!/^\d{6}$/.test(finalCode)) return

  await store.fetchGraph(finalCode)

  const stockNode = store.rawNodes.find((node) => node.category === '股票')
  currentStockCode.value = finalCode
  currentStockName.value = stockNode?.label || fallbackName || ''
  queryText.value = finalCode

  router.replace({
    query: {
      ...route.query,
      code: finalCode,
    },
  })
}

async function handleLoadGraph() {
  const keyword = String(queryText.value || '').trim()

  if (/^\d{6}$/.test(keyword)) {
    await loadGraphByCode(keyword)
    showSuggestions.value = false
    return
  }

  if (suggestions.value.length) {
    await selectSuggestion(suggestions.value[0])
  }
}

async function selectSuggestion(item) {
  if (!item?.code) return
  showSuggestions.value = false
  await loadGraphByCode(item.code, item.name || '')
}

function handleInputFocus() {
  if (suggestions.value.length || searchingSuggestions.value) {
    showSuggestions.value = true
  }
}

function handleInputBlur() {
  blurTimer = setTimeout(() => {
    showSuggestions.value = false
  }, 180)
}

function handleReset() {
  store.resetFilters()
}

watch(
    queryText,
    (value) => {
      const keyword = String(value || '').trim()

      if (searchTimer) clearTimeout(searchTimer)

      if (!keyword) {
        suggestions.value = []
        showSuggestions.value = false
        return
      }

      searchTimer = setTimeout(() => {
        fetchSuggestions(keyword)
      }, 250)
    },
    { immediate: false },
)

onMounted(async () => {
  await loadGraphByCode(initialCode)
})

watch(
    () => route.query.code,
    async (newCode) => {
      if (newCode && newCode !== currentStockCode.value) {
        await loadGraphByCode(String(newCode))
      }
    },
)

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer)
  if (blurTimer) clearTimeout(blurTimer)
})

function chipStyle(item) {
  const active = store.enabledCategories.includes(item.key)
  return {
    borderColor: item.color,
    color: active ? '#fff' : item.color,
    backgroundColor: active ? item.color : `${item.color}12`,
  }
}
</script>
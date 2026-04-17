<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div>
        <div class="brand-card">
          <span class="brand-badge">Vue3 Demo</span>
          <h1>金融知识图谱前端</h1>
          <p>
            面向毕设展示的前端骨架：图谱浏览、节点详情、指标统计、搜索筛选、路由与状态管理。
          </p>
        </div>

        <nav class="nav-menu">
          <RouterLink class="nav-item" to="/">
            <span>总览面板</span>
            <small>Overview</small>
          </RouterLink>
          <RouterLink class="nav-item" to="/graph">
            <span>图谱探索</span>
            <small>Knowledge Graph</small>
          </RouterLink>
        </nav>
      </div>

      <div class="sidebar-footer">
        <div class="tip-card">
          <strong>推荐扩展</strong>
          <p>后续可以直接接 Neo4j、GraphQL 或后端接口，把 mock 数据替换为真实图谱数据。</p>
        </div>
      </div>
    </aside>

    <main class="main-content">
      <header class="page-header">
        <div>
          <p class="page-kicker">Knowledge Graph Frontend</p>
          <h2>{{ route.meta.title || '知识图谱演示' }}</h2>
        </div>
        <div class="header-actions">
          <span class="status-dot"></span>
          <span>项目结构已适配 Vue 3 单页应用</span>
        </div>
      </header>

      <section class="page-body">
        <RouterView />
      </section>
    </main>
  </div>
</template>

<script setup>
import { RouterLink, RouterView, useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <RouterView v-if="route.meta.authPage" />

  <div v-else class="app-shell">
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
          <RouterLink class="nav-item" to="/finance">
            <span>财经资讯</span>
            <small>Finance</small>
          </RouterLink>
          <RouterLink class="nav-item" to="/manage">
            <span>{{ authStore.isAdmin ? '后台管理' : '通知中心' }}</span>
            <small>{{ authStore.isAdmin ? 'Admin Notice' : 'Notice Inbox' }}</small>
          </RouterLink>
          <RouterLink class="nav-item" to="/ai">
            <span>DeepSeek 助手</span>
            <small>DeepSeek</small>
          </RouterLink>
        </nav>
      </div>

      <div class="sidebar-footer">
        <div class="tip-card">
          <strong>当前用户</strong>
          <p>{{ authStore.user?.username || '未登录' }} · {{ roleLabel }}</p>
          <button class="logout-button" type="button" @click="handleLogout">退出登录</button>
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
          <span>已登录：{{ authStore.user?.username || '用户' }} · {{ roleLabel }}</span>
        </div>
      </header>

      <section class="page-body">
        <RouterView />
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const roleLabelMap = {
  ADMIN: '管理员',
  USER: '普通用户',
  GUEST: '访客',
}

const roleLabel = computed(() => roleLabelMap[authStore.role] || authStore.role || '-')

function handleLogout() {
  authStore.logout()
  router.replace('/login')
}
</script>

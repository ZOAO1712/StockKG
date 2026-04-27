import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/AuthView.vue'),
      meta: { title: '登录', authPage: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/AuthView.vue'),
      meta: { title: '注册', authPage: true },
    },
    {
      path: '/',
      name: 'overview',
      component: () => import('@/views/HomeView.vue'),
      meta: { title: '总览面板', requiresAuth: true },
    },
    {
      path: '/graph',
      name: 'graph',
      component: () => import('@/views/GraphView.vue'),
      meta: { title: '图谱探索', requiresAuth: true },
    },
    {
      path: '/finance',
      name: 'finance',
      component: () => import('@/views/FinanceView.vue'),
      meta: { title: '财经资讯中心', requiresAuth: true },
    },
    {
      path: '/manage',
      name: 'manage',
      component: () => import('@/views/ManageView.vue'),
      meta: { title: '后台管理', requiresAuth: true },
    },
    {
      path: '/ai',
      name: 'ai',
      component: () => import('@/views/AiAssistantView.vue'),
      meta: { title: 'DeepSeek 助手', requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach((to) => {
  const token = localStorage.getItem('stockkg_token')

  if (to.meta.requiresAuth && !token) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (to.meta.authPage && token) {
    return { path: '/' }
  }

  return true
})

export default router

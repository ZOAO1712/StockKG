import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getDashboardOverview } from '@/api/dashboard'

function normalizeOverview(raw = {}) {
    return {
        nodeCount: raw.nodeCount ?? 0,
        relationCount: raw.relationCount ?? 0,
        categoryCount: raw.categoryCount ?? 0,
        averageScore: raw.averageScore ?? 0,
        topNodes: Array.isArray(raw.topNodes) ? raw.topNodes : [],
        categoryDistribution: Array.isArray(raw.categoryDistribution) ? raw.categoryDistribution : [],
        scoreList: Array.isArray(raw.scoreList) ? raw.scoreList : []
    }
}

export const useDashboardStore = defineStore('dashboard', () => {
    const loading = ref(false)
    const overview = ref(normalizeOverview())

    async function fetchOverview() {
        loading.value = true
        try {
            const res = await getDashboardOverview()
            const data = res?.data?.data ?? res?.data ?? {}
            overview.value = normalizeOverview(data)
        } catch (error) {
            console.error('获取总览数据失败:', error)
            overview.value = normalizeOverview()
        } finally {
            loading.value = false
        }
    }

    return {
        loading,
        overview,
        fetchOverview
    }
})
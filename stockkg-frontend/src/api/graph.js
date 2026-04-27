import axios from 'axios'

export async function getStockGraph(code = '600519') {
    const res = await axios.get(`/api/graph/stock/${code}`)
    const raw = res.data?.data || {}

    return {
        nodes: raw.nodes || [],
        edges: raw.links || []
    }
}

export async function searchStocks(keyword, limit = 8) {
    const res = await axios.get('/api/graph/stocks/search', {
        params: { keyword, limit }
    })
    return res.data?.data || []
}
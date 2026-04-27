import axios from 'axios'

export async function getDashboardOverview() {
    const res = await axios.get('/api/dashboard/overview')
    return res.data?.data || {}
}
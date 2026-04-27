import axios from 'axios'

export async function chatJsonWithDeepSeek(messages, temperature = 0.3) {
    const response = await axios.post('/api/ai/chat/json', {
        messages,
        temperature
    })

    const result = response.data
    if (!result || result.code !== 200) {
        throw new Error(result?.message || '接口调用失败')
    }

    return result.data
}
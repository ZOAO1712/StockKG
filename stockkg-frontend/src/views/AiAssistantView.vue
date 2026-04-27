<template>
  <section class="assistant-page">
    <div class="assistant-card">
      <div class="message-list" ref="listRef">
        <div
            v-for="(item, index) in messages"
            :key="index"
            :class="['message-row', item.role]"
        >
          <div class="bubble">
            <div class="role">{{ item.role === 'user' ? '我' : 'DeepSeek' }}</div>

            <template v-if="item.role === 'assistant'">
              <div v-if="item.answer" class="content structured-body">
                <h2 v-if="item.answer.title">{{ item.answer.title }}</h2>
                <p v-if="item.answer.intro">{{ item.answer.intro }}</p>

                <section
                    v-for="(section, sIndex) in item.answer.sections"
                    :key="sIndex"
                    class="structured-section"
                >
                  <h3 v-if="section.heading">{{ section.heading }}</h3>

                  <p v-if="section.type === 'paragraph'">
                    {{ section.content }}
                  </p>

                  <ul v-else-if="section.type === 'list'">
                    <li v-for="(subItem, subIndex) in section.items || []" :key="subIndex">
                      {{ subItem }}
                    </li>
                  </ul>
                </section>
              </div>

              <div v-else-if="item.isThinking" class="thinking-placeholder">
                正在生成回答...
              </div>
            </template>

            <template v-else>
              <div class="content">{{ item.content }}</div>
            </template>
          </div>
        </div>
      </div>

      <div class="input-panel">
        <textarea
            v-model="inputText"
            class="message-input"
            placeholder="请输入你的问题，例如：请解释市盈率 PE 的含义"
            @keydown.enter.exact.prevent="sendMessage"
        />
        <div class="input-actions">
          <button class="ghost-btn" type="button" @click="clearChat">清空对话</button>
          <button
              class="primary-btn"
              type="button"
              :disabled="loading || !inputText.trim()"
              @click="sendMessage"
          >
            {{ loading ? `思考中 ${thinkingSeconds}s` : '发送' }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref } from 'vue'
import { chatJsonWithDeepSeek } from '@/api/ai'

const inputText = ref('')
const loading = ref(false)
const listRef = ref(null)
const thinkingSeconds = ref(0)

let thinkingTimer = null

const createWelcomeAnswer = () => ({
  title: '你好',
  intro: '我是 DeepSeek 助手。你可以问我股票知识、图谱节点含义、系统功能说明等问题。',
  sections: []
})

const messages = ref([
  {
    role: 'assistant',
    answer: createWelcomeAnswer(),
    isThinking: false,
    spentSeconds: 0
  }
])

const scrollToBottom = async () => {
  await nextTick()
  if (listRef.value) {
    listRef.value.scrollTop = listRef.value.scrollHeight
  }
}

const startThinkingTimer = () => {
  stopThinkingTimer()
  thinkingSeconds.value = 0
  thinkingTimer = setInterval(() => {
    thinkingSeconds.value += 1
  }, 1000)
}

const stopThinkingTimer = () => {
  if (thinkingTimer) {
    clearInterval(thinkingTimer)
    thinkingTimer = null
  }
}

const answerToText = (answer) => {
  if (!answer) return ''

  const parts = []

  if (answer.title) parts.push(answer.title)
  if (answer.intro) parts.push(answer.intro)

  for (const section of answer.sections || []) {
    if (section.heading) parts.push(section.heading)

    if (section.type === 'list') {
      for (const item of section.items || []) {
        parts.push(`- ${item}`)
      }
    } else if (section.content) {
      parts.push(section.content)
    }
  }

  return parts.join('\n')
}

const buildHistoryMessages = () => {
  return messages.value
      .map((item) => {
        if (item.role === 'user') {
          return {
            role: 'user',
            content: item.content || ''
          }
        }

        return {
          role: 'assistant',
          content: answerToText(item.answer)
        }
      })
      .filter((item) => item.content.trim())
}

onBeforeUnmount(() => {
  stopThinkingTimer()
})

const sendMessage = async () => {
  const text = inputText.value.trim()
  if (!text || loading.value) return

  messages.value.push({
    role: 'user',
    content: text
  })

  inputText.value = ''

  const assistantMessage = {
    role: 'assistant',
    answer: null,
    isThinking: true,
    spentSeconds: 0
  }

  messages.value.push(assistantMessage)

  loading.value = true
  startThinkingTimer()
  await scrollToBottom()

  try {
    const requestMessages = buildHistoryMessages()
    const data = await chatJsonWithDeepSeek(requestMessages, 0.3)

    assistantMessage.answer = {
      title: data?.title || '回答',
      intro: data?.intro || '',
      sections: Array.isArray(data?.sections) ? data.sections : []
    }
    assistantMessage.isThinking = false
    assistantMessage.spentSeconds = thinkingSeconds.value
  } catch (error) {
    assistantMessage.answer = {
      title: '请求失败',
      intro: error?.message || '接口调用失败，请检查后端配置和 API Key。',
      sections: []
    }
    assistantMessage.isThinking = false
    assistantMessage.spentSeconds = thinkingSeconds.value
  } finally {
    loading.value = false
    stopThinkingTimer()
    await scrollToBottom()
  }
}

const clearChat = () => {
  stopThinkingTimer()
  loading.value = false
  thinkingSeconds.value = 0

  messages.value = [
    {
      role: 'assistant',
      answer: createWelcomeAnswer(),
      isThinking: false,
      spentSeconds: 0
    }
  ]
}
</script>


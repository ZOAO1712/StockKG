import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axios from 'axios'
import App from './App.vue'
import router from './router'
import './styles.css'

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('stockkg_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.mount('#app')

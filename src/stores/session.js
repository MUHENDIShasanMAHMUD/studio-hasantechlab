import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiFetch } from '../api.js'

export const useSessionStore = defineStore('session', () => {
  const deviceToken = ref(localStorage.getItem('techlab_device_token') || crypto.randomUUID())
  const error = ref('')
  const loading = ref(false)
  localStorage.setItem('techlab_device_token', deviceToken.value)

  async function init() {
    loading.value = true
    error.value = ''
    try { await apiFetch('/user/init', { method: 'POST', body: JSON.stringify({}) }) }
    catch (err) { error.value = err.message }
    finally { loading.value = false }
  }
  return { deviceToken, error, loading, init }
})

<template>
  <transition name="toast-fade">
    <div v-if="visible" class="toast-container" :class="type">
      <span class="toast-icon">{{ icon }}</span>
      <span class="toast-message">{{ message }}</span>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const visible = ref(false)
const message = ref('')
const type = ref<'success' | 'error' | 'info'>('info')

const icon = computed(() => {
  switch (type.value) {
    case 'success': return '✓'
    case 'error': return '✕'
    default: return 'ℹ'
  }
})

let timer: number | null = null

const show = (msg: string, t: 'success' | 'error' | 'info' = 'info', duration = 3000) => {
  message.value = msg
  type.value = t
  visible.value = true
  
  if (timer) clearTimeout(timer)
  
  timer = window.setTimeout(() => {
    visible.value = false
  }, duration)
}

defineExpose({ show })
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 9999;
  border: 1px solid #e8e6e1;
  font-family: "Noto Serif SC", sans-serif;
}

.toast-container.success { border-color: #27ae60; color: #27ae60; }
.toast-container.error { border-color: #e74c3c; color: #e74c3c; }
.toast-container.info { border-color: #3498db; color: #3498db; }

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}
</style>

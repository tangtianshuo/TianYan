<template>
  <div class="bagua-select">
    <div class="select-wrapper">
      <button
        :aria-expanded="isOpen"
        aria-haspopup="listbox"
        :aria-labelledby="`label-${id}`"
        class="select-trigger ink-border ink-transition"
        @click="toggleOpen"
      >
        <span class="selected-value">
          {{ selectedLabel || placeholder }}
        </span>
        <span class="select-icon" :class="{ 'rotate': isOpen }">
          ▼
        </span>
      </button>

      <transition
        name="slide-fade"
        @enter="onDropdownEnter"
        @leave="onDropdownLeave"
      >
        <div
          v-if="isOpen"
          role="listbox"
          class="select-dropdown ink-border"
        >
          <div
            v-if="filteredOptions.length === 0"
            class="select-empty"
          >
            {{ emptyText }}
          </div>

          <button
            v-for="option in filteredOptions"
            :key="option.id"
            role="option"
            :aria-selected="option.value === modelValue"
            :disabled="option.disabled"
            class="select-option ink-transition"
            :class="{
              'selected': option.value === modelValue,
              'disabled': option.disabled
            }"
            @click="selectOption(option)"
          >
            {{ option.label }}
          </button>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { SelectOption } from '@/types'

interface Props {
  id: string
  modelValue: string | null
  options: SelectOption[]
  placeholder?: string
  emptyText?: string
  disabled?: boolean
  searchable?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string | null): void
  (e: 'change', value: string | null, label: string | null): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请选择',
  emptyText: '无可用选项',
  disabled: false,
  searchable: true
})

const emit = defineEmits<Emits>()

const isOpen = ref(false)
const searchText = ref('')

const selectedLabel = computed(() => {
  const option = props.options.find(o => o.value === props.modelValue)
  return option?.label || null
})

const filteredOptions = computed(() => {
  if (!props.searchable || !searchText.value) {
    return props.options
  }
  return props.options.filter(option =>
    option.label.toLowerCase().includes(searchText.value.toLowerCase())
  )
})

const toggleOpen = () => {
  if (!props.disabled) {
    isOpen.value = !isOpen.value
  }
}

const selectOption = (option: SelectOption) => {
  if (!option.disabled) {
    emit('update:modelValue', option.value)
    emit('change', option.value, option.label)
    isOpen.value = false
    searchText.value = ''
  }
}

const closeDropdown = () => {
  isOpen.value = false
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.bagua-select')) {
    closeDropdown()
  }
}

const onDropdownEnter = (el: Element) => {
  const element = el as HTMLElement
  element.style.opacity = '0'
  element.style.transform = 'translateY(-10px)'
  element.offsetHeight
  element.style.opacity = '1'
  element.style.transform = 'translateY(0)'
}

const onDropdownLeave = (el: Element) => {
  const element = el as HTMLElement
  element.style.opacity = '0'
  element.style.transform = 'translateY(-10px)'
}

watch(() => props.modelValue, () => {
  searchText.value = ''
})

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped lang="css">
.bagua-select {
  width: 100%;
  position: relative;
  font-family: inherit;
}

.select-wrapper {
  position: relative;
  width: 100%;
}

.select-trigger {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  background-color: var(--color-card);
  color: var(--color-foreground);
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  text-align: left;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  line-height: 1.5;
}

.select-trigger:hover:not(:disabled) {
  border-color: var(--color-primary);
  background-color: var(--color-muted);
}

.select-trigger:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
  box-shadow: 0 0 0 3px var(--color-ring, currentColor);
  opacity: 0.8;
}

.select-trigger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.selected-value {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-icon {
  flex-shrink: 0;
  width: 1em;
  height: 1em;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  transition: transform 0.2s ease;
}

.select-icon.rotate {
  transform: rotate(180deg);
}

.select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.25rem;
  background-color: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  z-index: 1000;
  min-width: 100%;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.select-empty {
  padding: 0.75rem;
  text-align: center;
  color: var(--color-muted-foreground);
  font-size: 0.875rem;
}

.select-option {
  width: 100%;
  padding: 0.5rem 0.75rem;
  text-align: left;
  border: none;
  background-color: transparent;
  color: var(--color-foreground);
  cursor: pointer;
  font-size: 0.875rem;
  line-height: 1.5;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
}

.select-option:hover:not(.disabled) {
  background-color: var(--color-muted);
}

.select-option.selected {
  background-color: var(--color-primary);
  color: var(--color-primary-foreground);
  font-weight: 500;
}

.select-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  color: var(--color-muted-foreground);
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

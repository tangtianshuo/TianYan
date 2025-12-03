<template>
  <div class="dropdown-cell">
    <div
      v-for="(dropdown, index) in dropdowns"
      :key="dropdown.id"
      class="dropdown-item"
    >
      <label
        :for="`dropdown-${cellId}-${index}`"
        class="dropdown-label"
      >
        {{ `选项 ${index + 1}` }}
      </label>
      <BaguaSelect
        :id="`dropdown-${cellId}-${index}`"
        :model-value="dropdown.selectedValue"
        :options="availableOptions[index] || []"
        placeholder="请选择"
        @update:model-value="(value) => handleSelect(index, value)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import BaguaSelect from './BaguaSelect.vue'
import type { SelectOption, DropdownState } from '@/types'
import { ConfigManager } from '@/utils/config-loader'

interface Props {
  cellId: string
  dropdowns: DropdownState[]
  selectedValues: string[]
}

interface Emits {
  (e: 'update', index: number, value: string | null): void
  (e: 'change', cellState: DropdownState[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const allOptions = ref<{ [key: string]: SelectOption[] }>({})
const config = ref<any>(null)

const availableOptions = computed(() => {
  const categories = config.value?.categories || ['天干', '地支', '八卦', '五行']
  return categories.map((category: string) => {
    const options = allOptions.value[category] || []
    // 过滤掉已选择的选项（除了当前行）
    return options.filter(opt => !props.selectedValues.includes(opt.value))
  })
})

const handleSelect = async (index: number, value: string | null) => {
  emit('update', index, value)
}

const loadConfig = async () => {
  try {
    config.value = await ConfigManager.loadConfig()
    const categories = config.value?.categories || ['天干', '地支', '八卦', '五行']
    
    for (const category of categories) {
      const options = await ConfigManager.getOptionsForCategory(category)
      allOptions.value[category] = options
    }
  } catch (error) {
    console.error('[DropdownCell] Error loading config:', error)
  }
}

onMounted(() => {
  loadConfig()
})
</script>

<style scoped lang="css">
.dropdown-cell {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  padding: 0.75rem;
}

.dropdown-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.dropdown-label {
  font-size: 0.75rem;
  color: var(--color-muted-foreground);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

@media (max-width: 768px) {
  .dropdown-cell {
    grid-template-columns: 1fr;
  }
}
</style>

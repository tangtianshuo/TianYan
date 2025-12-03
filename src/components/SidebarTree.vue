<template>
  <div class="sidebar-tree">
    <div class="tree-header">
      <h2 class="tree-title">保存的配置</h2>
      <button
        class="tree-action-btn"
        title="刷新"
        @click="refreshRecords"
      >
        ↻
      </button>
    </div>

    <div class="tree-content">
      <div
        v-if="groupedRecords.length === 0"
        class="tree-empty"
      >
        暂无保存的配置
      </div>

      <div
        v-for="group in groupedRecords"
        :key="group.category"
        class="tree-group"
      >
        <button
          class="tree-group-toggle"
          @click="toggleGroup(group.category)"
        >
          <span class="toggle-icon" :class="{ 'rotated': expandedGroups.has(group.category) }">
            ▶
          </span>
          <span class="group-name">{{ group.category || '未分类' }}</span>
          <span class="group-count">({{ group.records.length }})</span>
        </button>

        <transition name="expand">
          <div
            v-if="expandedGroups.has(group.category)"
            class="tree-items"
          >
            <button
              v-for="record in group.records"
              :key="record.id"
              class="tree-item"
              :class="{ 'selected': selectedRecordId === record.id }"
              @click="selectRecord(record)"
            >
              <span class="item-name">{{ record.name }}</span>
              <span class="item-date">{{ formatDate(record.updatedAt) }}</span>
              <div class="item-actions">
                <button
                  class="item-action delete-btn"
                  title="删除"
                  @click.stop="deleteRecord(record.id)"
                >
                  ✕
                </button>
              </div>
            </button>
          </div>
        </transition>
      </div>
    </div>

    <div class="tree-footer">
      <button
        v-if="selectedRecordId"
        class="footer-btn load-btn"
        @click="loadSelectedRecord"
      >
        加载选中配置
      </button>
      <button
        v-if="groupedRecords.length > 0"
        class="footer-btn clear-all-btn"
        @click="clearAllRecords"
      >
        清空所有
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { SavedRecord } from '@/types'
import { StorageManager } from '@/utils/storage'

interface Emits {
  (e: 'load', record: SavedRecord): void
}

const emit = defineEmits<Emits>()

const records = ref<SavedRecord[]>([])
const selectedRecordId = ref<string | null>(null)
const expandedGroups = ref<Set<string>>(new Set())

const groupedRecords = computed(() => {
  const groups = new Map<string, SavedRecord[]>()
  
  records.value.forEach(record => {
    const category = record.category || '未分类'
    if (!groups.has(category)) {
      groups.set(category, [])
    }
    groups.get(category)!.push(record)
  })
  
  // 按分类和更新时间排序
  return Array.from(groups.entries()).map(([category, items]) => ({
    category,
    records: items.sort((a, b) => b.updatedAt - a.updatedAt)
  })).sort((a, b) => a.category.localeCompare(b.category))
})

const refreshRecords = () => {
  records.value = StorageManager.getAllRecords()
  selectedRecordId.value = null
}

const toggleGroup = (category: string) => {
  if (expandedGroups.value.has(category)) {
    expandedGroups.value.delete(category)
  } else {
    expandedGroups.value.add(category)
  }
}

const selectRecord = (record: SavedRecord) => {
  selectedRecordId.value = record.id
}

const loadSelectedRecord = () => {
  const record = records.value.find(r => r.id === selectedRecordId.value)
  if (record) {
    emit('load', record)
  }
}

const deleteRecord = (recordId: string) => {
  if (confirm('确定要删除这个配置吗？')) {
    StorageManager.deleteRecord(recordId)
    refreshRecords()
  }
}

const clearAllRecords = () => {
  if (confirm('确定要清空所有保存的配置吗？这个操作不可撤销。')) {
    StorageManager.clearAll()
    refreshRecords()
  }
}

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN')
}

// 初始化时展开第一个分组
watch(() => groupedRecords.value, (newVal) => {
  if (newVal.length > 0 && expandedGroups.value.size === 0) {
    expandedGroups.value.add(newVal[0].category)
  }
}, { immediate: true })

onMounted(() => {
  refreshRecords()
})
</script>

<style scoped lang="css">
.sidebar-tree {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-sidebar);
  border-right: 1px solid var(--color-border);
}

.tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.tree-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-foreground);
}

.tree-action-btn {
  padding: 0.25rem 0.5rem;
  border: none;
  background-color: transparent;
  color: var(--color-foreground);
  cursor: pointer;
  font-size: 1.125rem;
  transition: all 0.2s ease;
  border-radius: var(--radius-md);
}

.tree-action-btn:hover {
  background-color: var(--color-primary);
  color: var(--color-primary-foreground);
}

.tree-content {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.tree-empty {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--color-muted-foreground);
  font-size: 0.875rem;
}

.tree-group {
  margin-bottom: 0.5rem;
}

.tree-group-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: none;
  background-color: transparent;
  color: var(--color-foreground);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: var(--radius-md);
  text-align: left;
  transition: all 0.2s ease;
}

.tree-group-toggle:hover {
  background-color: var(--color-primary);
  color: var(--color-primary-foreground);
}

.toggle-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1em;
  height: 1em;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.toggle-icon.rotated {
  transform: rotate(90deg);
}

.group-name {
  flex: 1;
}

.group-count {
  font-size: 0.75rem;
  color: var(--color-muted-foreground);
}

.tree-items {
  padding-left: 0.5rem;
}

.tree-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  margin-bottom: 0.25rem;
  border: 1px solid transparent;
  background-color: transparent;
  color: var(--color-foreground);
  cursor: pointer;
  font-size: 0.8125rem;
  border-radius: var(--radius-md);
  text-align: left;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.tree-item:hover {
  background-color: var(--color-primary);
  color: var(--color-primary-foreground);
}

.tree-item.selected {
  background-color: var(--color-primary);
  color: var(--color-primary-foreground);
  border-color: var(--color-primary);
}

.item-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-date {
  font-size: 0.75rem;
  color: var(--color-muted-foreground);
  margin-right: 0.25rem;
}

.item-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.tree-item:hover .item-actions {
  opacity: 1;
}

.item-action {
  padding: 0.25rem 0.375rem;
  border: none;
  background-color: transparent;
  color: var(--color-accent);
  cursor: pointer;
  font-size: 0.75rem;
  border-radius: 2px;
  transition: all 0.15s ease;
}

.item-action:hover {
  background-color: var(--color-accent-light);
  color: var(--color-card);
}

.delete-btn:hover {
  background-color: #e74c3c;
  color: white;
}

.tree-footer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid var(--color-border);
}

.footer-btn {
  padding: 0.625rem;
  border: 1px solid var(--color-border);
  background-color: transparent;
  color: var(--color-foreground);
  cursor: pointer;
  font-size: 0.875rem;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.footer-btn:hover {
  background-color: var(--color-primary);
  color: var(--color-primary-foreground);
  border-color: var(--color-primary);
}

.load-btn {
  background-color: var(--color-primary);
  color: var(--color-primary-foreground);
  border-color: var(--color-primary);
}

.load-btn:hover {
  opacity: 0.9;
}

.clear-all-btn {
  background-color: #e74c3c;
  color: white;
  border-color: #e74c3c;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

@media (max-width: 768px) {
  .sidebar-tree {
    max-height: 300px;
    border-right: none;
    border-bottom: 1px solid var(--color-border);
  }

  .item-date {
    display: none;
  }
}
</style>

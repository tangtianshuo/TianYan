/**
 * 记录管理组合式函数
 */

import { ref } from "vue"
import type { SavedRecord, GridState } from "@/types"
import { StorageManager } from "@/utils/storage"

export function useRecordManager() {
  const currentRecord = ref<SavedRecord | null>(null)

  /**
   * 加载指定记录
   */
  const loadRecord = (record: SavedRecord) => {
    currentRecord.value = record
    return record.data
  }

  /**
   * 保存当前配置
   */
  const saveRecord = (name: string, category: string, gridState: GridState): string => {
    const recordId = `${category}-${Date.now()}`

    StorageManager.saveRecord({
      id: recordId,
      name,
      category,
      data: gridState,
    })

    console.log("[v0] Record saved:", { recordId, name, category })
    return recordId
  }

  /**
   * 更新现有记录
   */
  const updateRecord = (recordId: string, name: string, gridState: GridState) => {
    const records = StorageManager.getAllRecords()
    const record = records.find((r) => r.id === recordId)

    if (record) {
      StorageManager.saveRecord({
        ...record,
        id: recordId,
        name,
        data: gridState,
      })
    }
  }

  /**
   * 删除记录
   */
  const deleteRecord = (recordId: string) => {
    StorageManager.deleteRecord(recordId)
    if (currentRecord.value?.id === recordId) {
      currentRecord.value = null
    }
  }

  /**
   * 获取所有保存的记录
   */
  const getAllRecords = (): SavedRecord[] => {
    return StorageManager.getAllRecords()
  }

  /**
   * 清空所有记录
   */
  const clearAllRecords = () => {
    StorageManager.clearAll()
    currentRecord.value = null
  }

  return {
    currentRecord,
    loadRecord,
    saveRecord,
    updateRecord,
    deleteRecord,
    getAllRecords,
    clearAllRecords,
  }
}

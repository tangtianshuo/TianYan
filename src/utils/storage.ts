/**
 * 本地存储工具函数
 */

const STORAGE_KEY_PREFIX = "baGua_"
const SAVED_RECORDS_KEY = `${STORAGE_KEY_PREFIX}saved_records`

export class StorageManager {
  /**
   * 保存九宫格状态
   */
  static saveGridState(recordId: string, gridState: any): void {
    try {
      const key = `${STORAGE_KEY_PREFIX}${recordId}`
      localStorage.setItem(key, JSON.stringify(gridState))
    } catch (error) {
      console.error("[Storage] Failed to save grid state:", error)
    }
  }

  /**
   * 加载九宫格状态
   */
  static loadGridState(recordId: string): any | null {
    try {
      const key = `${STORAGE_KEY_PREFIX}${recordId}`
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error("[Storage] Failed to load grid state:", error)
      return null
    }
  }

  /**
   * 保存记录元数据
   */
  static saveRecord(record: any): void {
    try {
      const records = this.getAllRecords()
      const index = records.findIndex((r) => r.id === record.id)

      if (index >= 0) {
        records[index] = { ...records[index], ...record, updatedAt: Date.now() }
      } else {
        records.push({ ...record, createdAt: Date.now(), updatedAt: Date.now() })
      }

      localStorage.setItem(SAVED_RECORDS_KEY, JSON.stringify(records))
      this.saveGridState(record.id, record.data)
    } catch (error) {
      console.error("[Storage] Failed to save record:", error)
    }
  }

  /**
   * 获取所有保存的记录
   */
  static getAllRecords(): any[] {
    try {
      const data = localStorage.getItem(SAVED_RECORDS_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error("[Storage] Failed to get records:", error)
      return []
    }
  }

  /**
   * 删除记录
   */
  static deleteRecord(recordId: string): void {
    try {
      const key = `${STORAGE_KEY_PREFIX}${recordId}`
      localStorage.removeItem(key)

      const records = this.getAllRecords()
      const filtered = records.filter((r) => r.id !== recordId)
      localStorage.setItem(SAVED_RECORDS_KEY, JSON.stringify(filtered))
    } catch (error) {
      console.error("[Storage] Failed to delete record:", error)
    }
  }

  /**
   * 清空所有数据
   */
  static clearAll(): void {
    try {
      localStorage.removeItem(SAVED_RECORDS_KEY)
      const keys = Object.keys(localStorage)
      keys.forEach((key) => {
        if (key.startsWith(STORAGE_KEY_PREFIX)) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.error("[Storage] Failed to clear data:", error)
    }
  }
}

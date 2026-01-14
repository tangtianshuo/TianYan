export interface SelectOption {
  id: string
  label: string
  value: string
  disabled?: boolean
}

export interface DropdownState {
  id: string
  selectedValue: string | null
  selectedLabel?: string | null
}

export interface CellState {
  cellId: string
  dropdowns: DropdownState[]
}

export interface GridState {
  timestamp: number
  cells: CellState[]
}

export interface SavedRecord {
  id: string
  name: string
  category: string
  data: GridState
  createdAt?: number
  updatedAt: number
}

export interface AppConfig {
  version: string
  categories: string[]
  dropdownConfigs: Record<string, SelectOption[]>
}

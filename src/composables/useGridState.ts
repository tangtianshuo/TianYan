/**
 * 九宫格状态管理组合式函数
 */

import { ref, computed } from "vue"
import type {
	GridState,
	CellState,
	DropdownState,
	PanStyle,
	DunType,
} from "@/types"
import { StorageManager } from "@/utils/storage"
import { runQiMen, getGridData } from "@/utils/qimen"

const GRID_ROWS = 3
const GRID_COLS = 3
const DROPDOWNS_PER_CELL = 4

export function useGridState() {
	// 初始化网格状态
	const cells = ref<CellState[]>([])
	const selectedValuesMap = ref<Map<string, string>>(new Map())
	const qimenMeta = ref<GridState["qimenMeta"]>()
	const currentQimenResult = ref<any>(null) // 临时存储排盘结果，用于导出

	// 初始化网格
	const initializeGrid = () => {
		cells.value = []
		for (let row = 0; row < GRID_ROWS; row++) {
			for (let col = 0; col < GRID_COLS; col++) {
				const cellId = `cell-${row}-${col}`
				const dropdowns: DropdownState[] = []

				for (let i = 0; i < DROPDOWNS_PER_CELL; i++) {
					dropdowns.push({
						id: `${cellId}-dropdown-${i}`,
						selectedValue: null,
						selectedLabel: null,
					})
				}

				cells.value.push({
					cellId,
					dropdowns,
				})
			}
		}
	}

	// 应用奇门排盘
	const applyQiMenLayout = (
		style: PanStyle,
		dunType: DunType,
		juNum: number,
		shiGan: string,
		shiZhi: string
	) => {
		const result = runQiMen(style, dunType, juNum, shiGan, shiZhi)
		currentQimenResult.value = result // 存储结果
		const gridData = getGridData(result)

		// 更新 Grid Cells
		cells.value = cells.value.map((cell) => {
			const qimenData = gridData.find((d) => d.cellId === cell.cellId)?.qimen
			return {
				...cell,
				qimen: qimenData,
			}
		})

		// 保存元数据
		qimenMeta.value = {
			style,
			dunType,
			juNum,
			shiGan,
			shiZhi: shiZhi, // 注意：shiZhi 参数名需对齐
			xunShou: result.meta.xunShou,
			zhiFu: result.meta.zhiFu,
			zhiShi: result.meta.zhiShi,
		}
	}

	// 更新单个下拉框的值
	const updateDropdownValue = (
		cellId: string,
		dropdownIndex: number,
		value: string | null,
		label: string | null = null
	) => {
		const cell = cells.value.find((c) => c.cellId === cellId)
		if (cell && cell.dropdowns[dropdownIndex]) {
			const oldValue = cell.dropdowns[dropdownIndex].selectedValue

			// 更新映射表
			if (oldValue) {
				selectedValuesMap.value.delete(oldValue)
			}

			cell.dropdowns[dropdownIndex].selectedValue = value
			cell.dropdowns[dropdownIndex].selectedLabel = label || value

			if (value) {
				selectedValuesMap.value.set(value, cellId)
			}
		}
	}

	// 获取当前选中的所有值
	const getAllSelectedValues = (): string[] => {
		const values: string[] = []
		cells.value.forEach((cell) => {
			cell.dropdowns.forEach((dropdown) => {
				if (dropdown.selectedValue) {
					values.push(dropdown.selectedValue)
				}
			})
		})
		return values
	}

	// 获取当前选中的所有值及其来源
	const getSelectedValuesWithLocation = () => {
		const map = new Map<string, string[]>()
		cells.value.forEach((cell) => {
			cell.dropdowns.forEach((dropdown, index) => {
				if (dropdown.selectedValue) {
					const key = `${cell.cellId}-${index}`
					if (!map.has(dropdown.selectedValue)) {
						map.set(dropdown.selectedValue, [])
					}
					map.get(dropdown.selectedValue)?.push(key)
				}
			})
		})
		return map
	}

	// 序列化网格状态为JSON
	const serializeGridState = (): GridState => {
		return {
			cells: cells.value.map((cell) => ({
				...cell,
				dropdowns: cell.dropdowns.map((dd) => ({
					...dd,
				})),
			})),
			timestamp: Date.now(),
			qimenMeta: qimenMeta.value,
		}
	}

	// 反序列化并恢复网格状态
	const deserializeGridState = (state: GridState) => {
		cells.value = state.cells.map((cell) => ({
			...cell,
			dropdowns: cell.dropdowns.map((dd) => ({
				...dd,
			})),
		}))
		qimenMeta.value = state.qimenMeta

		// 重建选中值映射
		selectedValuesMap.value.clear()
		cells.value.forEach((cell) => {
			cell.dropdowns.forEach((dropdown) => {
				if (dropdown.selectedValue) {
					selectedValuesMap.value.set(dropdown.selectedValue, cell.cellId)
				}
			})
		})
	}

	// 打印序列化的JSON到控制台
	const printGridStateToConsole = () => {
		const state = serializeGridState()
		console.log("[九宫格状态]", state)
		console.log(JSON.stringify(state, null, 2))
		return state
	}

	// 保存当前状态
	const saveGridState = (recordName: string, category: string) => {
		const state = serializeGridState()
		const recordId = `${category}-${Date.now()}`

		StorageManager.saveRecord({
			id: recordId,
			name: recordName,
			category,
			data: state,
		})

		return recordId
	}

	// 加载保存的状态
	const loadGridState = (recordId: string) => {
		const state = StorageManager.loadGridState(recordId)
		if (state) {
			deserializeGridState(state)
			return true
		}
		return false
	}

	// 清空网格
	const clearGrid = () => {
		cells.value.forEach((cell) => {
			cell.dropdowns.forEach((dropdown) => {
				dropdown.selectedValue = null
				dropdown.selectedLabel = null
			})
		})
		selectedValuesMap.value.clear()
	}

	// 获取特定单元格的下拉框
	const getCellDropdowns = (cellId: string): DropdownState[] | null => {
		const cell = cells.value.find((c) => c.cellId === cellId)
		return cell?.dropdowns || null
	}

	// 获取单元格的所有选中值
	const getCellSelectedValues = (cellId: string): string[] => {
		const cell = cells.value.find((c) => c.cellId === cellId)
		if (!cell) return []
		return cell.dropdowns
			.map((dd) => dd.selectedValue)
			.filter((v) => v !== null) as string[]
	}

	const gridState = computed(() => ({
		cells: cells.value,
		totalCells: cells.value.length,
		selectedCount: getAllSelectedValues().length,
	}))

	return {
		cells,
		selectedValuesMap,
		initializeGrid,
		updateDropdownValue,
		getAllSelectedValues,
		getSelectedValuesWithLocation,
		serializeGridState,
		deserializeGridState,
		printGridStateToConsole,
		saveGridState,
		loadGridState,
		clearGrid,
		getCellDropdowns,
		getCellSelectedValues,
		gridState,
		applyQiMenLayout,
		qimenMeta,
		currentQimenResult, // 暴露当前的排盘结果对象
	}
}

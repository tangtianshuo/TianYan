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
	// 奇门元素 (可选，用于排盘模式)
	qimen?: {
		diPan?: string // 地盘干
		tianPan?: string // 天盘干
		baMen?: string // 八门
		jiuXing?: string // 九星
		baShen?: string // 八神
		gong?: string // 宫名
	}
}

export type PanStyle = "zhuan" | "fei"
export type DunType = "yang" | "yin"

export interface GridState {
	timestamp: number
	cells: CellState[]
	// 奇门局信息
	qimenMeta?: {
		style: PanStyle // 转盘/飞盘
		dunType: DunType // 阴遁/阳遁
		juNum: number // 局数 1-9
		shiGan?: string // 时干
		shiZhi?: string // 时支
		xunShou?: string // 旬首
		zhiFu?: string // 值符星
		zhiShi?: string // 值使门
	}
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

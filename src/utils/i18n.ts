import { ref, computed } from "vue"

const currentLocale = ref("zh-CN")

const messages = {
	"zh-CN": {
		app: {
			title: "八卦九宫格选择器",
			subtitle: "中式水墨风格配置工具",
			refresh: "刷新配置",
			console: "控制台",
			loading: "加载中...",
			selected: "选中项",
			total: "总项数",
			lastSaved: "最后保存",
		},
		grid: {
			operation: "操作",
			save: "保存",
			export: "输出",
			category: "分类",
			uncategorized: "未分类",
			personal: "个人",
			work: "工作",
			other: "其他",
			configName: "配置名称",
			enterName: "请输入配置名称",
			saveSuccess: "保存成功",
			select: "选择",
			empty: "无可用选项",
			panLayout: "奇门排盘",
			zhuanPan: "转盘奇门",
			feiPan: "飞盘奇门",
			yangDun: "阳遁",
			yinDun: "阴遁",
			ju: "局",
			shiGan: "时干",
			shiZhi: "时支",
			startLayout: "起局",
			reset: "重置",
		},
		tree: {
			title: "保存的配置",
			empty: "暂无保存的配置",
			load: "加载选中配置",
			clearAll: "清空所有",
			confirmDelete: "确定要删除这个配置吗？",
			confirmClear: "确定要清空所有保存的配置吗？这个操作不可撤销。",
		},
	},
	"en-US": {
		app: {
			title: "Bagua Grid Selector",
			subtitle: "Chinese Ink Style Configuration Tool",
			refresh: "Refresh Config",
			console: "Console",
			loading: "Loading...",
			selected: "Selected",
			total: "Total",
			lastSaved: "Last Saved",
		},
		grid: {
			operation: "Action",
			save: "Save",
			export: "Export",
			category: "Category",
			uncategorized: "Uncategorized",
			personal: "Personal",
			work: "Work",
			other: "Other",
			configName: "Config Name",
			enterName: "Enter config name",
			saveSuccess: "Saved successfully",
			select: "Select",
			empty: "No options",
			panLayout: "QiMen Layout",
			zhuanPan: "Zhuan Pan",
			feiPan: "Fei Pan",
			yangDun: "Yang Dun",
			yinDun: "Yin Dun",
			ju: "Ju",
			shiGan: "Time Stem",
			shiZhi: "Time Branch",
			startLayout: "Start",
			reset: "Reset",
		},
		tree: {
			title: "Saved Configs",
			empty: "No saved configs",
			load: "Load Selected",
			clearAll: "Clear All",
			confirmDelete: "Are you sure to delete this config?",
			confirmClear:
				"Are you sure to clear all saved configs? This cannot be undone.",
		},
	},
}

export function useI18n() {
	const t = (key: string) => {
		const keys = key.split(".")
		let value: any = messages[currentLocale.value as keyof typeof messages]

		for (const k of keys) {
			if (value && typeof value === "object" && k in value) {
				value = value[k]
			} else {
				return key
			}
		}

		return value
	}

	const setLocale = (locale: string) => {
		if (locale in messages) {
			currentLocale.value = locale
		}
	}

	return {
		locale: computed({
			get: () => currentLocale.value,
			set: (val) => {
				if (val in messages) {
					currentLocale.value = val
				}
			},
		}),
		t,
		setLocale,
	}
}

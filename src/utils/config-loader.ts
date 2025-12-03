/**
 * 配置文件热加载管理
 */

// 定义本地类型以避免外部依赖
interface SelectOption {
	id: string
	label: string
	value: string
	disabled?: boolean
}

interface ConfigFile {
	version: string
	categories: string[]
	dropdownConfigs: Record<string, SelectOption[]>
}

const CONFIG_URL = "/config/baGua.json"
let cachedConfig: ConfigFile | null = null
let configFetchTime = 0
const CONFIG_CACHE_TIME = 5000 // 5秒缓存

export class ConfigManager {
	private static listeners: Set<() => void> = new Set()

	/**
	 * 加载配置文件
	 */
	static async loadConfig(forceRefresh = false): Promise<ConfigFile> {
		const now = Date.now()

		if (
			!forceRefresh &&
			cachedConfig &&
			now - configFetchTime < CONFIG_CACHE_TIME
		) {
			return cachedConfig
		}

		try {
			const response = await fetch(CONFIG_URL, {
				headers: { "Cache-Control": "no-cache" },
			})

			if (!response.ok) {
				throw new Error(`Failed to load config: ${response.status}`)
			}

			cachedConfig = await response.json()
			configFetchTime = now

			this.notifyListeners()
			return cachedConfig as ConfigFile
		} catch (error) {
			console.error("[ConfigManager] Error loading config:", error)
			// 返回默认配置
			return this.getDefaultConfig()
		}
	}

	/**
	 * 获取指定分类的选项
	 */
	static async getOptionsForCategory(
		categoryKey: string
	): Promise<SelectOption[]> {
		const config = await this.loadConfig()
		return config.dropdownConfigs[categoryKey] || []
	}

	/**
	 * 订阅配置变化
	 */
	static onConfigChange(callback: () => void): () => void {
		this.listeners.add(callback)
		return () => {
			this.listeners.delete(callback)
		}
	}

	/**
	 * 通知监听者配置已更新
	 */
	private static notifyListeners(): void {
		this.listeners.forEach((callback) => {
			try {
				callback()
			} catch (error) {
				console.error("[ConfigManager] Error in listener:", error)
			}
		})
	}

	/**
	 * 强制刷新配置
	 */
	static async refreshConfig(): Promise<ConfigFile> {
		return this.loadConfig(true)
	}

	/**
	 * 获取默认配置
	 */
	private static getDefaultConfig(): ConfigFile {
		return {
			version: "1.0.0",
			categories: ["天干", "地支", "八卦", "五行"],
			dropdownConfigs: {
				天干: [
					{ id: "1", label: "甲", value: "jia", disabled: false },
					{ id: "2", label: "乙", value: "yi", disabled: false },
					{ id: "3", label: "丙", value: "bing", disabled: false },
					{ id: "4", label: "丁", value: "ding", disabled: false },
					{ id: "5", label: "戊", value: "wu", disabled: false },
					{ id: "6", label: "己", value: "ji", disabled: false },
					{ id: "7", label: "庚", value: "geng", disabled: false },
					{ id: "8", label: "辛", value: "xin", disabled: false },
					{ id: "9", label: "壬", value: "ren", disabled: false },
					{ id: "10", label: "癸", value: "gui", disabled: false },
				],
				地支: [
					{ id: "1", label: "子", value: "zi", disabled: false },
					{ id: "2", label: "丑", value: "chou", disabled: false },
					{ id: "3", label: "寅", value: "yin", disabled: false },
					{ id: "4", label: "卯", value: "mao", disabled: false },
					{ id: "5", label: "辰", value: "chen", disabled: false },
					{ id: "6", label: "巳", value: "si", disabled: false },
					{ id: "7", label: "午", value: "wu", disabled: false },
					{ id: "8", label: "未", value: "wei", disabled: false },
					{ id: "9", label: "申", value: "shen", disabled: false },
					{ id: "10", label: "酉", value: "you", disabled: false },
					{ id: "11", label: "戌", value: "xu", disabled: false },
					{ id: "12", label: "亥", value: "hai", disabled: false },
				],
				八卦: [
					{ id: "1", label: "乾", value: "qian", disabled: false },
					{ id: "2", label: "坤", value: "kun", disabled: false },
					{ id: "3", label: "震", value: "zhen", disabled: false },
					{ id: "4", label: "巽", value: "xun", disabled: false },
					{ id: "5", label: "坎", value: "kan", disabled: false },
					{ id: "6", label: "离", value: "li", disabled: false },
					{ id: "7", label: "艮", value: "gen", disabled: false },
					{ id: "8", label: "兑", value: "dui", disabled: false },
				],
				五行: [
					{ id: "1", label: "金", value: "jin", disabled: false },
					{ id: "2", label: "木", value: "mu", disabled: false },
					{ id: "3", label: "水", value: "shui", disabled: false },
					{ id: "4", label: "火", value: "huo", disabled: false },
					{ id: "5", label: "土", value: "tu", disabled: false },
				],
			},
		}
	}
}

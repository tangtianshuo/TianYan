<template>
	<div class="bagua-cell ink-border ink-shadow">
		<div class="cell-header">
			<span class="cell-id">{{ cellId }}</span>
			<span
				v-if="props.overlayLabels?.di"
				class="cell-tag di"
				>地盘：{{ props.overlayLabels?.di }}</span
			>
			<span
				v-if="props.overlayLabels?.tian"
				class="cell-tag tian"
				>天盘：{{ props.overlayLabels?.tian }}</span
			>
			<span
				v-if="props.overlayLabels?.ren"
				class="cell-tag ren"
				>人盘：{{ props.overlayLabels?.ren }}</span
			>
			<span
				v-if="props.overlayLabels?.shen"
				class="cell-tag shen"
				>神盘：{{ props.overlayLabels?.shen }}</span
			>
		</div>

		<div class="cell-content">
			<div
				v-for="(dropdown, index) in dropdowns"
				:key="dropdown.id"
				class="dropdown-wrapper"
			>
				<BaguaSelect
					v-if="cellId !== 'cell-1-1'"
					:id="dropdown.id"
					:model-value="dropdown.selectedValue"
					:options="getFilteredOptions(index)"
					:grouped-options="groupedOptions"
					placeholder="空"
					:custom-class="getCustomClass(index, dropdown.selectedLabel)"
					@update:model-value="(value) => handleSelect(index, value)"
					@blur="
						emit(
							'update',
							index,
							dropdown.selectedValue,
							dropdown.selectedLabel || null
						)
					"
				/>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref, onMounted } from "vue"
	import BaguaSelect from "./BaguaSelect.vue"
	import type { SelectOption, DropdownState, AppConfig } from "@/types"
	import { ConfigManager } from "@/utils/config-loader"
	import { JIU_XING_WUXING, BA_MEN_WUXING, WUXING } from "@/utils/qimen"

	interface Props {
		cellId: string
		dropdowns: DropdownState[]
		selectedValues: string[]
		disabledValues: string[]
		overlayLabels?: { di?: string; tian?: string; ren?: string; shen?: string }
	}

	interface Emits {
		(
			e: "update",
			index: number,
			value: string | null,
			label: string | null
		): void
	}

	const props = defineProps<Props>()
	const emit = defineEmits<Emits>()

	const allOptions = ref<SelectOption[][]>([])
	const config = ref<AppConfig | null>(null)
	const groupedOptions = ref<Record<string, SelectOption[]>>({})

	const getFilteredOptions = (index: number): SelectOption[] => {
		const options = allOptions.value[index] || []
		// 过滤掉已选择的值，但保留当前单元格已选择的值
		return options.map((opt) => ({
			...opt,
			disabled:
				props.disabledValues.includes(opt.value) &&
				props.dropdowns[index]?.selectedValue !== opt.value,
		}))
	}

	const handleSelect = async (index: number, value: string | null) => {
		// 优先从当前下拉框的 options 中查找
		let option = allOptions.value[index]?.find((o) => o.value === value)

		// 如果没找到，尝试从 groupedOptions 中查找
		if (!option && groupedOptions.value) {
			for (const key in groupedOptions.value) {
				option = groupedOptions.value[key].find((o) => o.value === value)
				if (option) break
			}
		}

		const label = option?.label || null
		emit("update", index, value, label)
	}

	const getCustomClass = (index: number, label: string | null | undefined) => {
		if (!label) return ""
		let wx = ""
		// Index 2: BaMen, Index 3: JiuXing
		if (index === 2) {
			wx = BA_MEN_WUXING[label]
		} else if (index === 3) {
			wx = JIU_XING_WUXING[label]
		}

		if (wx) {
			return `text-wuxing-${wx}`
		}
		return ""
	}

	const loadConfig = async () => {
		try {
			config.value = await ConfigManager.loadConfig()
			const jiuGong = await ConfigManager.getOptionsForCategory("九宫")
			const baShen = await ConfigManager.getOptionsForCategory("八神")
			const baMen = await ConfigManager.getOptionsForCategory("八门")
			const liuYi = await ConfigManager.getOptionsForCategory("六仪")
			const sanQi = await ConfigManager.getOptionsForCategory("三奇")
			groupedOptions.value = {
				九宫: jiuGong,
				八神: baShen,
				八门: baMen,
				六仪三奇: [...liuYi, ...sanQi],
			}
			allOptions.value = [baMen, liuYi, sanQi, jiuGong]
		} catch (error) {
			console.error("[BaguaCell] Error loading config:", error)
		}
	}

	onMounted(() => {
		loadConfig()
	})
</script>

<style scoped lang="css">
	.bagua-cell {
		background-color: var(--color-card);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		overflow: visible;
		transition: all 0.3s ease;
		display: flex;
		flex-direction: column;
		min-height: 200px;
	}

	.bagua-cell:hover {
		border-color: var(--color-primary);
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
	}

	.cell-header {
		padding: 0.5rem 0.75rem;
		background-color: var(--color-sidebar);
		border-bottom: 1px solid var(--color-border);
	}

	.cell-id {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-muted-foreground);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.cell-tag {
		margin-left: 0.5rem;
		padding: 0.125rem 0.375rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		color: var(--color-foreground);
		background-color: var(--color-card);
	}

	.cell-content {
		flex: 1;
		padding: 0.75rem;
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: repeat(4, auto);
		gap: 0.5rem;
		align-content: start;
	}

	.dropdown-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.bagua-cell {
		aspect-ratio: 1 / 1;
	}

	.cell-tag.di {
		color: #1e3a8a;
		border-color: #1e3a8a;
	}
	.cell-tag.tian {
		color: #b91c1c;
		border-color: #b91c1c;
	}
	.cell-tag.ren {
		color: #166534;
		border-color: #166534;
	}
	.cell-tag.shen {
		color: #6b21a8;
		border-color: #6b21a8;
	}

	@media (max-width: 768px) {
		.cell-content {
			grid-template-columns: 1fr;
		}
	}
</style>

<style>
	/* 五行颜色 (全局工具类) */
	.text-wuxing-water {
		color: #000000 !important;
		font-weight: bold;
	}
	.text-wuxing-fire {
		color: #d93025 !important;
		font-weight: bold;
	}
	.text-wuxing-wood {
		color: #188038 !important;
		font-weight: bold;
	}
	.text-wuxing-metal {
		color: #e37400 !important;
		font-weight: bold;
	}
	.text-wuxing-earth {
		color: #8d6e63 !important;
		font-weight: bold;
	}
</style>

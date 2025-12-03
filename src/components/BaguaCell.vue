<template>
	<div class="bagua-cell ink-border ink-shadow">
		<div class="cell-header">
			<span class="cell-id">{{ cellId }}</span>
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
					placeholder="选择"
					@update:model-value="(value) => handleSelect(index, value)"
				/>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref, onMounted } from "vue"
	import BaguaSelect from "./BaguaSelect.vue"
	import type { SelectOption, DropdownState } from "@/types"
	import { ConfigManager } from "@/utils/config-loader"

	interface Props {
		cellId: string
		dropdowns: DropdownState[]
		selectedValues: string[]
		disabledValues: string[]
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
	const config = ref<any>(null)

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
		const option = allOptions.value[index]?.find((o) => o.value === value)
		const label = option?.label || null
		emit("update", index, value, label)
	}

	const loadConfig = async () => {
		try {
			config.value = await ConfigManager.loadConfig()
			const categories = config.value?.categories || [
				"天干",
				"地支",
				"八卦",
				"五行",
			]

			// 加载每个分类的选项
			for (const category of categories) {
				const options = await ConfigManager.getOptionsForCategory(category)
				allOptions.value.push(options)
			}
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

	.cell-content {
		flex: 1;
		padding: 0.75rem;
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
		align-content: start;
	}

	.dropdown-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	@media (max-width: 768px) {
		.cell-content {
			grid-template-columns: 1fr;
		}
	}
</style>
